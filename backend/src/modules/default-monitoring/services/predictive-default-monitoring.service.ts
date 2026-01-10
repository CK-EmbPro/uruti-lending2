import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan, MoreThan, Between } from 'typeorm';
import { Loan } from '../../loan/entities/loan.entity';
import { LoanRepayment } from '../../loan-repayment/entities/loan-repayment.entity';
import { LoanRepaymentSchedule } from '../../loan/entities/loan-repayment-schedule.entity';
import { DefaultRiskScore } from '../entities/default-risk-score.entity';
import { RiskLevel } from '../dto/predictive-default.dto';
import { PreDefaultAction, ActionType } from '../entities/pre-default-action.entity';
import { BehavioralBaseline } from '../entities/behavioral-baseline.entity';
import {
  DefaultRiskScoreDto,
  EarlyWarningIndicatorsDto,
  BehavioralDriftDto,
  PreDefaultActionDto,
  RiskLevel as DtoRiskLevel,
  DriftSeverity,
} from '../dto/predictive-default.dto';
import { NotificationService } from '../../notification/services/notification.service';
import { NotificationType } from '../../../common/enums/notification-type.enum';
import { NotificationChannel } from '../../../common/enums/notification-channel.enum';

@Injectable()
export class PredictiveDefaultMonitoringService {
  private readonly logger = new Logger(PredictiveDefaultMonitoringService.name);

  // Thresholds
  private readonly ALERT_THRESHOLD = 15; // Score increase of 15+ points triggers alert
  private readonly MEDIUM_RISK_MIN = 50;
  private readonly MEDIUM_RISK_MAX = 70;
  private readonly HIGH_RISK_MIN = 70;
  private readonly HIGH_RISK_MAX = 85;
  private readonly CRITICAL_RISK_MIN = 85;
  private readonly BASELINE_CYCLES = 3; // First 3 cycles establish baseline

  constructor(
    @InjectRepository(Loan)
    private readonly loanRepository: Repository<Loan>,
    @InjectRepository(LoanRepayment)
    private readonly repaymentRepository: Repository<LoanRepayment>,
    @InjectRepository(LoanRepaymentSchedule)
    private readonly repaymentScheduleRepository: Repository<LoanRepaymentSchedule>,
    @InjectRepository(DefaultRiskScore)
    private readonly riskScoreRepository: Repository<DefaultRiskScore>,
    @InjectRepository(PreDefaultAction)
    private readonly actionRepository: Repository<PreDefaultAction>,
    @InjectRepository(BehavioralBaseline)
    private readonly baselineRepository: Repository<BehavioralBaseline>,
    private readonly notificationService: NotificationService,
  ) {}

