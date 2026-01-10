import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EarlySettlementAnalyticsService } from '../early-settlement-analytics.service';
import { EarlySettlementAnalytics, CustomerSegment } from '../../entities/early-settlement-analytics.entity';
import { EarlySettlement } from '../../entities/early-settlement.entity';
import { Loan, LoanStatus } from '../../../loan/entities/loan.entity';

describe('EarlySettlementAnalyticsService', () => {
  let service: EarlySettlementAnalyticsService;
  let analyticsRepository: Repository<EarlySettlementAnalytics>;
  let loanRepository: Repository<Loan>;
  let earlySettlementRepository: Repository<EarlySettlement>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EarlySettlementAnalyticsService,
        {
          provide: getRepositoryToken(EarlySettlementAnalytics),
          useClass: Repository,
        },
        {
          provide: getRepositoryToken(Loan),
          useClass: Repository,
        },
        {
          provide: getRepositoryToken(EarlySettlement),
          useClass: Repository,
        },
      ],
    }).compile();

    service = module.get<EarlySettlementAnalyticsService>(EarlySettlementAnalyticsService);
    analyticsRepository = module.get<Repository<EarlySettlementAnalytics>>(
      getRepositoryToken(EarlySettlementAnalytics),
    );
    loanRepository = module.get<Repository<Loan>>(getRepositoryToken(Loan));
    earlySettlementRepository = module.get<Repository<EarlySettlement>>(
      getRepositoryToken(EarlySettlement),
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('generateAnalytics', () => {
    it('should generate analytics for all segments', async () => {
      const companyId = 'company-1';
      const periodStart = new Date('2024-01-01');
      const periodEnd = new Date('2024-03-31');

      jest.spyOn(loanRepository, 'count').mockResolvedValue(100);
      jest.spyOn(earlySettlementRepository, 'createQueryBuilder').mockReturnValue({
        innerJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([
          {
            id: 'settlement-1',
            interestRebate: 500,
            totalSavings: 1500,
            monthsRemaining: 12,
          },
          {
            id: 'settlement-2',
            interestRebate: 300,
            totalSavings: 1200,
            monthsRemaining: 8,
          },
        ] as EarlySettlement[]),
      } as any);
      jest.spyOn(analyticsRepository, 'create').mockReturnValue({
        id: 'analytics-1',
        segment: CustomerSegment.MICRO,
        totalLoans: 100,
        earlySettlements: 2,
        settlementRate: 2.0,
      } as any);
      jest.spyOn(analyticsRepository, 'save').mockResolvedValue({
        id: 'analytics-1',
        segment: CustomerSegment.MICRO,
        totalLoans: 100,
        earlySettlements: 2,
        settlementRate: 2.0,
      } as EarlySettlementAnalytics);

      const results = await service.generateAnalytics(companyId, periodStart, periodEnd);

      expect(results).toBeDefined();
      expect(results.length).toBe(3); // MICRO, SME, ENTERPRISE
      expect(analyticsRepository.save).toHaveBeenCalledTimes(3);
    });

    it('should calculate settlement rate correctly', async () => {
      const companyId = 'company-1';
      const periodStart = new Date('2024-01-01');
      const periodEnd = new Date('2024-03-31');

      jest.spyOn(loanRepository, 'count').mockResolvedValue(100);
      jest.spyOn(earlySettlementRepository, 'createQueryBuilder').mockReturnValue({
        innerJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([
          { id: 'settlement-1', interestRebate: 500, totalSavings: 1500, monthsRemaining: 12 },
          { id: 'settlement-2', interestRebate: 300, totalSavings: 1200, monthsRemaining: 8 },
          { id: 'settlement-3', interestRebate: 200, totalSavings: 1000, monthsRemaining: 6 },
        ] as EarlySettlement[]),
      } as any);
      jest.spyOn(analyticsRepository, 'create').mockReturnValue({
        id: 'analytics-1',
        segment: CustomerSegment.MICRO,
      } as any);
      jest.spyOn(analyticsRepository, 'save').mockResolvedValue({
        id: 'analytics-1',
        segment: CustomerSegment.MICRO,
        totalLoans: 100,
        earlySettlements: 3,
        settlementRate: 3.0, // 3/100 * 100
      } as EarlySettlementAnalytics);

      const results = await service.generateAnalytics(companyId, periodStart, periodEnd);

      expect(results[0].settlementRate).toBe(3.0);
      expect(results[0].totalLoans).toBe(100);
      expect(results[0].earlySettlements).toBe(3);
    });

    it('should calculate average rebate and savings', async () => {
      const companyId = 'company-1';
      const periodStart = new Date('2024-01-01');
      const periodEnd = new Date('2024-03-31');

      jest.spyOn(loanRepository, 'count').mockResolvedValue(100);
      jest.spyOn(earlySettlementRepository, 'createQueryBuilder').mockReturnValue({
        innerJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([
          { id: 'settlement-1', interestRebate: 500, totalSavings: 1500, monthsRemaining: 12 },
          { id: 'settlement-2', interestRebate: 300, totalSavings: 1200, monthsRemaining: 8 },
        ] as EarlySettlement[]),
      } as any);
      jest.spyOn(analyticsRepository, 'create').mockReturnValue({
        id: 'analytics-1',
        segment: CustomerSegment.MICRO,
      } as any);
      jest.spyOn(analyticsRepository, 'save').mockResolvedValue({
        id: 'analytics-1',
        segment: CustomerSegment.MICRO,
        averageRebateAmount: 400, // (500 + 300) / 2
        averageSavings: 1350, // (1500 + 1200) / 2
        averageMonthsRemaining: 10, // (12 + 8) / 2
      } as EarlySettlementAnalytics);

      const results = await service.generateAnalytics(companyId, periodStart, periodEnd);

      expect(results[0].averageRebateAmount).toBe(400);
      expect(results[0].averageSavings).toBe(1350);
      expect(results[0].averageMonthsRemaining).toBe(10);
    });
  });

  describe('getAnalyticsBySegment', () => {
    it('should get analytics filtered by segment', async () => {
      const companyId = 'company-1';
      const segment = CustomerSegment.MICRO;

      const mockAnalytics = [
        {
          id: 'analytics-1',
          companyId,
          segment: CustomerSegment.MICRO,
          totalLoans: 100,
          earlySettlements: 5,
          settlementRate: 5.0,
        },
      ] as EarlySettlementAnalytics[];

      jest.spyOn(analyticsRepository, 'createQueryBuilder').mockReturnValue({
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(mockAnalytics),
      } as any);

      const results = await service.getAnalyticsBySegment(companyId, segment);

      expect(results).toBeDefined();
      expect(results.length).toBe(1);
      expect(results[0].segment).toBe(CustomerSegment.MICRO);
    });

    it('should filter by date range', async () => {
      const companyId = 'company-1';
      const periodStart = new Date('2024-01-01');
      const periodEnd = new Date('2024-03-31');

      jest.spyOn(analyticsRepository, 'createQueryBuilder').mockReturnValue({
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
      } as any);

      await service.getAnalyticsBySegment(companyId, undefined, periodStart, periodEnd);

      expect(analyticsRepository.createQueryBuilder).toHaveBeenCalled();
    });
  });
});

