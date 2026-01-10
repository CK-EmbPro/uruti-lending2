import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LoanApplication } from '../../loan-application/entities/loan-application.entity';
import { LoanProduct } from '../../loan-product/entities/loan-product.entity';
import { Loan } from '../../loan/entities/loan.entity';
import { LoanRepayment } from '../../loan-repayment/entities/loan-repayment.entity';
import {
  PricingQuoteDto,
  PricingComponentsDto,
  RiskPremiumTierDto,
  RiskTier,
  DynamicLimitDto,
  PortfolioOptimizationDto,
  StressTestScenarioDto,
  CalculatePricingRequestDto,
  UpdateLimitRequestDto,
} from '../dto/risk-based-pricing.dto';
import { WeightedCreditScoringService } from '../../credit-scoring-engine/services/weighted-credit-scoring.service';
import { NotificationService } from '../../notification/services/notification.service';
import { NotificationType } from '../../../common/enums/notification-type.enum';
import { NotificationChannel } from '../../../common/enums/notification-channel.enum';

@Injectable()
export class RiskBasedPricingService {
  private readonly logger = new Logger(RiskBasedPricingService.name);

  // Risk premium tiers
  private readonly RISK_TIERS: RiskPremiumTierDto[] = [
    {
      riskTier: RiskTier.EXCELLENT,
      scoreMin: 900,
      scoreMax: 1000,
      premiumAdjustment: -2.0, // -2%
    },
    {
      riskTier: RiskTier.GOOD,
      scoreMin: 700,
      scoreMax: 899,
      premiumAdjustment: 0.0, // 0%
    },
    {
      riskTier: RiskTier.FAIR,
      scoreMin: 500,
      scoreMax: 699,
      premiumAdjustment: 5.5, // Average of 3-8%
    },
    {
      riskTier: RiskTier.POOR,
      scoreMin: 0,
      scoreMax: 499,
      premiumAdjustment: 12.5, // Average of 10-15%
    },
  ];

  // Business rules
  private readonly BASE_RATE = 12.0; // Base interest rate
  private readonly OPERATIONAL_COST = 2.0; // Operational cost
  private readonly MARGIN = 5.0; // Minimum margin
  private readonly RATE_FLOOR = 19.0; // Minimum rate (covers cost + ops + margin)
  private readonly RATE_CEILING = 35.0; // Maximum rate (regulatory/competitive)

  // Dynamic limit rules
  private readonly INITIAL_LIMIT_PERCENTAGE = 0.2; // 20% of income/revenue
  private readonly INCREASE_TRIGGER_PAYMENTS = 3; // 3+ on-time payments
  private readonly INCREASE_PERCENTAGE_MIN = 0.2; // 20% minimum increase
  private readonly INCREASE_PERCENTAGE_MAX = 0.5; // 50% maximum increase
  private readonly MAX_INCREASES_PER_YEAR = 3;
  private readonly DECREASE_TRIGGER_LATE_PAYMENTS = 2; // 2+ late payments

  constructor(
    @InjectRepository(LoanApplication)
    private readonly loanApplicationRepository: Repository<LoanApplication>,
    @InjectRepository(LoanProduct)
    private readonly loanProductRepository: Repository<LoanProduct>,
    @InjectRepository(Loan)
    private readonly loanRepository: Repository<Loan>,
    @InjectRepository(LoanRepayment)
    private readonly repaymentRepository: Repository<LoanRepayment>,
    private readonly creditScoringService: WeightedCreditScoringService,
    private readonly notificationService: NotificationService,
  ) {}

