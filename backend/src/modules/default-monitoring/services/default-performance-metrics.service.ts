import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan, LessThan, Between } from 'typeorm';
import { DefaultRiskScore } from '../entities/default-risk-score.entity';
import { PreDefaultAction } from '../entities/pre-default-action.entity';
import { Loan } from '../../loan/entities/loan.entity';
import { LoanStatus } from '../../../common/enums/loan-status.enum';

@Injectable()
export class DefaultPerformanceMetricsService {
  constructor(
    @InjectRepository(DefaultRiskScore)
    private readonly riskScoreRepository: Repository<DefaultRiskScore>,
    @InjectRepository(PreDefaultAction)
    private readonly actionRepository: Repository<PreDefaultAction>,
    @InjectRepository(Loan)
    private readonly loanRepository: Repository<Loan>,
  ) {}

  /**
   * Calculate prediction accuracy (60%+ of defaults predicted 15+ days early)
   */
  async calculatePredictionAccuracy(): Promise<{
    accuracy: number;
    totalDefaults: number;
    predictedEarly: number;
    threshold: number;
  }> {
    // Get loans that defaulted in last 90 days
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    const defaultedLoans = await this.loanRepository.find({
      where: {
        status: LoanStatus.WRITTEN_OFF, // Assuming this indicates default
        // Would filter by default date if available
      },
    });

    if (defaultedLoans.length === 0) {
      return {
        accuracy: 0,
        totalDefaults: 0,
        predictedEarly: 0,
        threshold: 60,
      };
    }

    // Check if defaults were predicted 15+ days early
    let predictedEarly = 0;
    for (const loan of defaultedLoans) {
      const riskScores = await this.riskScoreRepository.find({
        where: { loanId: loan.id },
        order: { calculatedAt: 'DESC' },
      });

      // Check if any score predicted default 15+ days before actual default
      const earlyPrediction = riskScores.some((score) => {
        if (!score.predictedDefaultDate) return false;
        const daysBefore = Math.floor(
          (new Date(score.predictedDefaultDate).getTime() - new Date(score.calculatedAt).getTime()) /
            (1000 * 60 * 60 * 24),
        );
        return daysBefore >= 15;
      });

      if (earlyPrediction) predictedEarly++;
    }

    const accuracy = (predictedEarly / defaultedLoans.length) * 100;

    return {
      accuracy,
      totalDefaults: defaultedLoans.length,
      predictedEarly,
      threshold: 60,
    };
  }

  /**
   * Calculate false alarm rate (<10% target)
   */
  async calculateFalseAlarmRate(): Promise<{
    falseAlarmRate: number;
    totalAlerts: number;
    falseAlarms: number;
    threshold: number;
  }> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const alerts = await this.riskScoreRepository.find({
      where: {
        alertTriggered: true,
        calculatedAt: MoreThan(thirtyDaysAgo),
      },
    });

    if (alerts.length === 0) {
      return {
        falseAlarmRate: 0,
        totalAlerts: 0,
        falseAlarms: 0,
        threshold: 10,
      };
    }

    // Check which alerts were false alarms (loan did not default within 30 days)
    let falseAlarms = 0;
    for (const alert of alerts) {
      const loan = await this.loanRepository.findOne({
        where: { id: alert.loanId },
      });

      if (loan && loan.status !== LoanStatus.WRITTEN_OFF) {
        // Check if loan defaulted within 30 days of alert
        // Simplified - would check actual default date
        falseAlarms++;
      }
    }

    const falseAlarmRate = (falseAlarms / alerts.length) * 100;

    return {
      falseAlarmRate,
      totalAlerts: alerts.length,
      falseAlarms,
      threshold: 10,
    };
  }

  /**
   * Calculate intervention success rate (25%+ avoid default through intervention)
   */
  async calculateInterventionSuccessRate(): Promise<{
    successRate: number;
    totalInterventions: number;
    successfulInterventions: number;
    threshold: number;
  }> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const actions = await this.actionRepository.find({
      where: {
        executed: true,
        executedAt: MoreThan(thirtyDaysAgo),
      },
    });

    if (actions.length === 0) {
      return {
        successRate: 0,
        totalInterventions: 0,
        successfulInterventions: 0,
        threshold: 25,
      };
    }

    // Group by loan
    const loanActions = new Map<string, PreDefaultAction[]>();
    for (const action of actions) {
      if (!loanActions.has(action.loanId)) {
        loanActions.set(action.loanId, []);
      }
      loanActions.get(action.loanId)!.push(action);
    }

    // Check which loans avoided default after intervention
    let successfulInterventions = 0;
    for (const [loanId, loanActionsList] of loanActions.entries()) {
      const loan = await this.loanRepository.findOne({
        where: { id: loanId },
      });

      if (loan && loan.status !== LoanStatus.WRITTEN_OFF) {
        // Loan is still performing after intervention
        successfulInterventions++;
      }
    }

    const successRate = (successfulInterventions / loanActions.size) * 100;

    return {
      successRate,
      totalInterventions: loanActions.size,
      successfulInterventions,
      threshold: 25,
    };
  }

  /**
   * Get performance metrics summary
   */
  async getPerformanceMetrics(): Promise<{
    predictionAccuracy: any;
    falseAlarmRate: any;
    interventionSuccessRate: any;
  }> {
    const [predictionAccuracy, falseAlarmRate, interventionSuccessRate] = await Promise.all([
      this.calculatePredictionAccuracy(),
      this.calculateFalseAlarmRate(),
      this.calculateInterventionSuccessRate(),
    ]);

    return {
      predictionAccuracy,
      falseAlarmRate,
      interventionSuccessRate,
    };
  }
}

