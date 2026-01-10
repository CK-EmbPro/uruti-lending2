import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan, MoreThan } from 'typeorm';
import { PredictionResult, PredictionType, RiskLevel } from '../entities/prediction-result.entity';
import { PredictionModel, ModelStatus, ModelType } from '../entities/prediction-model.entity';
import {
  PredictDefaultProbabilityDto,
  PredictCustomerLifetimeValueDto,
  PredictChurnRiskDto,
  PredictOptimalPricingDto,
  BatchPredictionDto,
} from '../dto/predictive-analytics.dto';
import { Loan } from '../../loan/entities/loan.entity';
import { LoanApplication } from '../../loan-application/entities/loan-application.entity';
import { LoanRepayment } from '../../loan-repayment/entities/loan-repayment.entity';

/**
 * Predictive Analytics Service
 * Provides ML-powered predictions for default probability, CLV, churn risk, and pricing
 */
@Injectable()
export class PredictiveAnalyticsService {
  private readonly logger = new Logger(PredictiveAnalyticsService.name);

  constructor(
    @InjectRepository(PredictionResult)
    private readonly predictionResultRepository: Repository<PredictionResult>,
    @InjectRepository(PredictionModel)
    private readonly modelRepository: Repository<PredictionModel>,
    @InjectRepository(Loan)
    private readonly loanRepository: Repository<Loan>,
    @InjectRepository(LoanApplication)
    private readonly applicationRepository: Repository<LoanApplication>,
    @InjectRepository(LoanRepayment)
    private readonly repaymentRepository: Repository<LoanRepayment>,
  ) {}

  /**
   * Predict default probability for a loan or application
   */
  async predictDefaultProbability(dto: PredictDefaultProbabilityDto): Promise<PredictionResult> {
    const entity = dto.entityType === 'application'
      ? await this.applicationRepository.findOne({ where: { id: dto.entityId } })
      : await this.loanRepository.findOne({ where: { id: dto.entityId } });

    if (!entity) {
      throw new NotFoundException(`${dto.entityType || 'Entity'} ${dto.entityId} not found`);
    }

    // Get active model for default probability
    const model = await this.getActiveModel(PredictionType.DEFAULT_PROBABILITY);

    // Calculate features
    const features = await this.extractDefaultProbabilityFeatures(entity, dto.entityType || 'loan');

    // Get prediction (rule-based for now, can be replaced with ML model)
    const prediction = await this.calculateDefaultProbability(features, model);

    // Save prediction result
    const result = this.predictionResultRepository.create({
      entityId: dto.entityId,
      entityType: dto.entityType || 'loan',
      predictionType: PredictionType.DEFAULT_PROBABILITY,
      score: prediction.probability,
      riskLevel: prediction.riskLevel,
      confidence: prediction.confidence,
      features,
      factors: prediction.factors,
      explanation: prediction.explanation,
      recommendations: prediction.recommendations,
      modelVersion: model?.version || null,
      calculatedAt: new Date(),
      expiresAt: new Date(Date.now() + (dto.timeHorizon || 90) * 24 * 60 * 60 * 1000),
    });

    return await this.predictionResultRepository.save(result);
  }

  /**
   * Predict customer lifetime value
   */
  async predictCustomerLifetimeValue(dto: PredictCustomerLifetimeValueDto): Promise<PredictionResult> {
    const model = await this.getActiveModel(PredictionType.CUSTOMER_LIFETIME_VALUE);

    // Get customer's loan history
    const loans = await this.loanRepository.find({
      where: { applicantId: dto.customerId },
    });

    const features = await this.extractCLVFeatures(dto.customerId, loans);
    const prediction = await this.calculateCLV(features, model, dto.timeHorizon || 36);

    const result = this.predictionResultRepository.create({
      entityId: dto.customerId,
      entityType: 'customer',
      predictionType: PredictionType.CUSTOMER_LIFETIME_VALUE,
      score: prediction.clv,
      riskLevel: null,
      confidence: prediction.confidence,
      features,
      factors: prediction.factors,
      explanation: prediction.explanation,
      recommendations: prediction.recommendations,
      modelVersion: model?.version || null,
      calculatedAt: new Date(),
    });

    return await this.predictionResultRepository.save(result);
  }

