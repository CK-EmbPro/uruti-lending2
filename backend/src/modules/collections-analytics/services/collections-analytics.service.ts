import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { CollectionAnalytics, CollectionStrategy, ContactChannel } from '../entities/collection-analytics.entity';
import {
  PaymentProbabilityPrediction,
  CollectionEffectivenessAnalysis,
  CollectionOptimizationRecommendation,
  SettlementOffer,
  GetCollectionAnalyticsDto,
} from '../dto/collections-analytics.dto';
import { Loan } from '../../loan/entities/loan.entity';
import { LoanRepayment } from '../../loan-repayment/entities/loan-repayment.entity';
// Customer entity doesn't exist - using applicantId from loans instead

@Injectable()
export class CollectionsAnalyticsService {
  private readonly logger = new Logger(CollectionsAnalyticsService.name);

  constructor(
    @InjectRepository(CollectionAnalytics)
    private readonly analyticsRepository: Repository<CollectionAnalytics>,
    @InjectRepository(Loan)
    private readonly loanRepository: Repository<Loan>,
    @InjectRepository(LoanRepayment)
    private readonly repaymentRepository: Repository<LoanRepayment>,
    // Customer repository removed - using applicantId from loans
  ) {}

  /**
   * Predict payment probability
   */
  async predictPaymentProbability(
    loanId: string,
    companyId: string,
  ): Promise<PaymentProbabilityPrediction> {
    this.logger.log(`Predicting payment probability for loan ${loanId}`);

    const loan = await this.loanRepository.findOne({
      where: { id: loanId, companyId },
    });

    if (!loan) {
      throw new Error(`Loan ${loanId} not found`);
    }

    // Customer entity doesn't exist - using applicantId from loan
    const customer = null; // TODO: Replace with actual customer/applicant lookup if needed

    // Get historical payment data
    const repayments = await this.repaymentRepository.find({
      where: { loan: { id: loanId } } as any,
      order: { dueDate: 'ASC' },
    });

    // Calculate payment probability using ML-like algorithm
    const paymentProbability = this.calculatePaymentProbability(loan, customer, repayments);

    // Determine optimal contact time
    const optimalContactTime = this.determineOptimalContactTime(customer, repayments);

    // Determine optimal channel
    const optimalChannel = this.determineOptimalChannel(customer, repayments);

    // Recommend strategy
    const recommendedStrategy = this.recommendStrategy(loan, repayments, paymentProbability);

    // Identify risk factors
    const riskFactors = this.identifyRiskFactors(loan, customer, repayments);

    // Calculate confidence
    const confidenceLevel = this.calculateConfidence(repayments.length, customer);

    // Save analytics
    const analytics = this.analyticsRepository.create({
      companyId,
      loanId,
      customerId: loan.applicantId,
      paymentProbability,
      optimalContactTime,
      optimalChannel,
      recommendedStrategy,
      riskFactors,
      confidenceLevel,
      historicalData: {
        totalRepayments: repayments.length,
        onTimePayments: repayments.filter((r) => r.status === 'COMPLETED').length,
      },
    });

    await this.analyticsRepository.save(analytics);

    return {
      loanId,
      customerId: loan.applicantId,
      paymentProbability,
      optimalContactTime,
      optimalChannel,
      recommendedStrategy,
      riskFactors,
      confidenceLevel,
    };
  }

