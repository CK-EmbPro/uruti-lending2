import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LoanProduct } from '../../loan-product/entities/loan-product.entity';
import { Loan } from '../../loan/entities/loan.entity';
import { CalculationService } from '../../calculation/calculation.service';
import { CalculateDynamicPriceDto, DynamicPricingResult } from '../dto/dynamic-pricing.dto';

@Injectable()
export class DynamicPricingService {
  private readonly logger = new Logger(DynamicPricingService.name);

  constructor(
    @InjectRepository(LoanProduct)
    private readonly loanProductRepository: Repository<LoanProduct>,
    @InjectRepository(Loan)
    private readonly loanRepository: Repository<Loan>,
    private readonly calculationService: CalculationService,
  ) {}

  /**
   * Calculate dynamic pricing for loan
   */
  async calculatePrice(
    dto: CalculateDynamicPriceDto,
    companyId: string,
  ): Promise<DynamicPricingResult> {
    this.logger.log(`Calculating dynamic price for customer ${dto.customerId}`);

    // Get loan product
    const product = await this.loanProductRepository.findOne({
      where: { id: dto.loanProductId, companyId },
    });

    if (!product) {
      throw new Error(`Loan product ${dto.loanProductId} not found`);
    }

    const baseRate = Number(product.rateOfInterest);
    let finalRate = baseRate;
    const adjustments: Array<{ factor: string; adjustment: number; reason: string }> = [];

    // Get customer history
    const previousLoans = await this.loanRepository.find({
      where: {
        applicantId: dto.customerId,
        companyId,
      },
    });

    // Adjustment 1: Credit Score (-2% to +2%)
    if (dto.creditScore) {
      const creditAdjustment = this.calculateCreditScoreAdjustment(dto.creditScore);
      finalRate += creditAdjustment.adjustment;
      adjustments.push(creditAdjustment);
    }

    // Adjustment 2: Relationship Discount (-0.5% to -1%)
    if (dto.hasExistingRelationship || (previousLoans.length > 0)) {
      const relationshipAdjustment = this.calculateRelationshipAdjustment(previousLoans.length);
      finalRate += relationshipAdjustment.adjustment;
      adjustments.push(relationshipAdjustment);
    }

    // Adjustment 3: Loan Amount Discount (-0.5% for large loans)
    if (dto.requestedAmount >= 500000) {
      adjustments.push({
        factor: 'Loan Amount',
        adjustment: -0.5,
        reason: 'Large loan amount discount',
      });
      finalRate -= 0.5;
    }

    // Adjustment 4: Collateral Discount (-1% to -2%)
    if (dto.hasCollateral) {
      adjustments.push({
        factor: 'Collateral',
        adjustment: -1.5,
        reason: 'Secured loan discount',
      });
      finalRate -= 1.5;
    }

    // Adjustment 5: Tenure Adjustment (+0.5% for long tenure)
    if (dto.requestedTenure > 36) {
      adjustments.push({
        factor: 'Tenure',
        adjustment: 0.5,
        reason: 'Long tenure risk adjustment',
      });
      finalRate += 0.5;
    }

    // Adjustment 6: Income-based adjustment
    if (dto.monthlyIncome) {
      const incomeAdjustment = this.calculateIncomeAdjustment(dto.monthlyIncome, dto.requestedAmount);
      if (incomeAdjustment) {
        finalRate += incomeAdjustment.adjustment;
        adjustments.push(incomeAdjustment);
      }
    }

    // Ensure rate doesn't go below minimum (e.g., 8%) or above maximum (e.g., 25%)
    finalRate = Math.max(8, Math.min(25, finalRate));

    // Calculate processing fee (typically 1-2% of loan amount)
    const processingFee = this.calculateProcessingFee(dto.requestedAmount, product);

    // Calculate EMI and total cost
    const emi = this.calculationService.calculateEMI(
      dto.requestedAmount,
      finalRate,
      dto.requestedTenure,
      'Monthly',
    );
    const totalCost = emi * dto.requestedTenure + processingFee;

    // Determine pricing tier
    const pricingTier = this.determinePricingTier(finalRate, baseRate);

    // Calculate confidence score
    const confidenceScore = this.calculateConfidenceScore(dto);

    // Generate recommendations
    const recommendations = this.generateRecommendations(dto, finalRate, baseRate, adjustments);

    return {
      baseRate: Math.round(baseRate * 100) / 100,
      finalRate: Math.round(finalRate * 100) / 100,
      adjustments,
      processingFee,
      totalCost: Math.round(totalCost * 100) / 100,
      emi: Math.round(emi * 100) / 100,
      confidenceScore,
      pricingTier,
      recommendations,
    };
  }

