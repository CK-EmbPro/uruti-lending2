import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RevenueTrackingService } from '../revenue-tracking.service';
import { RevenueTracking, RevenueSource, RevenueStatus } from '../../entities/revenue-tracking.entity';
import { Integration } from '../../../integration-hub/entities/integration.entity';
import { BankTransaction } from '../../../open-banking/entities/bank-transaction.entity';
import { IntegrationType } from '../../../integration-hub/entities/integration.entity';

describe('RevenueTrackingService', () => {
  let service: RevenueTrackingService;
  let revenueRepository: Repository<RevenueTracking>;
  let integrationRepository: Repository<Integration>;
  let bankTransactionRepository: Repository<BankTransaction>;

  const mockRevenueRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
  };

  const mockIntegrationRepository = {
    findOne: jest.fn(),
  };

  const mockBankTransactionRepository = {
    find: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RevenueTrackingService,
        {
          provide: getRepositoryToken(RevenueTracking),
          useValue: mockRevenueRepository,
        },
        {
          provide: getRepositoryToken(Integration),
          useValue: mockIntegrationRepository,
        },
        {
          provide: getRepositoryToken(BankTransaction),
          useValue: mockBankTransactionRepository,
        },
      ],
    }).compile();

    service = module.get<RevenueTrackingService>(RevenueTrackingService);
    revenueRepository = module.get<Repository<RevenueTracking>>(getRepositoryToken(RevenueTracking));
    integrationRepository = module.get<Repository<Integration>>(getRepositoryToken(Integration));
    bankTransactionRepository = module.get<Repository<BankTransaction>>(getRepositoryToken(BankTransaction));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('recordRevenue', () => {
    it('should record revenue successfully', async () => {
      const loanId = 'loan-123';
      const companyId = 'company-123';
      const revenueData = {
        amount: 1000,
        date: new Date('2024-01-15'),
        source: RevenueSource.MANUAL_ENTRY,
        description: 'Test revenue',
      };

      const mockRevenue = {
        id: 'revenue-123',
        loanId,
        companyId,
        revenueAmount: revenueData.amount,
        revenueDate: revenueData.date,
        source: revenueData.source,
        status: RevenueStatus.PENDING,
        description: revenueData.description,
      };

      mockRevenueRepository.create.mockReturnValue(mockRevenue);
      mockRevenueRepository.save.mockResolvedValue(mockRevenue);

      const result = await service.recordRevenue(loanId, companyId, revenueData);

      expect(mockRevenueRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          loanId,
          companyId,
          revenueAmount: revenueData.amount,
          revenueDate: revenueData.date,
          source: revenueData.source,
          description: revenueData.description,
          status: RevenueStatus.PENDING,
        }),
      );
      expect(mockRevenueRepository.save).toHaveBeenCalledWith(mockRevenue);
      expect(result).toEqual(mockRevenue);
    });
  });

  describe('getRevenueForPeriod', () => {
    it('should get revenue for a period', async () => {
      const loanId = 'loan-123';
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');

      const mockRevenues = [
        {
          id: 'revenue-1',
          loanId,
          revenueAmount: 1000,
          revenueDate: new Date('2024-01-15'),
          source: RevenueSource.MANUAL_ENTRY,
          status: RevenueStatus.VERIFIED,
        },
        {
          id: 'revenue-2',
          loanId,
          revenueAmount: 2000,
          revenueDate: new Date('2024-01-20'),
          source: RevenueSource.PAYMENT_GATEWAY,
          status: RevenueStatus.VERIFIED,
        },
      ];

      mockRevenueRepository.find.mockResolvedValue(mockRevenues);

      const result = await service.getRevenueForPeriod(loanId, startDate, endDate);

      expect(mockRevenueRepository.find).toHaveBeenCalled();
      expect(result).toEqual(mockRevenues);
    });
  });

  describe('getTotalRevenueForPeriod', () => {
    it('should calculate total revenue for verified entries only', async () => {
      const loanId = 'loan-123';
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');

      const mockRevenues = [
        {
          id: 'revenue-1',
          loanId,
          revenueAmount: 1000,
          revenueDate: new Date('2024-01-15'),
          source: RevenueSource.MANUAL_ENTRY,
          status: RevenueStatus.VERIFIED,
        },
        {
          id: 'revenue-2',
          loanId,
          revenueAmount: 2000,
          revenueDate: new Date('2024-01-20'),
          source: RevenueSource.PAYMENT_GATEWAY,
          status: RevenueStatus.VERIFIED,
        },
        {
          id: 'revenue-3',
          loanId,
          revenueAmount: 500,
          revenueDate: new Date('2024-01-25'),
          source: RevenueSource.MANUAL_ENTRY,
          status: RevenueStatus.PENDING, // Should be excluded
        },
      ];

      mockRevenueRepository.find.mockResolvedValue(mockRevenues);

      const result = await service.getTotalRevenueForPeriod(loanId, startDate, endDate);

      expect(result).toBe(3000); // Only verified entries: 1000 + 2000
    });
  });

  describe('fetchRevenueFromPaymentGateway', () => {
    it('should fetch revenue from payment gateway integration', async () => {
      const integrationId = 'integration-123';
      const loanId = 'loan-123';
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');

      const mockIntegration = {
        id: integrationId,
        type: IntegrationType.PAYMENT_GATEWAY,
        provider: 'Stripe',
        status: 'ACTIVE',
      };

      mockIntegrationRepository.findOne.mockResolvedValue(mockIntegration);

      const result = await service.fetchRevenueFromPaymentGateway(
        integrationId,
        loanId,
        startDate,
        endDate,
      );

      expect(mockIntegrationRepository.findOne).toHaveBeenCalledWith({
        where: { id: integrationId, type: IntegrationType.PAYMENT_GATEWAY },
      });
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });

    it('should throw error if integration not found', async () => {
      const integrationId = 'invalid-id';
      mockIntegrationRepository.findOne.mockResolvedValue(null);

      await expect(
        service.fetchRevenueFromPaymentGateway(
          integrationId,
          'loan-123',
          new Date(),
          new Date(),
        ),
      ).rejects.toThrow('Payment gateway integration');
    });
  });

  describe('fetchRevenueFromBankStatements', () => {
    it('should fetch revenue from bank statements', async () => {
      const bankAccountId = 'bank-account-123';
      const loanId = 'loan-123';
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');

      const mockTransactions = [
        {
          id: 'txn-1',
          accountId: bankAccountId,
          amount: 1000,
          transactionDate: new Date('2024-01-15'),
          description: 'Payment received',
          providerTransactionId: 'ext-123',
          category: 'INCOME',
          merchant: 'Customer A',
        },
        {
          id: 'txn-2',
          accountId: bankAccountId,
          amount: -500, // Debit - should be excluded
          transactionDate: new Date('2024-01-20'),
          description: 'Payment sent',
          providerTransactionId: 'ext-124',
          category: 'EXPENSE',
          merchant: 'Supplier B',
        },
        {
          id: 'txn-3',
          accountId: bankAccountId,
          amount: 2000,
          transactionDate: new Date('2024-01-25'),
          description: 'Payment received',
          providerTransactionId: 'ext-125',
          category: 'INCOME',
          merchant: 'Customer C',
        },
      ];

      mockBankTransactionRepository.find.mockResolvedValue(mockTransactions);

      const result = await service.fetchRevenueFromBankStatements(
        bankAccountId,
        loanId,
        startDate,
        endDate,
      );

      expect(mockBankTransactionRepository.find).toHaveBeenCalled();
      expect(result.length).toBe(2); // Only credit transactions (positive amounts)
      expect(result[0].amount).toBe(1000);
      expect(result[1].amount).toBe(2000);
      expect(result[0].source).toBe(RevenueSource.BANK_STATEMENT);
    });
  });
});