  /**
   * Get collection effectiveness analysis
   */
  async getCollectionEffectiveness(
    dto: GetCollectionAnalyticsDto,
    companyId: string,
  ): Promise<CollectionEffectivenessAnalysis> {
    const startDate = dto.startDate ? new Date(dto.startDate) : new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
    const endDate = dto.endDate ? new Date(dto.endDate) : new Date();

    // In production, would query actual collection data
    // For now, return simulated effectiveness data

    const channelEffectiveness: Record<ContactChannel, any> = {
      [ContactChannel.EMAIL]: {
        successRate: 0.35,
        averageResponseTime: 2.5, // Days
        costPerContact: 0.1,
        totalContacts: 500,
      },
      [ContactChannel.SMS]: {
        successRate: 0.45,
        averageResponseTime: 1.8,
        costPerContact: 0.05,
        totalContacts: 800,
      },
      [ContactChannel.PHONE]: {
        successRate: 0.65,
        averageResponseTime: 0.5,
        costPerContact: 2.0,
        totalContacts: 300,
      },
      [ContactChannel.LETTER]: {
        successRate: 0.25,
        averageResponseTime: 5.0,
        costPerContact: 1.5,
        totalContacts: 200,
      },
      [ContactChannel.IN_PERSON]: {
        successRate: 0.75,
        averageResponseTime: 0.2,
        costPerContact: 10.0,
        totalContacts: 50,
      },
    };

    const timeEffectiveness: Record<string, any> = {
      '09:00-12:00': {
        successRate: 0.55,
        averageResponseTime: 1.2,
        totalContacts: 200,
      },
      '12:00-14:00': {
        successRate: 0.45,
        averageResponseTime: 1.5,
        totalContacts: 150,
      },
      '14:00-17:00': {
        successRate: 0.65,
        averageResponseTime: 0.8,
        totalContacts: 300,
      },
      '17:00-20:00': {
        successRate: 0.50,
        averageResponseTime: 1.0,
        totalContacts: 250,
      },
    };

    const strategyEffectiveness: Record<CollectionStrategy, any> = {
      [CollectionStrategy.EARLY_STAGE]: {
        successRate: 0.70,
        averageRecoveryAmount: 5000,
        averageDaysToRecovery: 3,
      },
      [CollectionStrategy.MODERATE_STAGE]: {
        successRate: 0.55,
        averageRecoveryAmount: 4500,
        averageDaysToRecovery: 7,
      },
      [CollectionStrategy.SERIOUS_STAGE]: {
        successRate: 0.40,
        averageRecoveryAmount: 4000,
        averageDaysToRecovery: 15,
      },
      [CollectionStrategy.SEVERE_STAGE]: {
        successRate: 0.25,
        averageRecoveryAmount: 3500,
        averageDaysToRecovery: 30,
      },
      [CollectionStrategy.LEGAL]: {
        successRate: 0.15,
        averageRecoveryAmount: 3000,
        averageDaysToRecovery: 60,
      },
    };

    const collectorPerformance = [
      {
        collectorId: 'collector-1',
        successRate: 0.68,
        averageRecoveryAmount: 4800,
        totalRecovered: 240000,
      },
      {
        collectorId: 'collector-2',
        successRate: 0.62,
        averageRecoveryAmount: 4500,
        totalRecovered: 180000,
      },
    ];

    return {
      channelEffectiveness,
      timeEffectiveness,
      strategyEffectiveness,
      collectorPerformance,
    };
  }

  /**
   * Get optimization recommendations
   */
  async getOptimizationRecommendations(
    loanId: string,
    companyId: string,
  ): Promise<CollectionOptimizationRecommendation> {
    const prediction = await this.predictPaymentProbability(loanId, companyId);

    const loan = await this.loanRepository.findOne({
      where: { id: loanId, companyId },
    });

    if (!loan) {
      throw new Error(`Loan ${loanId} not found`);
    }

    // Calculate expected recovery amount
    const outstandingAmount = Number(loan.outstandingAmount || 0);
    const expectedRecoveryAmount = outstandingAmount * prediction.paymentProbability;

    // Determine best action
    let recommendedAction = 'CONTACT_PHONE';
    if (prediction.paymentProbability < 0.3) {
      recommendedAction = 'OFFER_SETTLEMENT';
    } else if (prediction.paymentProbability < 0.5) {
      recommendedAction = 'ESCALATE_TO_COLLECTOR';
    }

    // Calculate recommended time (next optimal contact window)
    const now = new Date();
    const recommendedTime = this.calculateNextOptimalTime(prediction.optimalContactTime, now);

    return {
      loanId,
      recommendedAction,
      recommendedTime: recommendedTime.toISOString(),
      recommendedChannel: prediction.optimalChannel,
      expectedSuccessProbability: prediction.paymentProbability,
      expectedRecoveryAmount: Math.round(expectedRecoveryAmount),
      reasoning: `Based on historical data, customer has ${Math.round(prediction.paymentProbability * 100)}% probability of payment. Optimal contact via ${prediction.optimalChannel} during ${prediction.optimalContactTime}.`,
    };
  }

  /**
   * Generate settlement offer
   */
  async generateSettlementOffer(
    loanId: string,
    companyId: string,
  ): Promise<SettlementOffer> {
    const loan = await this.loanRepository.findOne({
      where: { id: loanId, companyId },
    });

    if (!loan) {
      throw new Error(`Loan ${loanId} not found`);
    }

    const prediction = await this.predictPaymentProbability(loanId, companyId);

    const outstandingAmount = Number(loan.outstandingAmount || 0);

    // Calculate settlement amount based on payment probability
    // Lower probability = higher discount
    let discountPercentage = 0;
    if (prediction.paymentProbability < 0.2) {
      discountPercentage = 40; // 40% discount for very low probability
    } else if (prediction.paymentProbability < 0.4) {
      discountPercentage = 30; // 30% discount
    } else if (prediction.paymentProbability < 0.6) {
      discountPercentage = 20; // 20% discount
    } else {
      discountPercentage = 10; // 10% discount
    }

    const settlementAmount = outstandingAmount * (1 - discountPercentage / 100);

    // Determine payment terms
    const paymentTerms = outstandingAmount > 50000 ? '6 installments' : '3 installments';

    // Calculate acceptance probability
    const acceptanceProbability = Math.min(0.9, prediction.paymentProbability + 0.2);

    return {
      loanId,
      originalAmount: outstandingAmount,
      settlementAmount: Math.round(settlementAmount),
      discountPercentage,
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
      paymentTerms,
      acceptanceProbability: Math.round(acceptanceProbability * 100) / 100,
    };
  }