  /**
   * Calculate personalized interest rate for a loan application
   */
  async calculatePricing(request: CalculatePricingRequestDto): Promise<PricingQuoteDto> {
    this.logger.log(`Calculating pricing for application ${request.loanApplicationId}`);

    // Get loan application
    const application = await this.loanApplicationRepository.findOne({
      where: { id: request.loanApplicationId },
      relations: ['loanProduct'],
    });

    if (!application) {
      throw new Error(`Loan application ${request.loanApplicationId} not found`);
    }

    // Get credit score
    let creditScore = request.creditScore;
    if (!creditScore) {
      // Try to get credit score from application or use default
      // Note: Full credit scoring would require WeightedScoringRequest with all applicant data
      // For now, use a default score if not provided
      creditScore = 500; // Default to 500 if not available
      this.logger.warn(`Credit score not provided for application ${request.loanApplicationId}, using default: ${creditScore}`);
    }

    // Determine risk tier
    const riskTier = this.determineRiskTier(creditScore);
    const riskTierConfig = this.RISK_TIERS.find((t) => t.riskTier === riskTier)!;

    // Calculate pricing components
    const pricingComponents = this.calculatePricingComponents(
      creditScore,
      riskTierConfig.premiumAdjustment,
    );

    // Calculate loan details
    const monthlyPayment = this.calculateMonthlyPayment(
      request.loanAmount,
      pricingComponents.finalRate,
      request.loanTerm,
    );
    const totalInterest = monthlyPayment * request.loanTerm - request.loanAmount;

    // Generate explanation
    const explanation = this.generatePricingExplanation(
      creditScore,
      riskTier,
      pricingComponents,
      this.RATE_FLOOR,
      this.RATE_CEILING,
    );

    return {
      loanApplicationId: request.loanApplicationId,
      customerId: application.applicantId,
      creditScore,
      riskTier,
      pricingComponents,
      marketRateMin: this.RATE_FLOOR,
      marketRateMax: this.RATE_CEILING,
      explanation,
      loanAmount: request.loanAmount,
      loanTerm: request.loanTerm,
      monthlyPayment,
      totalInterest,
    };
  }

  /**
   * Calculate pricing components
   */
  private calculatePricingComponents(
    creditScore: number,
    riskPremiumAdjustment: number,
  ): PricingComponentsDto {
    // Base rate
    const baseRate = this.BASE_RATE;

    // Risk premium (adjusted based on tier)
    const riskPremium = Math.max(0, riskPremiumAdjustment);

    // Operational cost
    const operationalCost = this.OPERATIONAL_COST;

    // Margin
    const margin = this.MARGIN;

    // Calculate final rate
    let finalRate = baseRate + riskPremium + operationalCost + margin;

    // Apply rate floor
    finalRate = Math.max(finalRate, this.RATE_FLOOR);

    // Apply rate ceiling
    finalRate = Math.min(finalRate, this.RATE_CEILING);

    return {
      baseRate,
      riskPremium,
      operationalCost,
      margin,
      finalRate: Math.round(finalRate * 100) / 100, // Round to 2 decimal places
    };
  }

  /**
   * Determine risk tier from credit score
   */
  private determineRiskTier(creditScore: number): RiskTier {
    if (creditScore >= 900) return RiskTier.EXCELLENT;
    if (creditScore >= 700) return RiskTier.GOOD;
    if (creditScore >= 500) return RiskTier.FAIR;
    return RiskTier.POOR;
  }

  /**
   * Generate pricing explanation
   */
  private generatePricingExplanation(
    creditScore: number,
    riskTier: RiskTier,
    components: PricingComponentsDto,
    rateFloor: number,
    rateCeiling: number,
  ): string {
    const tierDescriptions = {
      [RiskTier.EXCELLENT]: 'excellent',
      [RiskTier.GOOD]: 'good',
      [RiskTier.FAIR]: 'fair',
      [RiskTier.POOR]: 'poor',
    };

    return `Your interest rate of ${components.finalRate}% is based on your credit score of ${creditScore} (${tierDescriptions[riskTier]} tier). ` +
      `The rate includes: base rate (${components.baseRate}%), risk premium (${components.riskPremium}%), ` +
      `operational costs (${components.operationalCost}%), and margin (${components.margin}%). ` +
      `Market rates range from ${rateFloor}% to ${rateCeiling}%.`;
  }

  /**
   * Calculate monthly payment
   */
  private calculateMonthlyPayment(principal: number, annualRate: number, termMonths: number): number {
    const monthlyRate = annualRate / 100 / 12;
    if (monthlyRate === 0) {
      return principal / termMonths;
    }
    const payment = principal * (monthlyRate * Math.pow(1 + monthlyRate, termMonths)) /
      (Math.pow(1 + monthlyRate, termMonths) - 1);
    return Math.round(payment * 100) / 100;
  }

