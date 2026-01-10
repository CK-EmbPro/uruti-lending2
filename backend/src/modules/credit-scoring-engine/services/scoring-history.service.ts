import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan, MoreThan, Between } from 'typeorm';
import { CreditScoreHistory, ScoringTrigger } from '../entities/credit-score-history.entity';
import { WeightedScoringResult } from '../dto/weighted-scoring.dto';

/**
 * Service for managing credit score history
 * Provides audit trail and historical analysis of credit scores
 */
@Injectable()
export class ScoringHistoryService {
  private readonly logger = new Logger(ScoringHistoryService.name);

  constructor(
    @InjectRepository(CreditScoreHistory)
    private readonly historyRepository: Repository<CreditScoreHistory>,
  ) {}

  /**
   * Save scoring result to history
   */
  async saveHistory(
    result: WeightedScoringResult,
    applicantId: string,
    trigger: ScoringTrigger,
    options?: {
      applicationId?: string;
      loanId?: string;
      companyId?: string;
      segment?: string;
      triggerMetadata?: Record<string, any>;
    },
  ): Promise<CreditScoreHistory> {
    // Get previous score for comparison
    const previousHistory = await this.getLatestScore(applicantId, options?.applicationId, options?.loanId);

    const scoreChange = previousHistory
      ? result.finalScore - previousHistory.finalScore
      : null;

    const history = this.historyRepository.create({
      applicantId,
      applicationId: options?.applicationId,
      loanId: options?.loanId,
      finalScore: result.finalScore,
      previousScore: previousHistory?.finalScore || null,
      scoreChange: scoreChange || null,
      trigger,
      triggerMetadata: options?.triggerMetadata || null,
      scoreBreakdown: result.scoreBreakdown,
      weights: result.weights,
      segment: options?.segment || result.segment || null,
      confidence: result.confidence,
      riskTier: result.riskTier,
      mlScore: result.mlScore || null,
      explanation: result.explanation,
      processingTimeMs: result.processingTimeMs,
      calculatedAt: result.calculatedAt,
      companyId: options?.companyId || null,
    });

    const saved = await this.historyRepository.save(history);

    this.logger.log(
      `Saved scoring history for applicant ${applicantId} (trigger: ${trigger}, score: ${result.finalScore}, change: ${scoreChange || 'N/A'})`,
    );

    return saved;
  }

  /**
   * Get latest score for an applicant
   */
  async getLatestScore(
    applicantId: string,
    applicationId?: string,
    loanId?: string,
  ): Promise<CreditScoreHistory | null> {
    const query = this.historyRepository.createQueryBuilder('history')
      .where('history.applicantId = :applicantId', { applicantId });

    if (applicationId) {
      query.andWhere('history.applicationId = :applicationId', { applicationId });
    }

    if (loanId) {
      query.andWhere('history.loanId = :loanId', { loanId });
    }

    return await query
      .orderBy('history.calculatedAt', 'DESC')
      .getOne();
  }

  /**
   * Get scoring history for an applicant
   */
  async getHistory(
    applicantId: string,
    options?: {
      applicationId?: string;
      loanId?: string;
      limit?: number;
      offset?: number;
      fromDate?: Date;
      toDate?: Date;
      trigger?: ScoringTrigger;
    },
  ): Promise<{ history: CreditScoreHistory[]; total: number }> {
    const query = this.historyRepository.createQueryBuilder('history')
      .where('history.applicantId = :applicantId', { applicantId });

    if (options?.applicationId) {
      query.andWhere('history.applicationId = :applicationId', { applicationId: options.applicationId });
    }

    if (options?.loanId) {
      query.andWhere('history.loanId = :loanId', { loanId: options.loanId });
    }

    if (options?.fromDate) {
      query.andWhere('history.calculatedAt >= :fromDate', { fromDate: options.fromDate });
    }

    if (options?.toDate) {
      query.andWhere('history.calculatedAt <= :toDate', { toDate: options.toDate });
    }

    if (options?.trigger) {
      query.andWhere('history.trigger = :trigger', { trigger: options.trigger });
    }

    const total = await query.getCount();

    if (options?.limit) {
      query.limit(options.limit);
    }

    if (options?.offset) {
      query.offset(options.offset);
    }

    const history = await query
      .orderBy('history.calculatedAt', 'DESC')
      .getMany();

    return { history, total };
  }

