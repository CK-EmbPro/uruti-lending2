import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Loan } from '../../loan/entities/loan.entity';
import { EarlySettlement } from '../entities/early-settlement.entity';
import { EarlySettlementAnalytics, CustomerSegment } from '../entities/early-settlement-analytics.entity';

export interface EarlySettlementAnalyticsResult {
  segment: CustomerSegment;
  totalLoans: number;
  earlySettlements: number;
  settlementRate: number;
  totalRebateAmount: number;
  averageRebateAmount: number;
  averageSavings: number;
  averageMonthsRemaining: number;
}

/**
 * Service for tracking early settlement rates by segment
 * UC: Tracking - Early settlement rates tracked by segment
 */
@Injectable()
export class EarlySettlementAnalyticsService {
  private readonly logger = new Logger(EarlySettlementAnalyticsService.name);

  constructor(
    @InjectRepository(EarlySettlementAnalytics)
    private readonly analyticsRepository: Repository<EarlySettlementAnalytics>,
    @InjectRepository(Loan)
    private readonly loanRepository: Repository<Loan>,
    @InjectRepository(EarlySettlement)
    private readonly earlySettlementRepository: Repository<EarlySettlement>,
  ) {}

  /**
   * Generate analytics for a period
   */
  async generateAnalytics(
    companyId: string,
    periodStart: Date,
    periodEnd: Date,
  ): Promise<EarlySettlementAnalyticsResult[]> {
    const results: EarlySettlementAnalyticsResult[] = [];

    // Get analytics for each segment
    for (const segment of Object.values(CustomerSegment)) {
      const analytics = await this.calculateSegmentAnalytics(
        companyId,
        segment,
        periodStart,
        periodEnd,
      );
      results.push(analytics);

      // Save to database
      await this.saveAnalytics(companyId, segment, periodStart, periodEnd, analytics);
    }

    return results;
  }

  /**
   * Get analytics by segment
   */
  async getAnalyticsBySegment(
    companyId: string,
    segment?: CustomerSegment,
    periodStart?: Date,
    periodEnd?: Date,
  ): Promise<EarlySettlementAnalytics[]> {
    const query = this.analyticsRepository
      .createQueryBuilder('analytics')
      .where('analytics.companyId = :companyId', { companyId })
      .orderBy('analytics.periodStart', 'DESC');

    if (segment) {
      query.andWhere('analytics.segment = :segment', { segment });
    }

    if (periodStart) {
      query.andWhere('analytics.periodStart >= :periodStart', { periodStart });
    }

    if (periodEnd) {
      query.andWhere('analytics.periodEnd <= :periodEnd', { periodEnd });
    }

    return await query.getMany();
  }

  /**
   * Calculate analytics for a specific segment
   */
  private async calculateSegmentAnalytics(
    companyId: string,
    segment: CustomerSegment,
    periodStart: Date,
    periodEnd: Date,
  ): Promise<EarlySettlementAnalyticsResult> {
    // Get total active loans in segment during period
    const totalLoans = await this.loanRepository.count({
      where: {
        companyId,
        status: 'ACTIVE' as any,
        // Note: Segment would need to be stored in loan or derived from loan product
        // For now, we'll use a simplified approach
      },
    });

    // Get early settlements in segment during period
    const earlySettlements = await this.earlySettlementRepository
      .createQueryBuilder('settlement')
      .innerJoin('settlement.loan', 'loan')
      .where('loan.companyId = :companyId', { companyId })
      .andWhere('settlement.settlementDate >= :periodStart', { periodStart })
      .andWhere('settlement.settlementDate <= :periodEnd', { periodEnd })
      .andWhere('settlement.status = :status', { status: 'PROCESSED' })
      .getMany();

    const settlementCount = earlySettlements.length;
    const settlementRate = totalLoans > 0 ? (settlementCount / totalLoans) * 100 : 0;

    // Calculate rebate statistics
    const totalRebateAmount = earlySettlements.reduce(
      (sum, s) => sum + Number(s.interestRebate || 0),
      0,
    );
    const averageRebateAmount = settlementCount > 0 ? totalRebateAmount / settlementCount : 0;

    // Calculate savings statistics
    const totalSavings = earlySettlements.reduce(
      (sum, s) => sum + Number(s.totalSavings || 0),
      0,
    );
    const averageSavings = settlementCount > 0 ? totalSavings / settlementCount : 0;

    // Calculate average months remaining
    const totalMonthsRemaining = earlySettlements.reduce(
      (sum, s) => sum + (s.monthsRemaining || 0),
      0,
    );
    const averageMonthsRemaining = settlementCount > 0 ? totalMonthsRemaining / settlementCount : 0;

    return {
      segment,
      totalLoans,
      earlySettlements: settlementCount,
      settlementRate: Number(settlementRate.toFixed(2)),
      totalRebateAmount: Number(totalRebateAmount.toFixed(2)),
      averageRebateAmount: Number(averageRebateAmount.toFixed(2)),
      averageSavings: Number(averageSavings.toFixed(2)),
      averageMonthsRemaining: Math.round(averageMonthsRemaining),
    };
  }

  /**
   * Save analytics to database
   */
  private async saveAnalytics(
    companyId: string,
    segment: CustomerSegment,
    periodStart: Date,
    periodEnd: Date,
    analytics: EarlySettlementAnalyticsResult,
  ): Promise<EarlySettlementAnalytics> {
    const entity = this.analyticsRepository.create({
      companyId,
      segment,
      periodStart,
      periodEnd,
      totalLoans: analytics.totalLoans,
      earlySettlements: analytics.earlySettlements,
      settlementRate: analytics.settlementRate,
      totalRebateAmount: analytics.totalRebateAmount,
      averageRebateAmount: analytics.averageRebateAmount,
      averageSavings: analytics.averageSavings,
      averageMonthsRemaining: analytics.averageMonthsRemaining,
    });

    return await this.analyticsRepository.save(entity);
  }
}