  /**
   * Get dynamic limit for a customer
   */
  async getDynamicLimit(customerId: string): Promise<DynamicLimitDto> {
    // Get customer's loans and repayment history
    const loans = await this.loanRepository.find({
      where: { applicantId: customerId },
    });

    // Get initial limit (would be stored in customer profile)
    const initialLimit = 50000; // Would fetch from customer profile
    let currentLimit = initialLimit;

    // Count on-time payments
    let onTimePaymentCount = 0;
    for (const loan of loans) {
      const repayments = await this.repaymentRepository.find({
        where: { loanId: loan.id },
        order: { postingDate: 'DESC' },
      });
      // Count on-time payments (simplified - would check against schedule)
      onTimePaymentCount += repayments.filter((r) => r.amountPaid && r.amountPaid > 0).length;
    }

    // Check eligibility for increase
    const eligibleForIncrease = this.checkIncreaseEligibility(
      customerId,
      onTimePaymentCount,
      currentLimit,
    );

    // Get limit history (would be stored in database)
    const lastIncreaseDate = undefined; // Would fetch from limit history
    const increasesThisYear = 0; // Would count from limit history

    // Calculate suggested new limit if eligible
    let suggestedNewLimit: number | undefined;
    if (eligibleForIncrease) {
      suggestedNewLimit = this.calculateSuggestedLimit(currentLimit, onTimePaymentCount);
    }

    return {
      customerId,
      currentLimit,
      initialLimit,
      eligibleForIncrease,
      onTimePaymentCount,
      lastIncreaseDate,
      increasesThisYear,
      suggestedNewLimit,
      limitChangeReason: eligibleForIncrease
        ? `${onTimePaymentCount}+ on-time payments`
        : undefined,
    };
  }

  /**
   * Check if customer is eligible for limit increase
   */
  private checkIncreaseEligibility(
    customerId: string,
    onTimePaymentCount: number,
    currentLimit: number,
  ): boolean {
    // Must have 3+ on-time payments
    if (onTimePaymentCount < this.INCREASE_TRIGGER_PAYMENTS) {
      return false;
    }

    // Check increases this year (would query from limit history)
    const increasesThisYear = 0; // Would fetch from database
    if (increasesThisYear >= this.MAX_INCREASES_PER_YEAR) {
      return false;
    }

    // Check for late payments (would check repayment history)
    // If 2+ late payments, not eligible
    // Simplified for now

    return true;
  }

  /**
   * Calculate suggested new limit
   */
  private calculateSuggestedLimit(currentLimit: number, onTimePaymentCount: number): number {
    // Increase percentage based on payment count
    let increasePercentage = this.INCREASE_PERCENTAGE_MIN;
    if (onTimePaymentCount >= 6) {
      increasePercentage = this.INCREASE_PERCENTAGE_MAX;
    } else if (onTimePaymentCount >= 4) {
      increasePercentage = 0.35; // 35%
    }

    const increase = currentLimit * increasePercentage;
    return Math.round(currentLimit + increase);
  }

  /**
   * Update customer limit
   */
  async updateLimit(request: UpdateLimitRequestDto): Promise<DynamicLimitDto> {
    this.logger.log(`Updating limit for customer ${request.customerId} to ${request.newLimit}`);

    // Validate limit change
    const currentLimit = await this.getDynamicLimit(request.customerId);
    
    // Check if increase is within allowed range
    if (request.newLimit > currentLimit.currentLimit) {
      const increasePercentage = (request.newLimit - currentLimit.currentLimit) / currentLimit.currentLimit;
      if (increasePercentage > this.INCREASE_PERCENTAGE_MAX) {
        throw new Error(`Limit increase exceeds maximum allowed percentage (${this.INCREASE_PERCENTAGE_MAX * 100}%)`);
      }
    }

    // Update limit (would save to database)
    // For now, we'll just return the updated limit DTO

    // Send notification
    await this.notificationService.sendNotification({
      recipientId: request.customerId,
      notificationType: NotificationType.APPLICATION_UPDATE,
      channel: NotificationChannel.IN_APP,
      subject: 'Credit Limit Updated',
      body: `Your credit limit has been updated to ${request.newLimit}. Reason: ${request.reason}`,
      metadata: {
        oldLimit: currentLimit.currentLimit,
        newLimit: request.newLimit,
        reason: request.reason,
      },
    });

    return {
      ...currentLimit,
      currentLimit: request.newLimit,
      limitChangeReason: request.reason,
    };
  }