  /**
   * Predict churn risk
   */
  async predictChurnRisk(dto: PredictChurnRiskDto): Promise<PredictionResult> {
    const model = await this.getActiveModel(PredictionType.CHURN_RISK);

    const loans = await this.loanRepository.find({
      where: { applicantId: dto.customerId },
    });

    const features = await this.extractChurnFeatures(dto.customerId, loans);
    const prediction = await this.calculateChurnRisk(features, model);

    const result = this.predictionResultRepository.create({
      entityId: dto.customerId,
      entityType: 'customer',
      predictionType: PredictionType.CHURN_RISK,
      score: prediction.churnProbability,
      riskLevel: prediction.riskLevel,
      confidence: prediction.confidence,
      features,
      factors: prediction.factors,
      explanation: prediction.explanation,
      recommendations: prediction.recommendations,
      modelVersion: model?.version || null,
      calculatedAt: new Date(),
    });

    return await this.predictionResultRepository.save(result);
  }

  /**
   * Predict optimal pricing
   */
  async predictOptimalPricing(dto: PredictOptimalPricingDto): Promise<PredictionResult> {
    const application = await this.applicationRepository.findOne({
      where: { id: dto.applicationId },
    });

    if (!application) {
      throw new NotFoundException(`Application ${dto.applicationId} not found`);
    }

    const model = await this.getActiveModel(PredictionType.OPTIMAL_PRICING);

    const features = await this.extractPricingFeatures(application, dto);
    const prediction = await this.calculateOptimalPricing(features, model);

    const result = this.predictionResultRepository.create({
      entityId: dto.applicationId,
      entityType: 'application',
      predictionType: PredictionType.OPTIMAL_PRICING,
      score: prediction.optimalRate,
      riskLevel: null,
      confidence: prediction.confidence,
      features,
      factors: prediction.factors,
      explanation: prediction.explanation,
      recommendations: prediction.recommendations,
      modelVersion: model?.version || null,
      calculatedAt: new Date(),
    });

    return await this.predictionResultRepository.save(result);
  }

  /**
   * Batch predictions
   */
  async batchPredict(dto: BatchPredictionDto): Promise<PredictionResult[]> {
    const results: PredictionResult[] = [];

    for (const entityId of dto.entityIds) {
      try {
        let result: PredictionResult;

        switch (dto.predictionType) {
          case PredictionType.DEFAULT_PROBABILITY:
            result = await this.predictDefaultProbability({
              entityId,
              entityType: (dto.entityType as any) || 'loan',
            });
            break;
          case PredictionType.CUSTOMER_LIFETIME_VALUE:
            result = await this.predictCustomerLifetimeValue({ customerId: entityId });
            break;
          case PredictionType.CHURN_RISK:
            result = await this.predictChurnRisk({ customerId: entityId });
            break;
          default:
            throw new BadRequestException(`Batch prediction not supported for ${dto.predictionType}`);
        }

        results.push(result);
      } catch (error) {
        this.logger.error(`Failed to predict for ${entityId}: ${error.message}`);
      }
    }

    return results;
  }

  // Private helper methods

  private async getActiveModel(predictionType: PredictionType): Promise<PredictionModel | null> {
    return await this.modelRepository.findOne({
      where: {
        predictionType,
        status: ModelStatus.ACTIVE,
      },
      order: { deployedAt: 'DESC' },
    });
  }