  /**
   * Calculate daily risk score for a loan
   */
  async calculateDailyRiskScore(loanId: string): Promise<DefaultRiskScoreDto> {
    this.logger.log(`Calculating daily risk score for loan ${loanId}`);

    const loan = await this.loanRepository.findOne({
      where: { id: loanId },
      relations: ['repaymentSchedule'],
    });

    if (!loan) {
      throw new Error(`Loan ${loanId} not found`);
    }

    // Get previous day's score
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const previousScore = await this.riskScoreRepository.findOne({
      where: { loanId, calculatedAt: Between(new Date(yesterday.setHours(0, 0, 0, 0)), new Date(yesterday.setHours(23, 59, 59, 999))) },
      order: { calculatedAt: 'DESC' },
    });

    // Calculate early warning indicators
    const indicators = await this.calculateEarlyWarningIndicators(loan);

    // Calculate behavioral drift
    const behavioralDrift = await this.calculateBehavioralDrift(loan);

    // Calculate risk score
    const riskScore = this.calculateRiskScore(indicators, behavioralDrift, loan);

    // Determine risk level
    const riskLevel = this.determineRiskLevel(riskScore);

    // Calculate score change
    const scoreChange = previousScore ? riskScore - previousScore.riskScore : 0;

    // Check if alert should be triggered
    const alertTriggered = scoreChange >= this.ALERT_THRESHOLD;

    // Predict default date
    const predictedDefaultDate = this.predictDefaultDate(loan, riskScore);
    const daysUntilPredictedDefault = predictedDefaultDate
      ? Math.ceil((predictedDefaultDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
      : undefined;

    // Save risk score
    const riskScoreEntity = this.riskScoreRepository.create({
      loanId,
      riskScore,
      riskLevel,
      scoreChange,
      indicators,
      behavioralDrift,
      alertTriggered,
      calculatedAt: new Date(),
      predictedDefaultDate,
      daysUntilPredictedDefault,
    });
    await this.riskScoreRepository.save(riskScoreEntity);

    // Trigger actions if needed
    if (riskScore >= this.MEDIUM_RISK_MIN) {
      await this.executePreDefaultActions(loan, riskScore, riskLevel);
    }

    // Send alert if triggered
    if (alertTriggered) {
      await this.sendAlert(loan, riskScore, scoreChange);
    }

    return {
      loanId,
      riskScore,
      riskLevel: riskLevel as DtoRiskLevel,
      scoreChange,
      indicators,
      behavioralDrift,
      calculatedAt: new Date().toISOString(),
      alertTriggered,
      predictedDefaultDate: predictedDefaultDate?.toISOString().split('T')[0],
      daysUntilPredictedDefault,
    };
  }

  /**
   * Calculate early warning indicators
   */
  private async calculateEarlyWarningIndicators(loan: Loan): Promise<EarlyWarningIndicatorsDto> {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

    // Get repayments
    const recentRepayments = await this.repaymentRepository.find({
      where: { loanId: loan.id },
      order: { postingDate: 'DESC' },
      take: 10,
    });

    const last30DaysRepayments = recentRepayments.filter(
      (r) => r.postingDate && new Date(r.postingDate) >= thirtyDaysAgo,
    );
    const previous30DaysRepayments = recentRepayments.filter(
      (r) => r.postingDate && new Date(r.postingDate) >= sixtyDaysAgo && new Date(r.postingDate) < thirtyDaysAgo,
    );

    // Calculate payment delays trend
    const recentDelays = this.countDelayedPayments(last30DaysRepayments, loan);
    const previousDelays = this.countDelayedPayments(previous30DaysRepayments, loan);
    const paymentDelaysTrend = this.determineTrend(recentDelays, previousDelays);

    // Calculate transaction velocity (simplified - would use actual transaction data)
    const transactionVelocityTrend = 'declining'; // Would calculate from transaction data

    // Calculate overdraft frequency (simplified)
    const overdraftFrequencyTrend = 'increasing'; // Would calculate from account data

    // Get hardship contacts (simplified - would query from customer service)
    const hardshipContactCount = 0; // Would query from customer service records

    // Get restructuring requests (simplified)
    const restructuringRequestsCount = 0; // Would query from restructuring records

    // Mobile money activity (simplified)
    const mobileMoneyActivityTrend = 'declining'; // Would calculate from transaction data

    // Days since last payment
    const lastPayment = recentRepayments[0];
    const daysSinceLastPayment = lastPayment
      ? Math.floor((now.getTime() - new Date(lastPayment.postingDate).getTime()) / (1000 * 60 * 60 * 24))
      : 999;

    // Missed payments count
    const missedPaymentsCount = await this.countMissedPayments(loan);

    return {
      paymentDelaysTrend,
      transactionVelocityTrend,
      overdraftFrequencyTrend,
      hardshipContactCount,
      restructuringRequestsCount,
      mobileMoneyActivityTrend,
      daysSinceLastPayment,
      missedPaymentsCount,
    };
  }

  /**
   * Calculate behavioral drift
   */
  private async calculateBehavioralDrift(loan: Loan): Promise<BehavioralDriftDto> {
    // Get or create baseline
    let baseline = await this.baselineRepository.findOne({
      where: { loanId: loan.id },
    });

    if (!baseline) {
      baseline = await this.establishBaseline(loan);
    }

    if (!baseline.baselineEstablished) {
      return {
        repaymentDayShift: 0,
        switchedToManual: false,
        partialPaymentsCount: 0,
        appEngagementDecline: 0,
        driftSeverity: DriftSeverity.LOW,
        baselineEstablished: false,
      };
    }

    // Get recent repayments
    const recentRepayments = await this.repaymentRepository.find({
      where: { loanId: loan.id },
      order: { postingDate: 'DESC' },
      take: 6, // Last 6 payments
    });

    // Calculate repayment day shift
    const recentRepaymentDays = recentRepayments
      .map((r) => (r.postingDate ? new Date(r.postingDate).getDate() : 0))
      .filter((d) => d > 0);
    const averageRecentDay = recentRepaymentDays.length > 0
      ? recentRepaymentDays.reduce((sum, d) => sum + d, 0) / recentRepaymentDays.length
      : baseline.averageRepaymentDay;
    const repaymentDayShift = averageRecentDay - Number(baseline.averageRepaymentDay);

    // Check if switched to manual
    const recentAutoDebitRate = this.calculateAutoDebitRate(recentRepayments);
    const switchedToManual = recentAutoDebitRate < Number(baseline.autoDebitRate) * 0.5;

    // Count partial payments
    const partialPaymentsCount = recentRepayments.filter((r) => {
      // Would compare with expected amount from schedule
      return false; // Simplified
    }).length;

    // App engagement decline (simplified)
    const appEngagementDecline = 0; // Would calculate from app usage data

    // Determine drift severity
    const driftSeverity = this.determineDriftSeverity(
      repaymentDayShift,
      switchedToManual,
      partialPaymentsCount,
      appEngagementDecline,
    );

    return {
      repaymentDayShift: Math.round(repaymentDayShift),
      switchedToManual,
      partialPaymentsCount,
      appEngagementDecline,
      driftSeverity,
      baselineEstablished: true,
    };
  }

  /**
   * Establish behavioral baseline (first 3 cycles)
   */
  private async establishBaseline(loan: Loan): Promise<BehavioralBaseline> {
    const repayments = await this.repaymentRepository.find({
      where: { loanId: loan.id },
      order: { postingDate: 'ASC' },
    });

    // Get first 3 cycles (or available cycles)
    const baselineRepayments = repayments.slice(0, this.BASELINE_CYCLES * 2); // Assuming 2 repayments per cycle

    if (baselineRepayments.length < 3) {
      // Not enough data for baseline
      const baseline = this.baselineRepository.create({
        loanId: loan.id,
        baselineCycles: baselineRepayments.length,
        averageRepaymentDay: 15, // Default
        autoDebitRate: 0.8, // Default
        averagePaymentAmount: loan.loanAmount / (loan.repaymentPeriods || 12),
        averageAppEngagement: 0,
        totalPayments: baselineRepayments.length,
        onTimePayments: baselineRepayments.length,
        baselineStartDate: new Date(),
        baselineEndDate: new Date(),
        baselineEstablished: false,
      });
      return await this.baselineRepository.save(baseline);
    }

    // Calculate baseline metrics
    const repaymentDays = baselineRepayments
      .map((r) => (r.postingDate ? new Date(r.postingDate).getDate() : 0))
      .filter((d) => d > 0);
    const averageRepaymentDay = repaymentDays.length > 0
      ? repaymentDays.reduce((sum, d) => sum + d, 0) / repaymentDays.length
      : 15;

    const autoDebitRate = this.calculateAutoDebitRate(baselineRepayments);
    const averagePaymentAmount = baselineRepayments.length > 0
      ? baselineRepayments.reduce((sum, r) => sum + (r.amountPaid || 0), 0) / baselineRepayments.length
      : loan.loanAmount / (loan.repaymentPeriods || 12);

    const onTimePayments = this.countOnTimePayments(baselineRepayments, loan);

    const baseline = this.baselineRepository.create({
      loanId: loan.id,
      baselineCycles: this.BASELINE_CYCLES,
      averageRepaymentDay,
      autoDebitRate,
      averagePaymentAmount,
      averageAppEngagement: 0, // Would calculate from app data
      totalPayments: baselineRepayments.length,
      onTimePayments,
      baselineStartDate: baselineRepayments[0]?.postingDate
        ? new Date(baselineRepayments[0].postingDate)
        : new Date(),
      baselineEndDate: baselineRepayments[baselineRepayments.length - 1]?.postingDate
        ? new Date(baselineRepayments[baselineRepayments.length - 1].postingDate)
        : new Date(),
      baselineEstablished: baselineRepayments.length >= 3,
    });

    return await this.baselineRepository.save(baseline);
  }

  /**
   * Calculate risk score from indicators and drift
   */
  private calculateRiskScore(
    indicators: EarlyWarningIndicatorsDto,
    behavioralDrift: BehavioralDriftDto,
    loan: Loan,
  ): number {
    let score = 0;

    // Payment delays contribution (0-25 points)
    if (indicators.paymentDelaysTrend === 'increasing') {
      score += 15;
    }
    score += Math.min(10, indicators.missedPaymentsCount * 5);

    // Transaction velocity contribution (0-15 points)
    if (indicators.transactionVelocityTrend === 'declining') {
      score += 10;
    }

    // Overdraft frequency contribution (0-10 points)
    if (indicators.overdraftFrequencyTrend === 'increasing') {
      score += 8;
    }

    // Hardship contact contribution (0-15 points)
    score += Math.min(15, indicators.hardshipContactCount * 5);

    // Restructuring requests contribution (0-10 points)
    score += Math.min(10, indicators.restructuringRequestsCount * 5);

    // Mobile money activity contribution (0-10 points)
    if (indicators.mobileMoneyActivityTrend === 'declining') {
      score += 8;
    }

    // Days since last payment contribution (0-15 points)
    if (indicators.daysSinceLastPayment > 7) {
      score += Math.min(15, (indicators.daysSinceLastPayment - 7) * 2);
    }

    // Behavioral drift contribution (0-20 points)
    if (behavioralDrift.baselineEstablished) {
      if (behavioralDrift.driftSeverity === DriftSeverity.HIGH) {
        score += 20;
      } else if (behavioralDrift.driftSeverity === DriftSeverity.MEDIUM) {
        score += 12;
      } else if (behavioralDrift.driftSeverity === DriftSeverity.LOW) {
        score += 5;
      }

      if (behavioralDrift.switchedToManual) {
        score += 5;
      }

      if (behavioralDrift.repaymentDayShift > 5) {
        score += Math.min(10, behavioralDrift.repaymentDayShift * 2);
      }
    }

    // Adjust score down if recent on-time payment
    const recentOnTimePayment = this.hasRecentOnTimePayment(loan);
    if (recentOnTimePayment) {
      score = Math.max(0, score - 10); // Reduce score by 10 points
    }

    return Math.min(100, Math.round(score));
  }

  /**
   * Determine risk level from score
   */
  private determineRiskLevel(score: number): RiskLevel {
    if (score >= this.CRITICAL_RISK_MIN) {
      return RiskLevel.CRITICAL;
    } else if (score >= this.HIGH_RISK_MIN) {
      return RiskLevel.HIGH;
    } else if (score >= this.MEDIUM_RISK_MIN) {
      return RiskLevel.MEDIUM;
    } else {
      return RiskLevel.LOW;
    }
  }

  /**
   * Execute pre-default actions based on risk level
   */
  private async executePreDefaultActions(
    loan: Loan,
    riskScore: number,
    riskLevel: RiskLevel,
  ): Promise<void> {
    const actions: PreDefaultAction[] = [];

    if (riskScore >= this.MEDIUM_RISK_MIN && riskScore < this.MEDIUM_RISK_MAX) {
      // Medium risk actions
      actions.push(
        this.actionRepository.create({
          loanId: loan.id,
          actionType: ActionType.FRIENDLY_REMINDER,
          description: 'Friendly reminder sent 5 days before due date',
          riskScoreAtAction: riskScore,
        }),
        this.actionRepository.create({
          loanId: loan.id,
          actionType: ActionType.DATE_CHANGE_OFFER,
          description: 'One-time date change offer sent',
          riskScoreAtAction: riskScore,
        }),
        this.actionRepository.create({
          loanId: loan.id,
          actionType: ActionType.BUDGETING_TIPS,
          description: 'Budgeting tips sent',
          riskScoreAtAction: riskScore,
        }),
      );
    } else if (riskScore >= this.HIGH_RISK_MIN && riskScore < this.HIGH_RISK_MAX) {
      // High risk actions
      actions.push(
        this.actionRepository.create({
          loanId: loan.id,
          actionType: ActionType.INCREASED_REMINDERS,
          description: 'Increased reminder frequency activated',
          riskScoreAtAction: riskScore,
        }),
        this.actionRepository.create({
          loanId: loan.id,
          actionType: ActionType.RESTRICT_NEW_BORROWING,
          description: 'New borrowing restricted',
          riskScoreAtAction: riskScore,
        }),
        this.actionRepository.create({
          loanId: loan.id,
          actionType: ActionType.VOLUNTARY_RESTRUCTURE,
          description: 'Voluntary restructure offer sent',
          riskScoreAtAction: riskScore,
        }),
        this.actionRepository.create({
          loanId: loan.id,
          actionType: ActionType.SOFT_COLLECTIONS,
          description: 'Added to collections queue (soft follow-up)',
          riskScoreAtAction: riskScore,
        }),
      );
    } else if (riskScore >= this.CRITICAL_RISK_MIN) {
      // Critical risk actions
      actions.push(
        this.actionRepository.create({
          loanId: loan.id,
          actionType: ActionType.DAILY_CONTACT,
          description: 'Daily contact initiated (SMS, call, WhatsApp)',
          riskScoreAtAction: riskScore,
        }),
        this.actionRepository.create({
          loanId: loan.id,
          actionType: ActionType.FLAG_GUARANTORS,
          description: 'Guarantors flagged for contact',
          riskScoreAtAction: riskScore,
        }),
        this.actionRepository.create({
          loanId: loan.id,
          actionType: ActionType.ASSIGN_RECOVERY_TEAM,
          description: 'Dedicated recovery team assigned',
          riskScoreAtAction: riskScore,
        }),
      );

      // Check if >30 days overdue for legal action
      const daysOverdue = await this.getDaysOverdue(loan);
      if (daysOverdue > 30) {
        actions.push(
          this.actionRepository.create({
            loanId: loan.id,
            actionType: ActionType.PREPARE_LEGAL_ACTION,
            description: 'Legal action preparation initiated',
            riskScoreAtAction: riskScore,
          }),
        );
      }
    }

    // Execute actions
    for (const action of actions) {
      await this.executeAction(action, loan);
      await this.actionRepository.save(action);
    }
  }

  /**
   * Execute a specific action
   */
  private async executeAction(action: PreDefaultAction, loan: Loan): Promise<void> {
    action.executed = true;
    action.executedAt = new Date();

    // Send notifications based on action type
    const customerId = loan.applicantId; // Would get from loan relationship

    switch (action.actionType) {
      case ActionType.FRIENDLY_REMINDER:
        await this.notificationService.sendNotification({
          recipientId: customerId,
          notificationType: NotificationType.PAYMENT_REMINDER,
          channel: NotificationChannel.IN_APP,
          subject: 'Payment Reminder',
          body: 'Friendly reminder: Your payment is due in 5 days.',
          metadata: { loanId: loan.id },
        });
        break;

      case ActionType.DATE_CHANGE_OFFER:
        await this.notificationService.sendNotification({
          recipientId: customerId,
          notificationType: NotificationType.APPLICATION_UPDATE,
          channel: NotificationChannel.IN_APP,
          subject: 'Payment Date Change Available',
          body: 'We can help! Request a one-time payment date change.',
          metadata: { loanId: loan.id, action: 'date_change_offer' },
        });
        break;

      case ActionType.BUDGETING_TIPS:
        await this.notificationService.sendNotification({
          recipientId: customerId,
          notificationType: NotificationType.APPLICATION_UPDATE,
          channel: NotificationChannel.IN_APP,
          subject: 'Budgeting Tips',
          body: 'Check out our budgeting tips to help manage your finances.',
          metadata: { loanId: loan.id, action: 'budgeting_tips' },
        });
        break;

      case ActionType.DAILY_CONTACT:
        // Send via multiple channels
        await this.notificationService.sendNotification({
          recipientId: customerId,
          notificationType: NotificationType.PAYMENT_REMINDER,
          channel: NotificationChannel.IN_APP,
          subject: 'Urgent: Payment Required',
          body: 'Your payment is overdue. Please contact us immediately.',
          metadata: { loanId: loan.id, priority: 'high' },
        });
        break;

      // Other action types would have similar implementations
    }
  }

  /**
   * Send alert when score increases significantly
   */
  private async sendAlert(loan: Loan, riskScore: number, scoreChange: number): Promise<void> {
    this.logger.warn(
      `Alert triggered for loan ${loan.id}: Risk score increased by ${scoreChange} points to ${riskScore}`,
    );

    // Send alert to collections team
    // In production, would send to collections dashboard/queue
  }

  /**
   * Predict default date
   */
  private predictDefaultDate(loan: Loan, riskScore: number): Date | undefined {
    if (riskScore < this.MEDIUM_RISK_MIN) {
      return undefined;
    }

    // Predict based on risk score and payment history
    const daysUntilDefault = riskScore >= this.CRITICAL_RISK_MIN
      ? 5 // Critical: 5 days
      : riskScore >= this.HIGH_RISK_MIN
      ? 10 // High: 10 days
      : 15; // Medium: 15 days

    const predictedDate = new Date();
    predictedDate.setDate(predictedDate.getDate() + daysUntilDefault);
    return predictedDate;
  }

  /**
   * Helper methods
   */
  private countDelayedPayments(repayments: LoanRepayment[], loan: Loan): number {
    // Simplified - would compare with schedule
    return 0;
  }

  private determineTrend(current: number, previous: number): 'increasing' | 'decreasing' | 'stable' {
    if (current > previous * 1.1) return 'increasing';
    if (current < previous * 0.9) return 'decreasing';
    return 'stable';
  }

  private async countMissedPayments(loan: Loan): Promise<number> {
    const schedule = await this.repaymentScheduleRepository.find({
      where: { loanId: loan.id },
    });
    // Would compare schedule with actual repayments
    return 0; // Simplified
  }

  private calculateAutoDebitRate(repayments: LoanRepayment[]): number {
    if (repayments.length === 0) return 0;
    const autoDebitCount = repayments.filter((r) => r.modeOfPayment?.toLowerCase().includes('auto')).length;
    return autoDebitCount / repayments.length;
  }

  private countOnTimePayments(repayments: LoanRepayment[], loan: Loan): number {
    // Simplified - would compare with schedule
    return repayments.length;
  }

  private determineDriftSeverity(
    repaymentDayShift: number,
    switchedToManual: boolean,
    partialPaymentsCount: number,
    appEngagementDecline: number,
  ): DriftSeverity {
    let severityScore = 0;

    if (repaymentDayShift > 7) severityScore += 3;
    else if (repaymentDayShift > 3) severityScore += 2;
    else if (repaymentDayShift > 0) severityScore += 1;

    if (switchedToManual) severityScore += 2;
    if (partialPaymentsCount > 2) severityScore += 2;
    if (appEngagementDecline > 50) severityScore += 2;

    if (severityScore >= 5) return DriftSeverity.HIGH;
    if (severityScore >= 3) return DriftSeverity.MEDIUM;
    return DriftSeverity.LOW;
  }

  private hasRecentOnTimePayment(loan: Loan): boolean {
    // Would check for recent on-time payment
    return false; // Simplified
  }

  private async getDaysOverdue(loan: Loan): Promise<number> {
    // Would calculate from schedule and repayments
    return 0; // Simplified
  }

  /**
   * Get previous risk score for a loan
   */
  async getPreviousRiskScore(loanId: string): Promise<DefaultRiskScoreDto | undefined> {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const previousScore = await this.riskScoreRepository.findOne({
      where: { loanId },
      order: { calculatedAt: 'DESC' },
    });

    if (!previousScore) return undefined;

    return {
      loanId: previousScore.loanId,
      riskScore: previousScore.riskScore,
      riskLevel: previousScore.riskLevel as DtoRiskLevel,
      scoreChange: previousScore.scoreChange,
      indicators: previousScore.indicators,
      behavioralDrift: previousScore.behavioralDrift,
      calculatedAt: previousScore.calculatedAt.toISOString(),
      alertTriggered: previousScore.alertTriggered,
    };
  }

  /**
   * Get actions taken for a loan
   */
  async getActionsForLoan(loanId: string): Promise<PreDefaultActionDto[]> {
    const actions = await this.actionRepository.find({
      where: { loanId },
      order: { createdAt: 'DESC' },
    });

    return actions.map((action) => ({
      actionType: action.actionType,
      description: action.description,
      executed: action.executed,
      executedAt: action.executedAt?.toISOString(),
    }));
  }
}