  /**
   * Get portfolio optimization metrics
   */
  async getPortfolioOptimization(): Promise<PortfolioOptimizationDto> {
    // Get all active loans
    const activeLoans = await this.loanRepository.find({
      where: { status: 'ACTIVE' as any },
    });

    // Calculate current yield
    let totalInterest = 0;
    let totalPrincipal = 0;
    for (const loan of activeLoans) {
      totalPrincipal += loan.loanAmount || 0;
      // Calculate interest (simplified)
      totalInterest += (loan.loanAmount || 0) * ((loan.rateOfInterest || 0) / 100);
    }
    const currentYield = totalPrincipal > 0 ? (totalInterest / totalPrincipal) * 100 : 0;

    // Calculate expected NPL rate (simplified)
    const expectedNPLRate = 3.5; // Would calculate from historical data

    // Calculate capital utilization
    const totalCapital = 10000000; // Would get from capital management
    const capitalUtilization = (totalPrincipal / totalCapital) * 100;

    // Calculate diversification score (simplified)
    const diversificationScore = 0.75; // Would calculate from segment/geo/industry distribution

    // Generate recommendations
    const recommendations = this.generateOptimizationRecommendations(
      currentYield,
      expectedNPLRate,
      capitalUtilization,
      diversificationScore,
    );

    return {
      targetYield: 18.5,
      currentYield: Math.round(currentYield * 100) / 100,
      expectedNPLRate,
      capitalUtilization: Math.round(capitalUtilization * 100) / 100,
      diversificationScore,
      recommendations,
      lastOptimizationDate: new Date().toISOString(),
    };
  }

  /**
   * Generate optimization recommendations
   */
  private generateOptimizationRecommendations(
    currentYield: number,
    expectedNPLRate: number,
    capitalUtilization: number,
    diversificationScore: number,
  ): string[] {
    const recommendations: string[] = [];

    if (currentYield < 18.0) {
      recommendations.push('Consider increasing risk premium for lower credit score segments');
    }

    if (expectedNPLRate > 4.0) {
      recommendations.push('NPL rate is high - review underwriting criteria');
    }

    if (capitalUtilization > 90) {
      recommendations.push('Capital utilization is high - consider raising additional capital');
    } else if (capitalUtilization < 70) {
      recommendations.push('Capital utilization is low - consider expanding lending');
    }

    if (diversificationScore < 0.7) {
      recommendations.push('Portfolio diversification is low - consider expanding to new segments');
    }

    return recommendations;
  }

  /**
   * Run stress test scenario
   */
  async runStressTest(scenarioName: string, unemploymentRate: number): Promise<StressTestScenarioDto> {
    this.logger.log(`Running stress test: ${scenarioName} with ${unemploymentRate}% unemployment`);

    // Get portfolio data
    const portfolio = await this.getPortfolioOptimization();

    // Calculate impact (simplified - would use sophisticated models)
    const nplMultiplier = unemploymentRate / 5.0; // Assume 5% is baseline
    const expectedNPLIncrease = (portfolio.expectedNPLRate * nplMultiplier) - portfolio.expectedNPLRate;

    // Calculate yield impact
    const yieldImpactPerNPL = -0.5; // Each 1% NPL increase reduces yield by 0.5%
    const expectedYieldImpact = expectedNPLIncrease * yieldImpactPerNPL;

    // Calculate capital at risk
    const activeLoans = await this.loanRepository.find({
      where: { status: 'ACTIVE' as any },
    });
    const totalExposure = activeLoans.reduce((sum, loan) => sum + (loan.loanAmount || 0), 0);
    const capitalAtRisk = totalExposure * (expectedNPLIncrease / 100);

    // Generate recommendations
    const recommendations = this.generateStressTestRecommendations(
      unemploymentRate,
      expectedNPLIncrease,
      capitalAtRisk,
    );

    return {
      scenarioName,
      unemploymentRate,
      expectedNPLIncrease: Math.round(expectedNPLIncrease * 100) / 100,
      expectedYieldImpact: Math.round(expectedYieldImpact * 100) / 100,
      capitalAtRisk: Math.round(capitalAtRisk),
      recommendations,
    };
  }

  /**
   * Generate stress test recommendations
   */
  private generateStressTestRecommendations(
    unemploymentRate: number,
    expectedNPLIncrease: number,
    capitalAtRisk: number,
  ): string[] {
    const recommendations: string[] = [];

    if (unemploymentRate > 10) {
      recommendations.push('High unemployment scenario - consider tightening credit criteria');
      recommendations.push('Increase provisions for expected losses');
    }

    if (expectedNPLIncrease > 5) {
      recommendations.push('Significant NPL increase expected - review portfolio composition');
      recommendations.push('Consider early intervention strategies for at-risk loans');
    }

    if (capitalAtRisk > 1000000) {
      recommendations.push('Significant capital at risk - consider risk mitigation strategies');
      recommendations.push('Review capital adequacy ratios');
    }

    return recommendations;
  }
}