  /**
   * Get score statistics for an applicant
   */
  async getScoreStatistics(
    applicantId: string,
    applicationId?: string,
    loanId?: string,
  ): Promise<{
    currentScore: number | null;
    highestScore: number | null;
    lowestScore: number | null;
    averageScore: number | null;
    totalCalculations: number;
    lastCalculatedAt: Date | null;
    scoreTrend: 'INCREASING' | 'DECREASING' | 'STABLE' | 'UNKNOWN';
  }> {
    const query = this.historyRepository.createQueryBuilder('history')
      .where('history.applicantId = :applicantId', { applicantId });

    if (applicationId) {
      query.andWhere('history.applicationId = :applicationId', { applicationId });
    }

    if (loanId) {
      query.andWhere('history.loanId = :loanId', { loanId });
    }

    const allScores = await query
      .orderBy('history.calculatedAt', 'DESC')
      .getMany();

    if (allScores.length === 0) {
      return {
        currentScore: null,
        highestScore: null,
        lowestScore: null,
        averageScore: null,
        totalCalculations: 0,
        lastCalculatedAt: null,
        scoreTrend: 'UNKNOWN',
      };
    }

    const scores = allScores.map((h) => h.finalScore);
    const currentScore = allScores[0].finalScore;
    const highestScore = Math.max(...scores);
    const lowestScore = Math.min(...scores);
    const averageScore = scores.reduce((a, b) => a + b, 0) / scores.length;
    const lastCalculatedAt = allScores[0].calculatedAt;

    // Determine trend (compare last 3 scores if available)
    let scoreTrend: 'INCREASING' | 'DECREASING' | 'STABLE' | 'UNKNOWN' = 'UNKNOWN';
    if (allScores.length >= 3) {
      const recent = allScores.slice(0, 3).map((h) => h.finalScore);
      const first = recent[2];
      const last = recent[0];
      const diff = last - first;

      if (diff > 10) {
        scoreTrend = 'INCREASING';
      } else if (diff < -10) {
        scoreTrend = 'DECREASING';
      } else {
        scoreTrend = 'STABLE';
      }
    } else if (allScores.length === 2) {
      const diff = allScores[0].finalScore - allScores[1].finalScore;
      if (diff > 5) {
        scoreTrend = 'INCREASING';
      } else if (diff < -5) {
        scoreTrend = 'DECREASING';
      } else {
        scoreTrend = 'STABLE';
      }
    }

    return {
      currentScore,
      highestScore,
      lowestScore,
      averageScore: Math.round(averageScore),
      totalCalculations: allScores.length,
      lastCalculatedAt,
      scoreTrend,
    };
  }

  /**
   * Get score changes by trigger type
   */
  async getScoreChangesByTrigger(
    applicantId: string,
    fromDate?: Date,
    toDate?: Date,
  ): Promise<Record<ScoringTrigger, { count: number; avgChange: number }>> {
    const query = this.historyRepository.createQueryBuilder('history')
      .where('history.applicantId = :applicantId', { applicantId })
      .andWhere('history.previousScore IS NOT NULL');

    if (fromDate) {
      query.andWhere('history.calculatedAt >= :fromDate', { fromDate });
    }

    if (toDate) {
      query.andWhere('history.calculatedAt <= :toDate', { toDate });
    }

    const history = await query
      .orderBy('history.calculatedAt', 'DESC')
      .getMany();

    const byTrigger: Record<string, { count: number; totalChange: number }> = {};

    history.forEach((h) => {
      if (!byTrigger[h.trigger]) {
        byTrigger[h.trigger] = { count: 0, totalChange: 0 };
      }
      byTrigger[h.trigger].count++;
      if (h.scoreChange !== null) {
        byTrigger[h.trigger].totalChange += h.scoreChange;
      }
    });

    const result: Record<ScoringTrigger, { count: number; avgChange: number }> = {} as any;

    Object.keys(ScoringTrigger).forEach((trigger) => {
      const data = byTrigger[trigger] || { count: 0, totalChange: 0 };
      result[trigger as ScoringTrigger] = {
        count: data.count,
        avgChange: data.count > 0 ? Math.round(data.totalChange / data.count) : 0,
      };
    });

    return result;
  }
}

