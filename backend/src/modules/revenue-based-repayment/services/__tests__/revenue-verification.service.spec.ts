import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RevenueVerificationService } from '../revenue-verification.service';
import { RevenueVerification, VerificationStatus, DiscrepancyType } from '../../entities/revenue-verification.entity';
import { RevenueTracking, RevenueStatus } from '../../entities/revenue-tracking.entity';
import { BankTransaction } from '../../../open-banking/entities/bank-transaction.entity';
import { RevenueBasedRepaymentConfig } from '../../entities/revenue-based-repayment-config.entity';

describe('RevenueVerificationService', () => {
  let service: RevenueVerificationService;
  let verificationRepository: Repository<RevenueVerification>;
  let revenueTrackingRepository: Repository<RevenueTracking>;
  let bankTransactionRepository: Repository<BankTransaction>;
  let configRepository: Repository<RevenueBasedRepaymentConfig>;

  const mockVerificationRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
  };

  const mockRevenueTrackingRepository = {
    findOne: jest.fn(),
    save: jest.fn(),
  };

  const mockBankTransactionRepository = {
    find: jest.fn(),
  };

  const mockConfigRepository = {
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RevenueVerificationService,
        {
          provide: getRepositoryToken(RevenueVerification),
          useValue: mockVerificationRepository,
        },
        {
          provide: getRepositoryToken(RevenueTracking),
          useValue: mockRevenueTrackingRepository,
        },
        {
          provide: getRepositoryToken(BankTransaction),
          useValue: mockBankTransactionRepository,
        },
        {
          provide: getRepositoryToken(RevenueBasedRepaymentConfig),
          useValue: mockConfigRepository,
        },
      ],
    }).compile();

    service = module.get<RevenueVerificationService>(RevenueVerificationService);
    verificationRepository = module.get<Repository<RevenueVerification>>(
      getRepositoryToken(RevenueVerification),
    );
    revenueTrackingRepository = module.get<Repository<RevenueTracking>>(
      getRepositoryToken(RevenueTracking),
    );
    bankTransactionRepository = module.get<Repository<BankTransaction>>(
      getRepositoryToken(BankTransaction),
    );
    configRepository = module.get<Repository<RevenueBasedRepaymentConfig>>(
      getRepositoryToken(RevenueBasedRepaymentConfig),
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('verifyRevenueAgainstBankStatements', () => {
    it('should verify revenue when amounts match', async () => {
      const revenueTrackingId = 'revenue-123';
      const bankAccountId = 'bank-account-123';

      const mockRevenue = {
        id: revenueTrackingId,
        loanId: 'loan-123',
        companyId: 'company-123',
        revenueAmount: 1000,
        revenueDate: new Date('2024-01-15'),
        status: RevenueStatus.PENDING,
        loan: { id: 'loan-123' },
      };

      const mockBankTransaction = {
        id: 'txn-123',
        accountId: bankAccountId,
        amount: 1000, // Exact match
        transactionDate: new Date('2024-01-15'), // Same date
      };

      const mockConfig = {
        verificationThreshold: 5, // 5%
      };

      mockRevenueTrackingRepository.findOne.mockResolvedValue(mockRevenue);
      mockConfigRepository.findOne.mockResolvedValue(mockConfig);
      mockBankTransactionRepository.find.mockResolvedValue([mockBankTransaction]);

      const mockVerification = {
        id: 'verification-123',
        status: VerificationStatus.VERIFIED,
        discrepancyType: null,
        discrepancyAmount: null,
        discrepancyPercentage: 0,
      };

      mockVerificationRepository.create.mockReturnValue(mockVerification);
      mockVerificationRepository.save.mockResolvedValue(mockVerification);
      mockRevenueTrackingRepository.save.mockResolvedValue({
        ...mockRevenue,
        status: RevenueStatus.VERIFIED,
      });

      const result = await service.verifyRevenueAgainstBankStatements(
        revenueTrackingId,
        bankAccountId,
      );

      expect(result.status).toBe(VerificationStatus.VERIFIED);
      expect(result.discrepancyType).toBeNull();
      expect(result.discrepancyPercentage).toBe(0);
    });

    it('should flag discrepancy when amount mismatch exceeds threshold', async () => {
      const revenueTrackingId = 'revenue-123';
      const bankAccountId = 'bank-account-123';

      const mockRevenue = {
        id: revenueTrackingId,
        loanId: 'loan-123',
        companyId: 'company-123',
        revenueAmount: 1000, // Reported
        revenueDate: new Date('2024-01-15'),
        status: RevenueStatus.PENDING,
        loan: { id: 'loan-123' },
      };

      const mockBankTransaction = {
        id: 'txn-123',
        accountId: bankAccountId,
        amount: 800, // Bank statement shows less (20% difference)
        transactionDate: new Date('2024-01-15'),
      };

      const mockConfig = {
        verificationThreshold: 5, // 5% threshold
      };

      mockRevenueTrackingRepository.findOne.mockResolvedValue(mockRevenue);
      mockConfigRepository.findOne.mockResolvedValue(mockConfig);
      mockBankTransactionRepository.find.mockResolvedValue([mockBankTransaction]);

      const mockVerification = {
        id: 'verification-123',
        status: VerificationStatus.DISCREPANCY,
        discrepancyType: DiscrepancyType.AMOUNT_MISMATCH,
        discrepancyAmount: 200, // 1000 - 800
        discrepancyPercentage: 20, // 20% difference
      };

      mockVerificationRepository.create.mockReturnValue(mockVerification);
      mockVerificationRepository.save.mockResolvedValue(mockVerification);
      mockRevenueTrackingRepository.save.mockResolvedValue({
        ...mockRevenue,
        status: RevenueStatus.DISCREPANCY,
      });

      const result = await service.verifyRevenueAgainstBankStatements(
        revenueTrackingId,
        bankAccountId,
      );

      expect(result.status).toBe(VerificationStatus.DISCREPANCY);
      expect(result.discrepancyType).toBe(DiscrepancyType.AMOUNT_MISMATCH);
      expect(result.discrepancyAmount).toBe(200);
      expect(result.discrepancyPercentage).toBeGreaterThan(5); // Exceeds threshold
    });

    it('should flag discrepancy when date mismatch is significant', async () => {
      const revenueTrackingId = 'revenue-123';
      const bankAccountId = 'bank-account-123';

      const mockRevenue = {
        id: revenueTrackingId,
        loanId: 'loan-123',
        companyId: 'company-123',
        revenueAmount: 1000,
        revenueDate: new Date('2024-01-15'),
        status: RevenueStatus.PENDING,
        loan: { id: 'loan-123' },
      };

      const mockBankTransaction = {
        id: 'txn-123',
        accountId: bankAccountId,
        amount: 1000, // Amount matches
        transactionDate: new Date('2024-01-18'), // 3 days later (> 2 days threshold)
      };

      const mockConfig = {
        verificationThreshold: 5,
      };

      mockRevenueTrackingRepository.findOne.mockResolvedValue(mockRevenue);
      mockConfigRepository.findOne.mockResolvedValue(mockConfig);
      mockBankTransactionRepository.find.mockResolvedValue([mockBankTransaction]);

      const mockVerification = {
        id: 'verification-123',
        status: VerificationStatus.DISCREPANCY,
        discrepancyType: DiscrepancyType.DATE_MISMATCH,
        discrepancyAmount: null,
        discrepancyPercentage: 0,
      };

      mockVerificationRepository.create.mockReturnValue(mockVerification);
      mockVerificationRepository.save.mockResolvedValue(mockVerification);

      const result = await service.verifyRevenueAgainstBankStatements(
        revenueTrackingId,
        bankAccountId,
      );

      expect(result.status).toBe(VerificationStatus.DISCREPANCY);
      expect(result.discrepancyType).toBe(DiscrepancyType.DATE_MISMATCH);
    });

    it('should flag discrepancy when no matching transaction found', async () => {
      const revenueTrackingId = 'revenue-123';
      const bankAccountId = 'bank-account-123';

      const mockRevenue = {
        id: revenueTrackingId,
        loanId: 'loan-123',
        companyId: 'company-123',
        revenueAmount: 1000,
        revenueDate: new Date('2024-01-15'),
        status: RevenueStatus.PENDING,
        loan: { id: 'loan-123' },
      };

      const mockConfig = {
        verificationThreshold: 5,
      };

      mockRevenueTrackingRepository.findOne.mockResolvedValue(mockRevenue);
      mockConfigRepository.findOne.mockResolvedValue(mockConfig);
      mockBankTransactionRepository.find.mockResolvedValue([]); // No transactions found

      const mockVerification = {
        id: 'verification-123',
        status: VerificationStatus.DISCREPANCY,
        discrepancyType: DiscrepancyType.MISSING_TRANSACTION,
        discrepancyAmount: null,
        discrepancyPercentage: null,
      };

      mockVerificationRepository.create.mockReturnValue(mockVerification);
      mockVerificationRepository.save.mockResolvedValue(mockVerification);

      const result = await service.verifyRevenueAgainstBankStatements(
        revenueTrackingId,
        bankAccountId,
      );

      expect(result.status).toBe(VerificationStatus.DISCREPANCY);
      expect(result.discrepancyType).toBe(DiscrepancyType.MISSING_TRANSACTION);
    });

    it('should verify when discrepancy is within threshold', async () => {
      const revenueTrackingId = 'revenue-123';
      const bankAccountId = 'bank-account-123';

      const mockRevenue = {
        id: revenueTrackingId,
        loanId: 'loan-123',
        companyId: 'company-123',
        revenueAmount: 1000,
        revenueDate: new Date('2024-01-15'),
        status: RevenueStatus.PENDING,
        loan: { id: 'loan-123' },
      };

      const mockBankTransaction = {
        id: 'txn-123',
        accountId: bankAccountId,
        amount: 970, // 3% difference (within 5% threshold)
        transactionDate: new Date('2024-01-15'),
      };

      const mockConfig = {
        verificationThreshold: 5,
      };

      mockRevenueTrackingRepository.findOne.mockResolvedValue(mockRevenue);
      mockConfigRepository.findOne.mockResolvedValue(mockConfig);
      mockBankTransactionRepository.find.mockResolvedValue([mockBankTransaction]);

      const mockVerification = {
        id: 'verification-123',
        status: VerificationStatus.VERIFIED,
        discrepancyType: null,
        discrepancyAmount: 30,
        discrepancyPercentage: 3, // Within threshold
      };

      mockVerificationRepository.create.mockReturnValue(mockVerification);
      mockVerificationRepository.save.mockResolvedValue(mockVerification);

      const result = await service.verifyRevenueAgainstBankStatements(
        revenueTrackingId,
        bankAccountId,
      );

      expect(result.status).toBe(VerificationStatus.VERIFIED);
      expect(result.discrepancyPercentage).toBeLessThanOrEqual(5);
    });
  });

  describe('getVerificationHistory', () => {
    it('should get verification history for a loan', async () => {
      const loanId = 'loan-123';
      const mockVerifications = [
        {
          id: 'verification-1',
          loanId,
          status: VerificationStatus.VERIFIED,
        },
        {
          id: 'verification-2',
          loanId,
          status: VerificationStatus.DISCREPANCY,
        },
      ];

      mockVerificationRepository.find.mockResolvedValue(mockVerifications);

      const result = await service.getVerificationHistory(loanId);

      expect(mockVerificationRepository.find).toHaveBeenCalledWith({
        where: { loanId },
        relations: ['revenueTracking'],
        order: { createdAt: 'DESC' },
      });
      expect(result).toEqual(mockVerifications);
    });
  });

  describe('getDiscrepancies', () => {
    it('should get only discrepancies for a loan', async () => {
      const loanId = 'loan-123';
      const mockDiscrepancies = [
        {
          id: 'verification-1',
          loanId,
          status: VerificationStatus.DISCREPANCY,
          discrepancyType: DiscrepancyType.AMOUNT_MISMATCH,
        },
      ];

      mockVerificationRepository.find.mockResolvedValue(mockDiscrepancies);

      const result = await service.getDiscrepancies(loanId);

      expect(mockVerificationRepository.find).toHaveBeenCalledWith({
        where: {
          loanId,
          status: VerificationStatus.DISCREPANCY,
        },
        relations: ['revenueTracking'],
        order: { createdAt: 'DESC' },
      });
      expect(result).toEqual(mockDiscrepancies);
      expect(result.every(v => v.status === VerificationStatus.DISCREPANCY)).toBe(true);
    });
  });
});