  private async extractDefaultProbabilityFeatures(entity: any, entityType: string): Promise<Record<string, any>> {
    const features: Record<string, any> = {};

    if (entityType === 'loan') {
      features.loanAmount = Number(entity.disbursedAmount || entity.requestedAmount || 0);
      features.loanTerm = entity.loanTerm || 0;
      features.interestRate = Number(entity.interestRate || 0);
      features.loanAge = this.calculateLoanAge(entity);
      features.currentBalance = Number(entity.currentBalance || 0);
      features.daysPastDue = entity.daysPastDue || 0;
      features.paymentHistory = await this.getPaymentHistory(entity.id);
    } else {
      features.requestedAmount = Number(entity.requestedAmount || 0);
      features.applicantCreditScore = (entity as any).creditScore || 0;
      features.applicantIncome = (entity as any).monthlyIncome || 0;
      features.debtToIncomeRatio = this.calculateDebtToIncomeRatio(entity);
    }

    return features;
  }

  private async calculateDefaultProbability(
    features: Record<string, any>,
    model: PredictionModel | null,
  ): Promise<{
    probability: number;
    riskLevel: RiskLevel;
    confidence: number;
    factors: Record<string, any>;
    explanation: string;
    recommendations: Record<string, any>;
  }> {
    // Rule-based prediction (can be replaced with ML model)
    let probability = 0.05; // Base 5% default probability
    const factors: Record<string, number> = {};

    // Factor 1: Days past due
    if (features.daysPastDue > 0) {
      const dpdFactor = Math.min(0.4, features.daysPastDue / 90);
      probability += dpdFactor;
      factors.daysPastDue = dpdFactor;
    }

    // Factor 2: Payment history
    if (features.paymentHistory) {
      const onTimeRate = features.paymentHistory.onTimeRate || 0;
      const lateFactor = (1 - onTimeRate) * 0.3;
      probability += lateFactor;
      factors.paymentHistory = lateFactor;
    }

    // Factor 3: Loan-to-income ratio
    if (features.loanAmount && features.applicantIncome) {
      const ltiRatio = features.loanAmount / (features.applicantIncome * 12);
      if (ltiRatio > 0.5) {
        const ltiFactor = (ltiRatio - 0.5) * 0.2;
        probability += ltiFactor;
        factors.loanToIncomeRatio = ltiFactor;
      }
    }

    // Factor 4: Credit score
    if (features.applicantCreditScore) {
      if (features.applicantCreditScore < 600) {
        probability += 0.15;
        factors.lowCreditScore = 0.15;
      } else if (features.applicantCreditScore < 650) {
        probability += 0.08;
        factors.moderateCreditScore = 0.08;
      }
    }

    probability = Math.min(1, Math.max(0, probability));

    // Determine risk level
    let riskLevel: RiskLevel;
    if (probability >= 0.5) {
      riskLevel = RiskLevel.CRITICAL;
    } else if (probability >= 0.3) {
      riskLevel = RiskLevel.HIGH;
    } else if (probability >= 0.15) {
      riskLevel = RiskLevel.MEDIUM;
    } else {
      riskLevel = RiskLevel.LOW;
    }

    const confidence = 75 + (model ? 10 : 0); // Higher confidence if using ML model

    const explanation = `Default probability: ${(probability * 100).toFixed(1)}%. Risk level: ${riskLevel}. ` +
      `Key factors: ${Object.keys(factors).join(', ')}.`;

    const recommendations: string[] = [];
    if (probability >= 0.3) {
      recommendations.push('Consider early intervention or restructuring');
    }
    if (features.daysPastDue > 30) {
      recommendations.push('Immediate collection action recommended');
    }
    if (features.paymentHistory?.onTimeRate < 0.8) {
      recommendations.push('Payment behavior monitoring required');
    }

    return {
      probability,
      riskLevel,
      confidence,
      factors,
      explanation,
      recommendations: { actions: recommendations },
    };
  }

