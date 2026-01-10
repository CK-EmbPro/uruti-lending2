import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EarlySettlementDailyCalculationService } from '../early-settlement-daily-calculation.service';
import { EarlySettlementDailyCalculation } from '../../entities/early-settlement-daily-calculation.entity';
import { Loan, LoanStatus } from '../../../loan/entities/loan.entity';
import { PayoffQuoteService } from '../payoff-quote.service';
import { EarlySettlementRebateService } from '../early-settlement-rebate.service';

describe('EarlySettlementDailyCalculationService', () => {
  let service: EarlySettlementDailyCalculationService;
  let dailyCalculationRepository: Repository<EarlySettlementDailyCalculation>;
  let loanRepository: Repository<Loan>;
  let rebateService: EarlySettlementRebateService;

  const mockLoan: Partial<Loan> = {
    id: 'loan-1',
    loanNumber: 'LN-001',
    companyId: 'company-1',
    loanAmount: 100000,
    totalPrincipalPaid: 0,
    rateOfInterest: 12,
    repaymentPeriods: 24,
    disbursementDate: new Date('2024-01-01'),
    postingDate: new Date('2024-01-01'),
    status: LoanStatus.ACTIVE,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EarlySettlementDailyCalculationService,
        {
          provide: getRepositoryToken(EarlySettlementDailyCalculation),
          useClass: Repository,
        },
        {
          provide: getRepositoryToken(Loan),
          useClass: Repository,
        },
        {
          provide: PayoffQuoteService,
          useValue: {
            generateQuote: jest.fn(),
          },
        },
        {
          provide: EarlySettlementRebateService,
          useValue: {
            calculateRebate: jest.fn().mockReturnValue({
              rebateAmount: 500,
              rebatePercentage: 50,
              monthsRemaining: 22,
              daysRemaining: 660,
              originalPayoffAmount: 101000,
              rebatedPayoffAmount: 100500,
              totalSavings: 1500,
            }),
          },
        },
      ],
    }).compile();

    service = module.get<EarlySettlementDailyCalculationService>(EarlySettlementDailyCalculationService);
    dailyCalculationRepository = module.get<Repository<EarlySettlementDailyCalculation>>(
      getRepositoryToken(EarlySettlementDailyCalculation),
    );
    loanRepository = module.get<Repository<Loan>>(getRepositoryToken(Loan));
    rebateService = module.get<EarlySettlementRebateService>(EarlySettlementRebateService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('calculatePayoffForDate', () => {
    it('should calculate payoff for a specific date', async () => {
      const calculationDate = new Date('2024-02-01');

      jest.spyOn(loanRepository, 'findOne').mockResolvedValue(mockLoan as Loan);
      jest.spyOn(dailyCalculationRepository, 'findOne').mockResolvedValue(null);
      jest.spyOn(dailyCalculationRepository, 'create').mockReturnValue({
        id: 'calc-1',
        loanId: 'loan-1',
        calculationDate,
        principalBalance: 100000,
        accruedInterest: 1000,
        interestRebate: 500,
        totalPayoffAmount: 100500,
        originalPayoffAmount: 101000,
        savingsAmount: 1500,
        monthsRemaining: 22,
        rebatePercentage: 50,
        dailyChange: 0,
      } as any);
      jest.spyOn(dailyCalculationRepository, 'save').mockResolvedValue({
        id: 'calc-1',
        loanId: 'loan-1',
        calculationDate,
        principalBalance: 100000,
        accruedInterest: 1000,
        interestRebate: 500,
        totalPayoffAmount: 100500,
        originalPayoffAmount: 101000,
        savingsAmount: 1500,
        monthsRemaining: 22,
        rebatePercentage: 50,
        dailyChange: 0,
      } as EarlySettlementDailyCalculation);

      const result = await service.calculatePayoffForDate('loan-1', calculationDate);

      expect(result).toBeDefined();
      expect(result.date).toEqual(calculationDate);
      expect(result.principalBalance).toBe(100000);
      expect(result.interestRebate).toBe(500);
      expect(result.totalPayoffAmount).toBe(100500);
      expect(result.rebatePercentage).toBe(50);
    });

    it('should calculate daily change from previous day', async () => {
      const calculationDate = new Date('2024-02-02');
      const previousCalculation = {
        id: 'calc-1',
        totalPayoffAmount: 100510,
      } as EarlySettlementDailyCalculation;

      jest.spyOn(loanRepository, 'findOne').mockResolvedValue(mockLoan as Loan);
      jest.spyOn(dailyCalculationRepository, 'findOne').mockResolvedValue(previousCalculation);
      jest.spyOn(dailyCalculationRepository, 'create').mockReturnValue({
        id: 'calc-2',
        totalPayoffAmount: 100500,
        dailyChange: -10,
      } as any);
      jest.spyOn(dailyCalculationRepository, 'save').mockResolvedValue({
        id: 'calc-2',
        totalPayoffAmount: 100500,
        dailyChange: -10,
      } as EarlySettlementDailyCalculation);

      const result = await service.calculatePayoffForDate('loan-1', calculationDate);

      expect(result.dailyChange).toBeLessThan(0); // Amount decreased
    });
  });

  describe('calculateDailyPayoffsForRange', () => {
    it('should calculate payoffs for date range', async () => {
      const startDate = new Date('2024-02-01');
      const endDate = new Date('2024-02-07'); // 7 days

      jest.spyOn(loanRepository, 'findOne').mockResolvedValue(mockLoan as Loan);
      jest.spyOn(dailyCalculationRepository, 'findOne').mockResolvedValue(null);
      jest.spyOn(dailyCalculationRepository, 'create').mockReturnValue({
        id: 'calc-1',
        calculationDate: startDate,
        totalPayoffAmount: 100500,
      } as any);
      jest.spyOn(dailyCalculationRepository, 'save').mockResolvedValue({
        id: 'calc-1',
        calculationDate: startDate,
        totalPayoffAmount: 100500,
      } as EarlySettlementDailyCalculation);

      const results = await service.calculateDailyPayoffsForRange('loan-1', startDate, endDate);

      expect(results).toBeDefined();
      expect(results.length).toBe(7); // 7 days
      expect(dailyCalculationRepository.save).toHaveBeenCalledTimes(7);
    });

    it('should handle date range with decreasing amounts', async () => {
      const startDate = new Date('2024-02-01');
      const endDate = new Date('2024-02-07');

      jest.spyOn(loanRepository, 'findOne').mockResolvedValue(mockLoan as Loan);
      jest.spyOn(dailyCalculationRepository, 'findOne').mockImplementation((options: any) => {
        // Return previous day's calculation with decreasing amount
        const date = options.where.calculationDate;
        const prevDate = new Date(date);
        prevDate.setDate(prevDate.getDate() - 1);
        if (prevDate >= startDate) {
          return Promise.resolve({
            id: 'calc-prev',
            totalPayoffAmount: 100500 + 10, // Previous day was higher
          } as EarlySettlementDailyCalculation);
        }
        return Promise.resolve(null);
      });
      jest.spyOn(dailyCalculationRepository, 'create').mockReturnValue({
        id: 'calc-1',
        totalPayoffAmount: 100500,
        dailyChange: -10,
      } as any);
      jest.spyOn(dailyCalculationRepository, 'save').mockResolvedValue({
        id: 'calc-1',
        totalPayoffAmount: 100500,
        dailyChange: -10,
      } as EarlySettlementDailyCalculation);

      const results = await service.calculateDailyPayoffsForRange('loan-1', startDate, endDate);

      expect(results.length).toBe(7);
      // Verify amounts decrease daily
      results.forEach((result, index) => {
        if (index > 0) {
          expect(result.totalPayoffAmount).toBeLessThanOrEqual(
            results[index - 1].totalPayoffAmount,
          );
        }
      });
    });
  });

  describe('getDailyCalculations', () => {
    it('should get daily calculations for loan', async () => {
      const mockCalculations = [
        {
          id: 'calc-1',
          loanId: 'loan-1',
          calculationDate: new Date('2024-02-01'),
          totalPayoffAmount: 100500,
        },
        {
          id: 'calc-2',
          loanId: 'loan-1',
          calculationDate: new Date('2024-02-02'),
          totalPayoffAmount: 100490,
        },
      ] as EarlySettlementDailyCalculation[];

      jest.spyOn(dailyCalculationRepository, 'createQueryBuilder').mockReturnValue({
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(mockCalculations),
      } as any);

      const results = await service.getDailyCalculations('loan-1');

      expect(results).toBeDefined();
      expect(results.length).toBe(2);
    });

    it('should filter by date range', async () => {
      const startDate = new Date('2024-02-01');
      const endDate = new Date('2024-02-07');

      jest.spyOn(dailyCalculationRepository, 'createQueryBuilder').mockReturnValue({
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
      } as any);

      await service.getDailyCalculations('loan-1', startDate, endDate);

      expect(dailyCalculationRepository.createQueryBuilder).toHaveBeenCalled();
    });
  });

  describe('getLatestCalculation', () => {
    it('should get latest calculation for loan', async () => {
      const mockCalculation = {
        id: 'calc-1',
        loanId: 'loan-1',
        calculationDate: new Date('2024-02-07'),
        totalPayoffAmount: 100450,
      } as EarlySettlementDailyCalculation;

      jest.spyOn(dailyCalculationRepository, 'findOne').mockResolvedValue(mockCalculation);

      const result = await service.getLatestCalculation('loan-1');

      expect(result).toBeDefined();
      expect(result?.id).toBe('calc-1');
    });

    it('should return null if no calculation exists', async () => {
      jest.spyOn(dailyCalculationRepository, 'findOne').mockResolvedValue(null);

      const result = await service.getLatestCalculation('loan-1');

      expect(result).toBeNull();
    });
  });
});

