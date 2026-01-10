import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BadRequestException } from '@nestjs/common';
import { RestructureValidationService } from '../restructure-validation.service';
import { LoanRestructure } from '../../entities/loan-restructure.entity';
import { Loan } from '../../../loan/entities/loan.entity';
import { RestructureStatus } from '../../../../common/enums/restructure-type.enum';

describe('RestructureValidationService', () => {
  let service: RestructureValidationService;
  let restructureRepository: Repository<LoanRestructure>;
  let loanRepository: Repository<Loan>;

  const mockRestructureRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    save: jest.fn(),
    count: jest.fn(),
  };

  const mockLoanRepository = {
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RestructureValidationService,
        {
          provide: getRepositoryToken(LoanRestructure),
          useValue: mockRestructureRepository,
        },
        {
          provide: getRepositoryToken(Loan),
          useValue: mockLoanRepository,
        },
      ],
    }).compile();

    service = module.get<RestructureValidationService>(RestructureValidationService);
    restructureRepository = module.get<Repository<LoanRestructure>>(
      getRepositoryToken(LoanRestructure),
    );
    loanRepository = module.get<Repository<Loan>>(getRepositoryToken(Loan));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('validateTenureExtension', () => {
    const loanId = 'loan-123';

    it('should throw error if loan not found', async () => {
      mockLoanRepository.findOne.mockResolvedValue(null);

      await expect(service.validateTenureExtension(loanId, 18)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw error if original tenure is 0', async () => {
      const mockLoan = {
        id: loanId,
        repaymentPeriods: 0,
      } as Loan;

      mockLoanRepository.findOne.mockResolvedValue(mockLoan);

      await expect(service.validateTenureExtension(loanId, 12)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw error if extension exceeds 50%', async () => {
      const mockLoan = {
        id: loanId,
        repaymentPeriods: 12, // Original: 12 months
      } as Loan;

      mockLoanRepository.findOne.mockResolvedValue(mockLoan);

      // Requested: 19 months (7 months extension = 58.3% > 50%)
      await expect(service.validateTenureExtension(loanId, 19)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should allow extension exactly at 50%', async () => {
      const mockLoan = {
        id: loanId,
        repaymentPeriods: 12, // Original: 12 months
      } as Loan;

      mockLoanRepository.findOne.mockResolvedValue(mockLoan);

      // Requested: 18 months (6 months extension = 50%)
      await expect(service.validateTenureExtension(loanId, 18)).resolves.not.toThrow();
    });

    it('should allow extension below 50%', async () => {
      const mockLoan = {
        id: loanId,
        repaymentPeriods: 12, // Original: 12 months
      } as Loan;

      mockLoanRepository.findOne.mockResolvedValue(mockLoan);

      // Requested: 17 months (5 months extension = 41.7% < 50%)
      await expect(service.validateTenureExtension(loanId, 17)).resolves.not.toThrow();
    });

    it('should handle 24-month loan extension correctly', async () => {
      const mockLoan = {
        id: loanId,
        repaymentPeriods: 24, // Original: 24 months
      } as Loan;

      mockLoanRepository.findOne.mockResolvedValue(mockLoan);

      // Max allowed: 36 months (12 months extension = 50%)
      // Requested: 37 months (13 months extension = 54.2% > 50%)
      await expect(service.validateTenureExtension(loanId, 37)).rejects.toThrow(
        BadRequestException,
      );

      // Requested: 36 months (12 months extension = 50%)
      await expect(service.validateTenureExtension(loanId, 36)).resolves.not.toThrow();
    });
  });

  describe('calculateMaxAllowedTenure', () => {
    it('should calculate max allowed tenure correctly', () => {
      expect(service.calculateMaxAllowedTenure(12)).toBe(18); // 12 * 1.5 = 18
      expect(service.calculateMaxAllowedTenure(24)).toBe(36); // 24 * 1.5 = 36
      expect(service.calculateMaxAllowedTenure(6)).toBe(9); // 6 * 1.5 = 9
    });
  });

  describe('calculateExtensionPercentage', () => {
    it('should calculate extension percentage correctly', () => {
      expect(service.calculateExtensionPercentage(12, 18)).toBe(50); // (18-12)/12 * 100 = 50%
      expect(service.calculateExtensionPercentage(12, 17)).toBeCloseTo(41.67, 1); // (17-12)/12 * 100 = 41.67%
      expect(service.calculateExtensionPercentage(24, 36)).toBe(50); // (36-24)/24 * 100 = 50%
      expect(service.calculateExtensionPercentage(12, 19)).toBeCloseTo(58.33, 1); // (19-12)/12 * 100 = 58.33%
    });

    it('should return 0 if original tenure is 0', () => {
      expect(service.calculateExtensionPercentage(0, 12)).toBe(0);
    });
  });

  describe('validateRestructureCount', () => {
    const loanId = 'loan-123';

    it('should allow first restructure (0 approved)', async () => {
      mockRestructureRepository.count.mockResolvedValue(0);

      await expect(service.validateRestructureCount(loanId)).resolves.not.toThrow();
      expect(mockRestructureRepository.count).toHaveBeenCalledWith({
        where: { loanId, status: RestructureStatus.APPROVED },
      });
    });

    it('should allow second restructure (1 approved)', async () => {
      mockRestructureRepository.count.mockResolvedValue(1);

      await expect(service.validateRestructureCount(loanId)).resolves.not.toThrow();
    });

    it('should throw error on third restructure (2 approved)', async () => {
      mockRestructureRepository.count.mockResolvedValue(2);

      await expect(service.validateRestructureCount(loanId)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.validateRestructureCount(loanId)).rejects.toThrow(
        'Maximum of 2 restructures allowed per loan',
      );
    });

    it('should throw error if more than 2 approved restructures exist', async () => {
      mockRestructureRepository.count.mockResolvedValue(3);

      await expect(service.validateRestructureCount(loanId)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('getMaxRestructuresPerLoan', () => {
    it('should return maximum restructures per loan', () => {
      expect(service.getMaxRestructuresPerLoan()).toBe(2);
    });
  });
});