  private async extractCLVFeatures(customerId: string, loans: any[]): Promise<Record<string, any>> {
    const totalLoans = loans.length;
    const totalDisbursed = loans.reduce((sum, loan) => sum + Number(loan.disbursedAmount || 0), 0);
    const totalRepaid = loans.reduce((sum, loan) => sum + Number(loan.totalRepaid || 0), 0);
    const averageLoanSize = totalLoans > 0 ? totalDisbursed / totalLoans : 0;
    const repaymentRate = totalDisbursed > 0 ? totalRepaid / totalDisbursed : 0;

    return {
      totalLoans,
      totalDisbursed,
      totalRepaid,
      averageLoanSize,
      repaymentRate,
      customerAge: this.calculateCustomerAge(loans),
    };
  }

  private async calculateCLV(
    features: Record<string, any>,
    model: PredictionModel | null,
    timeHorizon: number,
  ): Promise<{
    clv: number;
    confidence: number;
    factors: Record<string, any>;
    explanation: string;
    recommendations: Record<string, any>;
  }> {
    // Rule-based CLV calculation
    const baseCLV = features.averageLoanSize * features.totalLoans;
    const growthFactor = 1 + (features.repaymentRate * 0.2); // Good repayment = growth
    const retentionFactor = features.totalLoans > 1 ? 1.3 : 1.0; // Repeat customers worth more

    const clv = baseCLV * growthFactor * retentionFactor * (timeHorizon / 36);

    return {
      clv: Number(clv.toFixed(2)),
      confidence: 70,
      factors: {
        baseCLV,
        growthFactor,
        retentionFactor,
      },
      explanation: `Estimated CLV: $${clv.toFixed(2)} over ${timeHorizon} months. Based on loan history and repayment behavior.`,
      recommendations: {
        actions: features.repaymentRate > 0.9
          ? ['High-value customer - prioritize retention', 'Consider upselling additional products']
          : ['Focus on improving repayment behavior', 'Consider loyalty programs'],
      },
    };
  }

  private async extractChurnFeatures(customerId: string, loans: any[]): Promise<Record<string, any>> {
    const activeLoans = loans.filter((l) => l.status === 'ACTIVE').length;
    const lastLoanDate = loans.length > 0
      ? new Date(Math.max(...loans.map((l) => new Date(l.createdAt).getTime())))
      : null;
    const daysSinceLastLoan = lastLoanDate
      ? Math.floor((Date.now() - lastLoanDate.getTime()) / (1000 * 60 * 60 * 24))
      : 999;

    return {
      totalLoans: loans.length,
      activeLoans,
      daysSinceLastLoan,
      hasActiveLoan: activeLoans > 0,
    };
  }

  private async calculateChurnRisk(
    features: Record<string, any>,
    model: PredictionModel | null,
  ): Promise<{
    churnProbability: number;
    riskLevel: RiskLevel;
    confidence: number;
    factors: Record<string, any>;
    explanation: string;
    recommendations: Record<string, any>;
  }> {
    let churnProbability = 0.1; // Base 10% churn probability

    if (!features.hasActiveLoan && features.daysSinceLastLoan > 180) {
      churnProbability = 0.6;
    } else if (!features.hasActiveLoan && features.daysSinceLastLoan > 90) {
      churnProbability = 0.4;
    } else if (features.totalLoans === 0) {
      churnProbability = 0.3;
    }

    const riskLevel = churnProbability >= 0.5
      ? RiskLevel.HIGH
      : churnProbability >= 0.3
      ? RiskLevel.MEDIUM
      : RiskLevel.LOW;

    return {
      churnProbability,
      riskLevel,
      confidence: 65,
      factors: {
        daysSinceLastLoan: features.daysSinceLastLoan,
        hasActiveLoan: features.hasActiveLoan,
      },
      explanation: `Churn risk: ${(churnProbability * 100).toFixed(1)}%. ${features.hasActiveLoan ? 'Has active loan' : 'No active loans'}.`,
      recommendations: {
        actions: churnProbability > 0.4
          ? ['Immediate re-engagement campaign', 'Offer new product incentives']
          : ['Regular communication', 'Monitor engagement'],
      },
    };
  }