  /**
   * Calculate credit score adjustment
   */
  private calculateCreditScoreAdjustment(creditScore: number): {
    factor: string;
    adjustment: number;
    reason: string;
  } {
    if (creditScore >= 800) {
      return {
        factor: 'Credit Score',
        adjustment: -2.0,
        reason: 'Excellent credit score (800+)',
      };
    } else if (creditScore >= 750) {
      return {
        factor: 'Credit Score',
        adjustment: -1.5,
        reason: 'Very good credit score (750-799)',
      };
    } else if (creditScore >= 700) {
      return {
        factor: 'Credit Score',
        adjustment: -1.0,
        reason: 'Good credit score (700-749)',
      };
    } else if (creditScore >= 650) {
      return {
        factor: 'Credit Score',
        adjustment: 0,
        reason: 'Fair credit score (650-699)',
      };
    } else if (creditScore >= 600) {
      return {
        factor: 'Credit Score',
        adjustment: 1.0,
        reason: 'Below average credit score (600-649)',
      };
    } else {
      return {
        factor: 'Credit Score',
        adjustment: 2.0,
        reason: 'Poor credit score (<600)',
      };
    }
  }

  /**
   * Calculate relationship adjustment
   */
  private calculateRelationshipAdjustment(previousLoansCount: number): {
    factor: string;
    adjustment: number;
    reason: string;
  } {
    if (previousLoansCount >= 3) {
      return {
        factor: 'Relationship',
        adjustment: -1.0,
        reason: 'Loyal customer discount (3+ previous loans)',
      };
    } else if (previousLoansCount >= 1) {
      return {
        factor: 'Relationship',
        adjustment: -0.5,
        reason: 'Existing customer discount',
      };
    }

    return {
      factor: 'Relationship',
      adjustment: 0,
      reason: 'New customer - standard rate',
    };
  }

  /**
   * Calculate income-based adjustment
   */
  private calculateIncomeAdjustment(
    monthlyIncome: number,
    requestedAmount: number,
  ): { factor: string; adjustment: number; reason: string } | null {
    const annualIncome = monthlyIncome * 12;
    const loanToIncomeRatio = requestedAmount / annualIncome;

    if (loanToIncomeRatio <= 0.3 && monthlyIncome >= 100000) {
      return {
        factor: 'Income',
        adjustment: -0.5,
        reason: 'High income and low loan-to-income ratio',
      };
    }

    return null;
  }

  /**
   * Calculate processing fee
   */
  private calculateProcessingFee(amount: number, product: LoanProduct): number {
    // Typically 1-2% of loan amount, with minimum and maximum caps
    const percentage = 0.015; // 1.5%
    const fee = amount * percentage;
    const minFee = 1000;
    const maxFee = 50000;

    return Math.max(minFee, Math.min(maxFee, Math.round(fee)));
  }

  /**
   * Determine pricing tier
   */
  private determinePricingTier(finalRate: number, baseRate: number): 'PREMIUM' | 'STANDARD' | 'BASIC' {
    const discount = baseRate - finalRate;

    if (discount >= 1.5) {
      return 'PREMIUM';
    } else if (discount >= 0.5) {
      return 'STANDARD';
    } else {
      return 'BASIC';
    }
  }

  /**
   * Calculate confidence score
   */
  private calculateConfidenceScore(dto: CalculateDynamicPriceDto): number {
    let confidence = 50;

    if (dto.creditScore) confidence += 20;
    if (dto.monthlyIncome) confidence += 15;
    if (dto.hasExistingRelationship) confidence += 10;
    if (dto.hasCollateral) confidence += 5;

    return Math.min(100, confidence);
  }

  /**
   * Generate recommendations
   */
  private generateRecommendations(
    dto: CalculateDynamicPriceDto,
    finalRate: number,
    baseRate: number,
    adjustments: any[],
  ): string[] {
    const recommendations: string[] = [];

    const discount = baseRate - finalRate;
    if (discount > 0) {
      recommendations.push(`You're getting a ${discount.toFixed(2)}% discount from the base rate!`);
    }

    if (!dto.creditScore) {
      recommendations.push('Providing credit score could help you get a better rate');
    }

    if (!dto.hasCollateral && dto.requestedAmount > 100000) {
      recommendations.push('Providing collateral could reduce your interest rate by up to 1.5%');
    }

    if (dto.requestedAmount < 500000 && dto.requestedAmount >= 400000) {
      recommendations.push('Increasing loan amount to 500,000+ could unlock additional discounts');
    }

    return recommendations;
  }
}