  // Private helper methods

  private calculatePaymentProbability(
    loan: Loan,
    customer: any | null, // Customer entity doesn't exist
    repayments: LoanRepayment[],
  ): number {
    let probability = 0.5; // Base probability

    // Payment history factor
    if (repayments.length > 0) {
      const completedPayments = repayments.filter((r) => r.status === 'COMPLETED').length;
      const onTimeRate = completedPayments / repayments.length;
      probability += (onTimeRate - 0.5) * 0.3; // Up to ±15%
    } else {
      probability -= 0.1; // No history = lower probability
    }

    // Days past due factor
    const daysPastDue = this.calculateDaysPastDue(loan, repayments);
    if (daysPastDue > 90) {
      probability -= 0.3;
    } else if (daysPastDue > 60) {
      probability -= 0.2;
    } else if (daysPastDue > 30) {
      probability -= 0.1;
    }

    // Customer history factor
    if (customer) {
      // Would use customer's overall payment history
      probability += 0.05; // Slight boost for existing customer
    }

    return Math.max(0, Math.min(1, probability));
  }

  private calculateDaysPastDue(loan: Loan, repayments: LoanRepayment[]): number {
    const overdueRepayments = repayments.filter(
      (r) => r.dueDate < new Date() && r.status !== 'COMPLETED',
    );

    if (overdueRepayments.length === 0) {
      return 0;
    }

    const oldestOverdue = overdueRepayments[0];
    return Math.ceil(
      (new Date().getTime() - oldestOverdue.dueDate.getTime()) / (1000 * 60 * 60 * 24),
    );
  }

  private determineOptimalContactTime(
    customer: any | null, // Customer entity doesn't exist
    repayments: LoanRepayment[],
  ): string {
    // In production, would analyze historical contact success by time
    // For now, return default optimal time
    return '14:00-16:00'; // Afternoon is typically best
  }

  private determineOptimalChannel(
    customer: any | null, // Customer entity doesn't exist
    repayments: LoanRepayment[],
  ): ContactChannel {
    // In production, would analyze historical channel effectiveness
    // For now, prefer phone for higher success rate
    return ContactChannel.PHONE;
  }

  private recommendStrategy(
    loan: Loan,
    repayments: LoanRepayment[],
    paymentProbability: number,
  ): CollectionStrategy {
    const daysPastDue = this.calculateDaysPastDue(loan, repayments);

    if (daysPastDue > 120) {
      return CollectionStrategy.LEGAL;
    } else if (daysPastDue > 90) {
      return CollectionStrategy.SEVERE_STAGE;
    } else if (daysPastDue > 60) {
      return CollectionStrategy.SERIOUS_STAGE;
    } else if (daysPastDue > 30) {
      return CollectionStrategy.MODERATE_STAGE;
    } else {
      return CollectionStrategy.EARLY_STAGE;
    }
  }

  private identifyRiskFactors(
    loan: Loan,
    customer: any | null, // Customer entity doesn't exist
    repayments: LoanRepayment[],
  ): string[] {
    const factors: string[] = [];

    const daysPastDue = this.calculateDaysPastDue(loan, repayments);
    if (daysPastDue > 90) {
      factors.push('Severely overdue');
    } else if (daysPastDue > 60) {
      factors.push('Significantly overdue');
    }

    if (repayments.length > 0) {
      const onTimeRate = repayments.filter((r) => r.status === 'COMPLETED').length / repayments.length;
      if (onTimeRate < 0.7) {
        factors.push('Poor payment history');
      }
    }

    const outstandingAmount = Number(loan.outstandingAmount || 0);
    if (outstandingAmount > 100000) {
      factors.push('High outstanding balance');
    }

    return factors;
  }

  private calculateConfidence(repaymentCount: number, customer: any | null): number {
    let confidence = 0.5;

    // More historical data = higher confidence
    if (repaymentCount > 12) {
      confidence = 0.9;
    } else if (repaymentCount > 6) {
      confidence = 0.75;
    } else if (repaymentCount > 3) {
      confidence = 0.6;
    }

    // Existing customer = higher confidence
    if (customer) {
      confidence += 0.1;
    }

    return Math.min(1, confidence);
  }

  private calculateNextOptimalTime(optimalWindow: string, now: Date): Date {
    // Parse window (e.g., '14:00-16:00')
    const [start, end] = optimalWindow.split('-');
    const [startHour, startMin] = start.split(':').map(Number);
    const [endHour] = end.split(':').map(Number);

    const nextTime = new Date(now);
    nextTime.setHours(startHour, startMin || 0, 0, 0);

    // If time has passed today, schedule for tomorrow
    if (nextTime < now) {
      nextTime.setDate(nextTime.getDate() + 1);
    }

    return nextTime;
  }
}

