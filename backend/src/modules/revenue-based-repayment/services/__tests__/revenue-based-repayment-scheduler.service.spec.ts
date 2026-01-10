import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RevenueBasedRepaymentSchedulerService } from '../revenue-based-repayment-scheduler.service';
import { RevenueBasedRepaymentConfig } from '../../entities/revenue-based-repayment-config.entity';
import { Loan } from '../../../loan/entities/loan.entity';
import { RevenueBasedRepaymentCalculatorService } from '../revenue-based-repayment-calculator.service';
import { LoanRepaymentService } from '../../../loan-repayment/loan-repayment.service';
import { LoanStatus } from '../../../../common/enums/loan-status.enum';
import { RevenuePeriod } from '../../entities/revenue-based-repayment-config.entity';
import { RepaymentType } from '../../../../common/enums/repayment-type.enum';

describe('RevenueBasedRepaymentSchedulerService', () => {
  let service: RevenueBasedRepaymentSchedulerService;
  let configRepository: Repository<RevenueBasedRepaymentConfig>;
  let loanRepository: Repository<Loan>;
  let calculatorService: RevenueBasedRepaymentCalculatorService;
  let repaymentService: LoanRepaymentService;

  const mockConfigRepository = {
    find: jest.fn(),
  };

  const mockLoanRepository = {
    findOne: jest.fn(),
  };

  const mockCalculatorService = {
    getPeriodDates: jest.fn(),
    calculateRepayment: jest.fn(),
  };

  const mockRepaymentService = {
    create: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RevenueBasedRepaymentSchedulerService,
        {
          provide: getRepositoryToken(RevenueBasedRepaymentConfig),
          useValue: mockConfigRepository,
        },
        {
          provide: getRepositoryToken(Loan),
          useValue: mockLoanRepository,
        },
        {
          provide: RevenueBasedRepaymentCalculatorService,
          useValue: mockCalculatorService,
        },
        {
          provide: LoanRepaymentService,
          useValue: mockRepaymentService,
        },
      ],
    }).compile();

    service = module.get<RevenueBasedRepaymentSchedulerService>(
      RevenueBasedRepaymentSchedulerService,
    );
    configRepository = module.get<Repository<RevenueBasedRepaymentConfig>>(
      getRepositoryToken(RevenueBasedRepaymentConfig),
    );
    loanRepository = module.get<Repository<Loan>>(getRepositoryToken(Loan));
    calculatorService = module.get<RevenueBasedRepaymentCalculatorService>(
      RevenueBasedRepaymentCalculatorService,
    );
    repaymentService = module.get<LoanRepaymentService>(LoanRepaymentService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('autoCalculateRepayments', () => {
    it('should auto-calculate and create repayments for active loans', async () => {
      const mockConfigs = [
        {
          id: 'config-1',
          loanId: 'loan-1',
          autoCalculate: true,
          revenuePeriod: RevenuePeriod.MONTHLY,
        },
        {
          id: 'config-2',
          loanId: 'loan-2',
          autoCalculate: true,
          revenuePeriod: RevenuePeriod.MONTHLY,
        },
      ];

      const mockLoan1 = {
        id: 'loan-1',
        companyId: 'company-123',
        status: LoanStatus.ACTIVE,
      };

      const mockLoan2 = {
        id: 'loan-2',
        companyId: 'company-123',
        status: LoanStatus.DISBURSED,
      };

      const mockPeriod = {
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-31'),
      };

      const mockCalculation1 = {
        finalAmount: 1000,
        revenueAmount: 10000,
        repaymentPercentage: 10,
        floorApplied: false,
        ceilingApplied: false,
      };

      const mockCalculation2 = {
        finalAmount: 500,
        revenueAmount: 5000,
        repaymentPercentage: 10,
        floorApplied: false,
        ceilingApplied: false,
      };

      mockConfigRepository.find.mockResolvedValue(mockConfigs);
      mockLoanRepository.findOne
        .mockResolvedValueOnce(mockLoan1)
        .mockResolvedValueOnce(mockLoan2);
      mockCalculatorService.getPeriodDates.mockReturnValue(mockPeriod);
      mockCalculatorService.calculateRepayment
        .mockResolvedValueOnce(mockCalculation1)
        .mockResolvedValueOnce(mockCalculation2);
      mockRepaymentService.create.mockResolvedValue({ id: 'repayment-123' });

      await service.autoCalculateRepayments();

      expect(mockConfigRepository.find).toHaveBeenCalledWith({
        where: { autoCalculate: true },
        relations: ['loan'],
      });
      expect(mockCalculatorService.calculateRepayment).toHaveBeenCalledTimes(2);
      expect(mockRepaymentService.create).toHaveBeenCalledTimes(2);
      expect(mockRepaymentService.create).toHaveBeenCalledWith(
        expect.objectContaining({
          loanId: 'loan-1',
          repaymentType: RepaymentType.NORMAL_REPAYMENT,
          amountPaid: 1000,
          modeOfPayment: 'Revenue-Based Auto',
        }),
        'company-123',
      );
    });

    it('should skip loans with autoCalculate disabled', async () => {
      const mockConfigs = [
        {
          id: 'config-1',
          loanId: 'loan-1',
          autoCalculate: false, // Disabled
        },
      ];

      mockConfigRepository.find.mockResolvedValue(mockConfigs);

      await service.autoCalculateRepayments();

      expect(mockCalculatorService.calculateRepayment).not.toHaveBeenCalled();
      expect(mockRepaymentService.create).not.toHaveBeenCalled();
    });

    it('should skip inactive loans', async () => {
      const mockConfigs = [
        {
          id: 'config-1',
          loanId: 'loan-1',
          autoCalculate: true,
        },
      ];

      const mockLoan = {
        id: 'loan-1',
        status: LoanStatus.CLOSED, // Inactive
      };

      mockConfigRepository.find.mockResolvedValue(mockConfigs);
      mockLoanRepository.findOne.mockResolvedValue(mockLoan);

      await service.autoCalculateRepayments();

      expect(mockCalculatorService.calculateRepayment).not.toHaveBeenCalled();
      expect(mockRepaymentService.create).not.toHaveBeenCalled();
    });

    it('should skip loans with zero repayment amount', async () => {
      const mockConfigs = [
        {
          id: 'config-1',
          loanId: 'loan-1',
          autoCalculate: true,
          revenuePeriod: RevenuePeriod.MONTHLY,
        },
      ];

      const mockLoan = {
        id: 'loan-1',
        companyId: 'company-123',
        status: LoanStatus.ACTIVE,
      };

      const mockPeriod = {
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-31'),
      };

      const mockCalculation = {
        finalAmount: 0, // Zero amount
        revenueAmount: 0,
        repaymentPercentage: 10,
        floorApplied: false,
        ceilingApplied: false,
      };

      mockConfigRepository.find.mockResolvedValue(mockConfigs);
      mockLoanRepository.findOne.mockResolvedValue(mockLoan);
      mockCalculatorService.getPeriodDates.mockReturnValue(mockPeriod);
      mockCalculatorService.calculateRepayment.mockResolvedValue(mockCalculation);

      await service.autoCalculateRepayments();

      expect(mockCalculatorService.calculateRepayment).toHaveBeenCalled();
      expect(mockRepaymentService.create).not.toHaveBeenCalled(); // Should skip zero amount
    });

    it('should handle errors gracefully', async () => {
      const mockConfigs = [
        {
          id: 'config-1',
          loanId: 'loan-1',
          autoCalculate: true,
          revenuePeriod: RevenuePeriod.MONTHLY,
        },
      ];

      const mockLoan = {
        id: 'loan-1',
        companyId: 'company-123',
        status: LoanStatus.ACTIVE,
      };

      mockConfigRepository.find.mockResolvedValue(mockConfigs);
      mockLoanRepository.findOne.mockResolvedValue(mockLoan);
      mockCalculatorService.getPeriodDates.mockImplementation(() => {
        throw new Error('Calculation error');
      });

      // Should not throw, but log error
      await expect(service.autoCalculateRepayments()).resolves.not.toThrow();
    });
  });
});