  private async extractPricingFeatures(application: any, dto: PredictOptimalPricingDto): Promise<Record<string, any>> {
    return {
      requestedAmount: dto.requestedAmount || Number(application.requestedAmount || 0),
      loanTerm: dto.loanTerm || application.loanTerm || 12,
      applicantCreditScore: (application as any).creditScore || 0,
      applicantIncome: (application as any).monthlyIncome || 0,
      debtToIncomeRatio: this.calculateDebtToIncomeRatio(application),
    };
  }

  private async calculateOptimalPricing(
    features: Record<string, any>,
    model: PredictionModel | null,
  ): Promise<{
    optimalRate: number;
    confidence: number;
    factors: Record<string, any>;
    explanation: string;
    recommendations: Record<string, any>;
  }> {
    // Base interest rate
    let baseRate = 12.0; // 12% base rate

    // Adjust based on credit score
    if (features.applicantCreditScore < 600) {
      baseRate += 5.0;
    } else if (features.applicantCreditScore < 650) {
      baseRate += 2.5;
    } else if (features.applicantCreditScore >= 750) {
      baseRate -= 2.0;
    }

    // Adjust based on debt-to-income
    if (features.debtToIncomeRatio > 0.4) {
      baseRate += 2.0;
    }

    // Adjust based on loan amount
    if (features.requestedAmount > 50000) {
      baseRate -= 0.5; // Lower rate for larger loans
    }

    baseRate = Math.max(5.0, Math.min(25.0, baseRate)); // Clamp between 5% and 25%

    return {
      optimalRate: Number(baseRate.toFixed(2)),
      confidence: 75,
      factors: {
        baseRate: 12.0,
        creditScoreAdjustment: features.applicantCreditScore < 600 ? 5.0 : features.applicantCreditScore < 650 ? 2.5 : 0,
        dtiAdjustment: features.debtToIncomeRatio > 0.4 ? 2.0 : 0,
      },
      explanation: `Optimal interest rate: ${baseRate.toFixed(2)}%. Based on credit score, debt-to-income ratio, and loan amount.`,
      recommendations: {
        actions: [
          'Rate is competitive for this risk profile',
          'Consider promotional rate for high-value customers',
        ],
      },
    };
  }

  // Helper methods
  private calculateLoanAge(loan: any): number {
    const disbursedDate = loan.disbursedDate || loan.createdAt;
    return Math.floor((Date.now() - new Date(disbursedDate).getTime()) / (1000 * 60 * 60 * 24));
  }

  private async getPaymentHistory(loanId: string): Promise<{ onTimeRate: number; totalPayments: number }> {
    const repayments = await this.repaymentRepository.find({
      where: { loanId },
    });

    if (repayments.length === 0) {
      return { onTimeRate: 1.0, totalPayments: 0 };
    }

    const onTimePayments = repayments.filter((r) => {
      const dueDate = (r as any).dueDate;
      const paidDate = r.postingDate;
      return dueDate && paidDate && new Date(paidDate) <= new Date(dueDate);
    }).length;

    return {
      onTimeRate: onTimePayments / repayments.length,
      totalPayments: repayments.length,
    };
  }

  private calculateDebtToIncomeRatio(application: any): number {
    const monthlyIncome = (application as any).monthlyIncome || 0;
    const requestedAmount = Number(application.requestedAmount || 0);
    const loanTerm = application.loanTerm || 12;

    if (monthlyIncome === 0) return 0;

    const monthlyPayment = requestedAmount / loanTerm;
    return monthlyPayment / monthlyIncome;
  }

  private calculateCustomerAge(loans: any[]): number {
    if (loans.length === 0) return 0;
    const firstLoanDate = new Date(Math.min(...loans.map((l) => new Date(l.createdAt).getTime())));
    return Math.floor((Date.now() - firstLoanDate.getTime()) / (1000 * 60 * 60 * 24));
  }
}

