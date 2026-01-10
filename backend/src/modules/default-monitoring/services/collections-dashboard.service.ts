import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan, LessThan } from 'typeorm';
import { DefaultRiskScore } from '../entities/default-risk-score.entity';
import { RiskLevel } from '../dto/predictive-default.dto';
import { PreDefaultAction } from '../entities/pre-default-action.entity';
import { CollectionsDashboardDto, DefaultRiskScoreDto } from '../dto/predictive-default.dto';

@Injectable()
export class CollectionsDashboardService {
  constructor(
    @InjectRepository(DefaultRiskScore)
    private readonly riskScoreRepository: Repository<DefaultRiskScore>,
    @InjectRepository(PreDefaultAction)
    private readonly actionRepository: Repository<PreDefaultAction>,
  ) {}

  /**
   * Get collections dashboard data
   */
  async getCollectionsDashboard(): Promise<CollectionsDashboardDto> {
    // Get today's risk scores
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayScores = await this.riskScoreRepository.find({
      where: {
        calculatedAt: MoreThan(today),
        riskScore: MoreThan(50), // Only show medium+ risk
      },
      order: { riskScore: 'DESC' },
      take: 100, // Top 100 at-risk accounts
    });

    // Group by risk level
    const byRiskLevel = {
      LOW: todayScores.filter((s) => s.riskLevel === RiskLevel.LOW).length,
      MEDIUM: todayScores.filter((s) => s.riskLevel === RiskLevel.MEDIUM).length,
      HIGH: todayScores.filter((s) => s.riskLevel === RiskLevel.HIGH).length,
      CRITICAL: todayScores.filter((s) => s.riskLevel === RiskLevel.CRITICAL).length,
    };

    // Convert to DTOs
    const prioritizedAccounts: DefaultRiskScoreDto[] = todayScores.map((score) => ({
      loanId: score.loanId,
      riskScore: score.riskScore,
      riskLevel: score.riskLevel as any,
      scoreChange: score.scoreChange,
      indicators: score.indicators,
      behavioralDrift: score.behavioralDrift,
      calculatedAt: score.calculatedAt.toISOString(),
      alertTriggered: score.alertTriggered,
    }));

    // Calculate intervention success rate
    const interventionSuccessRate = await this.calculateInterventionSuccessRate();

    // Calculate false alarm rate
    const falseAlarmRate = await this.calculateFalseAlarmRate();

    return {
      totalAtRisk: todayScores.length,
      byRiskLevel,
      prioritizedAccounts,
      interventionSuccessRate,
      falseAlarmRate,
    };
  }

  /**
   * Get prioritized accounts for collections team
   */
  async getPrioritizedAccounts(limit: number = 50): Promise<DefaultRiskScoreDto[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const scores = await this.riskScoreRepository.find({
      where: {
        calculatedAt: MoreThan(today),
        riskScore: MoreThan(50),
      },
      order: { riskScore: 'DESC' },
      take: limit,
    });

    return scores.map((score) => ({
      loanId: score.loanId,
      riskScore: score.riskScore,
      riskLevel: score.riskLevel as any,
      scoreChange: score.scoreChange,
      indicators: score.indicators,
      behavioralDrift: score.behavioralDrift,
      calculatedAt: score.calculatedAt.toISOString(),
      alertTriggered: score.alertTriggered,
    }));
  }

  /**
   * Calculate intervention success rate
   */
  private async calculateInterventionSuccessRate(): Promise<number> {
    // Get actions from last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const actions = await this.actionRepository.find({
      where: {
        executedAt: MoreThan(thirtyDaysAgo),
      },
    });

    if (actions.length === 0) return 0;

    // Get loans that had actions and check if they defaulted
    // Simplified - would check actual default status
    const successfulInterventions = actions.filter((a) => {
      // Would check if loan is still performing after intervention
      return true; // Simplified
    }).length;

    return (successfulInterventions / actions.length) * 100;
  }

  /**
   * Calculate false alarm rate
   */
  private async calculateFalseAlarmRate(): Promise<number> {
    // Get alerts from last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const alerts = await this.riskScoreRepository.find({
      where: {
        alertTriggered: true,
        calculatedAt: MoreThan(thirtyDaysAgo),
      },
    });

    if (alerts.length === 0) return 0;

    // Check how many loans actually defaulted after alert
    // Simplified - would check actual default status
    const falseAlarms = alerts.filter((a) => {
      // Would check if loan did not default within 30 days
      return true; // Simplified
    }).length;

    return (falseAlarms / alerts.length) * 100;
  }
}

