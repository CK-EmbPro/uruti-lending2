import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RevenueBasedRepaymentCalculatorService } from '../revenue-based-repayment-calculator.service';
import { RevenueBasedRepaymentConfig } from '../../entities/revenue-based-repayment-config.entity';
import { RevenueTrackingService } from '../revenue-tracking.service';
import { RevenuePeriod } from '../../entities/revenue-based-repayment-config.entity';

describe('RevenueBasedRepaymentCalculatorService', () => {
  let service: RevenueBasedRepaymentCalculatorService;
  let configRepository: Repository<RevenueBasedRepaymentConfig>;
  let revenueTrackingService: RevenueTrackingService;

  const mockConfigRepository = {
    findOne: jest.fn(),
  };

  const mockRevenueTrackingService = {
    getTotalRevenueForPeriod: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RevenueBasedRepaymentCalculatorService,
        {
          provide: getRepositoryToken(RevenueBasedRepaymentConfig),
          useValue: mockConfigRepository,
        },
        {
          provide: RevenueTrackingService,
          useValue: mockRevenueTrackingService,
        },
      ],
    }).compile();

    service = module.get<RevenueBasedRepaymentCalculatorService>(
      RevenueBasedRepaymentCalculatorService,
    );
    configRepository = module.get<Repository<RevenueBasedRepaymentConfig>>(
      getRepositoryToken(RevenueBasedRepaymentConfig),
    );
    revenueTrackingService = module.get<RevenueTrackingService>(RevenueTrackingService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('calculateRepayment', () => {
    it('should calculate repayment as percentage of revenue', async () => {
      const loanId = 'loan-123';
      const periodStartDate = new Date('2024-01-01');
      const periodEndDate = new Date('2024-01-31');

      const mockConfig = {
        id: 'config-123',
        loanId,
        repaymentPercentage: 10, // 10%
        revenuePeriod: RevenuePeriod.MONTHLY,
        minimumRepaymentAmount: null,
        maximumRepaymentAmount: null,
      };

      mockConfigRepository.findOne.mockResolvedValue(mockConfig);
      mockRevenueTrackingService.getTotalRevenueForPeriod.mockResolvedValue(10000); // $10,000 revenue

      const result = await service.calculateRepayment(loanId, periodStartDate, periodEndDate);

      expect(result.revenueAmount).toBe(10000);
      expect(result.repaymentPercentage).toBe(10);
      expect(result.calculatedAmount).toBe(1000); // 10% of 10,000
      expect(result.finalAmount).toBe(1000);
      expect(result.floorApplied).toBe(false);
      expect(result.ceilingApplied).toBe(false);
    });

    it('should apply floor (minimum) when calculated amount is below minimum', async () => {
      const loanId = 'loan-123';
      const periodStartDate = new Date('2024-01-01');
      const periodEndDate = new Date('2024-01-31');

      const mockConfig = {
        id: 'config-123',
        loanId,
        repaymentPercentage: 5, // 5%
        revenuePeriod: RevenuePeriod.MONTHLY,
        minimumRepaymentAmount: 500, // Floor
        maximumRepaymentAmount: null,
      };

      mockConfigRepository.findOne.mockResolvedValue(mockConfig);
      mockRevenueTrackingService.getTotalRevenueForPeriod.mockResolvedValue(5000); // $5,000 revenue

      const result = await service.calculateRepayment(loanId, periodStartDate, periodEndDate);

      expect(result.revenueAmount).toBe(5000);
      expect(result.calculatedAmount).toBe(250); // 5% of 5,000 = 250
      expect(result.finalAmount).toBe(500); // Floor applied
      expect(result.floorApplied).toBe(true);
      expect(result.ceilingApplied).toBe(false);
    });

    it('should apply ceiling (maximum) when calculated amount exceeds maximum', async () => {
      const loanId = 'loan-123';
      const periodStartDate = new Date('2024-01-01');
      const periodEndDate = new Date('2024-01-31');

      const mockConfig = {
        id: 'config-123',
        loanId,
        repaymentPercentage: 20, // 20%
        revenuePeriod: RevenuePeriod.MONTHLY,
        minimumRepaymentAmount: null,
        maximumRepaymentAmount: 1000, // Ceiling
      };

      mockConfigRepository.findOne.mockResolvedValue(mockConfig);
      mockRevenueTrackingService.getTotalRevenueForPeriod.mockResolvedValue(10000); // $10,000 revenue

      const result = await service.calculateRepayment(loanId, periodStartDate, periodEndDate);

      expect(result.revenueAmount).toBe(10000);
      expect(result.calculatedAmount).toBe(2000); // 20% of 10,000 = 2,000
      expect(result.finalAmount).toBe(1000); // Ceiling applied
      expect(result.floorApplied).toBe(false);
      expect(result.ceilingApplied).toBe(true);
    });

    it('should apply both floor and ceiling when needed', async () => {
      const loanId = 'loan-123';
      const periodStartDate = new Date('2024-01-01');
      const periodEndDate = new Date('2024-01-31');

      const mockConfig = {
        id: 'config-123',
        loanId,
        repaymentPercentage: 15, // 15%
        revenuePeriod: RevenuePeriod.MONTHLY,
        minimumRepaymentAmount: 500, // Floor
        maximumRepaymentAmount: 1000, // Ceiling
      };

      mockConfigRepository.findOne.mockResolvedValue(mockConfig);
      mockRevenueTrackingService.getTotalRevenueForPeriod.mockResolvedValue(10000); // $10,000 revenue

      const result = await service.calculateRepayment(loanId, periodStartDate, periodEndDate);

      expect(result.revenueAmount).toBe(10000);
      expect(result.calculatedAmount).toBe(1500); // 15% of 10,000 = 1,500
      expect(result.finalAmount).toBe(1000); // Ceiling applied (1500 > 1000)
      expect(result.floorApplied).toBe(false); // Floor not applied (1500 > 500)
      expect(result.ceilingApplied).toBe(true);
    });

    it('should handle very low revenue with floor', async () => {
      const loanId = 'loan-123';
      const periodStartDate = new Date('2024-01-01');
      const periodEndDate = new Date('2024-01-31');

      const mockConfig = {
        id: 'config-123',
        loanId,
        repaymentPercentage: 10, // 10%
        revenuePeriod: RevenuePeriod.MONTHLY,
        minimumRepaymentAmount: 100, // Floor
        maximumRepaymentAmount: null,
      };

      mockConfigRepository.findOne.mockResolvedValue(mockConfig);
      mockRevenueTrackingService.getTotalRevenueForPeriod.mockResolvedValue(500); // Very low revenue: $500

      const result = await service.calculateRepayment(loanId, periodStartDate, periodEndDate);

      expect(result.revenueAmount).toBe(500);
      expect(result.calculatedAmount).toBe(50); // 10% of 500 = 50
      expect(result.finalAmount).toBe(100); // Floor applied (50 < 100)
      expect(result.floorApplied).toBe(true);
      expect(result.ceilingApplied).toBe(false);
    });

    it('should handle very high revenue with ceiling', async () => {
      const loanId = 'loan-123';
      const periodStartDate = new Date('2024-01-01');
      const periodEndDate = new Date('2024-01-31');

      const mockConfig = {
        id: 'config-123',
        loanId,
        repaymentPercentage: 10, // 10%
        revenuePeriod: RevenuePeriod.MONTHLY,
        minimumRepaymentAmount: null,
        maximumRepaymentAmount: 5000, // Ceiling
      };

      mockConfigRepository.findOne.mockResolvedValue(mockConfig);
      mockRevenueTrackingService.getTotalRevenueForPeriod.mockResolvedValue(100000); // Very high revenue: $100,000

      const result = await service.calculateRepayment(loanId, periodStartDate, periodEndDate);

      expect(result.revenueAmount).toBe(100000);
      expect(result.calculatedAmount).toBe(10000); // 10% of 100,000 = 10,000
      expect(result.finalAmount).toBe(5000); // Ceiling applied (10,000 > 5,000)
      expect(result.floorApplied).toBe(false);
      expect(result.ceilingApplied).toBe(true);
    });
  });

  describe('getPeriodDates', () => {
    it('should return daily period dates', () => {
      const referenceDate = new Date('2024-01-15');
      const result = service.getPeriodDates(RevenuePeriod.DAILY, referenceDate);

      expect(result.startDate.getHours()).toBe(0);
      expect(result.startDate.getMinutes()).toBe(0);
      expect(result.endDate.getHours()).toBe(23);
      expect(result.endDate.getMinutes()).toBe(59);
    });

    it('should return weekly period dates', () => {
      const referenceDate = new Date('2024-01-15'); // Monday
      const result = service.getPeriodDates(RevenuePeriod.WEEKLY, referenceDate);

      // Should be start of week (Monday) to end of week (Sunday)
      expect(result.startDate.getDay()).toBe(1); // Monday
      expect(result.endDate.getDay()).toBe(0); // Sunday
    });

    it('should return monthly period dates', () => {
      const referenceDate = new Date('2024-01-15');
      const result = service.getPeriodDates(RevenuePeriod.MONTHLY, referenceDate);

      expect(result.startDate.getDate()).toBe(1); // First day of month
      expect(result.startDate.getMonth()).toBe(0); // January
      expect(result.endDate.getMonth()).toBe(0); // January
    });

    it('should return quarterly period dates', () => {
      const referenceDate = new Date('2024-02-15'); // Q1
      const result = service.getPeriodDates(RevenuePeriod.QUARTERLY, referenceDate);

      expect(result.startDate.getMonth()).toBe(0); // January (Q1 start)
      expect(result.endDate.getMonth()).toBe(2); // March (Q1 end)
    });
  });
});

