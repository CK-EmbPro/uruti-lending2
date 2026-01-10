import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LoanApplication } from '../../loan-application/entities/loan-application.entity';
import { Loan } from '../../loan/entities/loan.entity';
import { LoanProduct } from '../../loan-product/entities/loan-product.entity';
import { LoanStatus } from '../../../common/enums/loan-status.enum';
import {
  CreditDecisionRequestDto,
  CreditDecisionResultDto,
  DecisionStatus,
} from '../dto/credit-decision.dto';
import { TierBasedDecisioningService } from './tier-based-decisioning.service';
import { RiskTier } from '../../credit-scoring-engine/entities/risk-tier-config.entity';

@Injectable()
export class CreditDecisioningService {
  private readonly logger = new Logger(CreditDecisioningService.name);

  constructor(
    @InjectRepository(LoanApplication)
    private readonly applicationRepository: Repository<LoanApplication>,
    @InjectRepository(Loan)
    private readonly loanRepository: Repository<Loan>,
    @InjectRepository(LoanProduct)
    private readonly loanProductRepository: Repository<LoanProduct>,
    private readonly tierBasedDecisioningService: TierBasedDecisioningService,
  ) {}

  /**
   * Make automated credit decision
   */
  async makeDecision(
    dto: CreditDecisionRequestDto,
    companyId: string,
  ): Promise<CreditDecisionResultDto> {
    const startTime = Date.now();
    this.logger.log(`Making credit decision for application ${dto.applicationId}`);

    // Get application
    const application = await this.applicationRepository.findOne({
      where: { id: dto.applicationId, companyId },
    });

    if (!application) {
      throw new Error(`Application ${dto.applicationId} not found`);
    }

    // Get loan product if specified
    let loanProduct: LoanProduct | null = null;
    if (dto.loanProductId) {
      loanProduct = await this.loanProductRepository.findOne({
        where: { id: dto.loanProductId, companyId },
      });
    }

    // Get customer history
    const existingLoans = await this.loanRepository.find({
      where: {
        applicantId: dto.applicantId,
        applicantType: dto.applicantType as any,
        companyId,
      },
    });

    // Calculate factors
    const factors = this.calculateFactors(dto, existingLoans, loanProduct);
    const riskScore = this.calculateRiskScore(factors);
    const confidenceScore = this.calculateConfidenceScore(dto, factors);

    // Make decision
    const decision = this.makeDecisionBasedOnScores(
      riskScore,
      confidenceScore,
      factors,
      dto,
      loanProduct,
    );

    // Generate reasons
    const reasons = this.generateReasons(decision, factors, dto, loanProduct);

    // Generate recommendations
    const recommendations = this.generateRecommendations(decision, factors, dto);

    // Calculate approved terms if approved
    let approvedAmount: number | undefined;
    let approvedInterestRate: number | undefined;
    let approvedTenure: number | undefined;
    let conditions: string[] | undefined;

    if (decision === DecisionStatus.APPROVED || decision === DecisionStatus.CONDITIONAL) {
      approvedAmount = this.calculateApprovedAmount(dto, factors, loanProduct);
      approvedInterestRate = this.calculateApprovedRate(dto, factors, loanProduct);
      approvedTenure = dto.requestedAmount ? this.calculateApprovedTenure(dto, factors) : undefined;

      if (decision === DecisionStatus.CONDITIONAL) {
        conditions = this.generateConditions(factors, dto);
      }
    }

    const processingTime = Date.now() - startTime;

    return {
      decision,
      approvedAmount,
      approvedInterestRate,
      approvedTenure,
      confidenceScore,
      riskScore,
      factors: factors as {
        creditScore: number;
        debtToIncome: number;
        employmentStability: number;
        loanToIncome: number;
        collateral: number;
        history: number;
        [key: string]: number;
      },
      reasons,
      conditions,
      recommendations,
      processingTimeMs: processingTime,
    };
  }

  /**
   * Calculate decision factors
   */
  private calculateFactors(
    dto: CreditDecisionRequestDto,
    existingLoans: Loan[],
    loanProduct: LoanProduct | null,
  ): {
    creditScore: number;
    debtToIncome: number;
    employmentStability: number;
    loanToIncome: number;
    collateral: number;
    history: number;
    [key: string]: number;
  } {
    const factors: {
      creditScore: number;
      debtToIncome: number;
      employmentStability: number;
      loanToIncome: number;
      collateral: number;
      history: number;
      [key: string]: number;
    } = {
      creditScore: 50,
      debtToIncome: 50,
      employmentStability: 50,
      loanToIncome: 50,
      collateral: 0,
      history: 50,
    };

    // Credit Score Factor (0-100)
    if (dto.creditScore) {
      if (dto.creditScore >= 750) {
        factors.creditScore = 90;
      } else if (dto.creditScore >= 700) {
        factors.creditScore = 75;
      } else if (dto.creditScore >= 650) {
        factors.creditScore = 60;
      } else if (dto.creditScore >= 600) {
        factors.creditScore = 40;
      } else {
        factors.creditScore = 20;
      }
    } else {
      factors.creditScore = 50; // Neutral if not provided
    }

    // Debt-to-Income Ratio Factor (0-100)
    if (dto.monthlyIncome && dto.monthlyExpenses) {
      const dti = dto.monthlyExpenses / dto.monthlyIncome;
      if (dti <= 0.3) {
        factors.debtToIncome = 90;
      } else if (dti <= 0.4) {
        factors.debtToIncome = 70;
      } else if (dti <= 0.5) {
        factors.debtToIncome = 50;
      } else {
        factors.debtToIncome = 30;
      }
    } else {
      factors.debtToIncome = 50;
    }

    // Employment Stability Factor (0-100)
    if (dto.employmentDurationMonths) {
      if (dto.employmentDurationMonths >= 24) {
        factors.employmentStability = 90;
      } else if (dto.employmentDurationMonths >= 12) {
        factors.employmentStability = 70;
      } else if (dto.employmentDurationMonths >= 6) {
        factors.employmentStability = 50;
      } else {
        factors.employmentStability = 30;
      }
    } else {
      factors.employmentStability = 50;
    }

    // Loan-to-Income Ratio Factor (0-100)
    if (dto.monthlyIncome && dto.requestedAmount) {
      const annualIncome = dto.monthlyIncome * 12;
      const lti = dto.requestedAmount / annualIncome;
      if (lti <= 0.5) {
        factors.loanToIncome = 90;
      } else if (lti <= 1.0) {
        factors.loanToIncome = 70;
      } else if (lti <= 1.5) {
        factors.loanToIncome = 50;
      } else {
        factors.loanToIncome = 30;
      }
    } else {
      factors.loanToIncome = 50;
    }

    // Collateral Factor (0-100)
    if (dto.hasCollateral && dto.collateralValue && dto.requestedAmount) {
      const collateralRatio = dto.collateralValue / dto.requestedAmount;
      if (collateralRatio >= 1.2) {
        factors.collateral = 100;
      } else if (collateralRatio >= 1.0) {
        factors.collateral = 90;
      } else if (collateralRatio >= 0.8) {
        factors.collateral = 70;
      } else {
        factors.collateral = 50;
      }
    } else {
      factors.collateral = 0;
    }

    // History Factor (0-100)
    if (existingLoans.length === 0) {
      factors.history = 50; // No history = neutral
    } else {
      // Check repayment history
      const activeLoans = existingLoans.filter((loan) => loan.status === LoanStatus.ACTIVE);
      const npaLoans = existingLoans.filter((loan) => loan.isNpa);
      
      if (npaLoans.length > 0) {
        factors.history = 20; // Poor history
      } else if (activeLoans.length > 0) {
        factors.history = 70; // Good history
      } else {
        factors.history = 60; // Neutral
      }
    }

    // Product Eligibility Factor (0-100)
    if (loanProduct) {
      let productScore = 100;
      
      if (dto.requestedAmount) {
        if (loanProduct.minimumLoanAmount && dto.requestedAmount < loanProduct.minimumLoanAmount) {
          productScore -= 30;
        }
        if (loanProduct.maximumLoanAmount && dto.requestedAmount > loanProduct.maximumLoanAmount) {
          productScore -= 30;
        }
      }

      if (dto.creditScore && loanProduct.minimumCreditScore && dto.creditScore < loanProduct.minimumCreditScore) {
        productScore -= 40;
      }

      factors.productEligibility = Math.max(0, productScore);
    } else {
      factors.productEligibility = 50;
    }

    return factors;
  }

  /**
   * Calculate risk score (0-100, higher = riskier)
   */
  private calculateRiskScore(factors: Record<string, number>): number {
    // Weighted average of inverse factors (lower factor = higher risk)
    const weights = {
      creditScore: 0.25,
      debtToIncome: 0.20,
      employmentStability: 0.15,
      loanToIncome: 0.15,
      collateral: 0.10,
      history: 0.10,
      productEligibility: 0.05,
    };

    let riskScore = 0;
    for (const [factor, weight] of Object.entries(weights)) {
      const factorValue = factors[factor] || 50;
      riskScore += (100 - factorValue) * weight; // Inverse: lower factor = higher risk
    }

    return Math.round(riskScore);
  }

  /**
   * Calculate confidence score (0-100)
   */
  private calculateConfidenceScore(
    dto: CreditDecisionRequestDto,
    factors: Record<string, number>,
  ): number {
    let confidence = 50; // Base confidence

    // Increase confidence if we have key data
    if (dto.creditScore) confidence += 15;
    if (dto.monthlyIncome) confidence += 15;
    if (dto.monthlyExpenses) confidence += 10;
    if (dto.employmentDurationMonths) confidence += 10;

    return Math.min(100, confidence);
  }

  /**
   * Make decision based on scores
   */
  private makeDecisionBasedOnScores(
    riskScore: number,
    confidenceScore: number,
    factors: Record<string, number>,
    dto: CreditDecisionRequestDto,
    loanProduct: LoanProduct | null,
  ): DecisionStatus {
    // Low risk + high confidence = APPROVED
    if (riskScore <= 30 && confidenceScore >= 70) {
      return DecisionStatus.APPROVED;
    }

    // Medium risk + high confidence = CONDITIONAL
    if (riskScore <= 50 && confidenceScore >= 70) {
      return DecisionStatus.CONDITIONAL;
    }

    // High risk = REJECTED
    if (riskScore >= 70) {
      return DecisionStatus.REJECTED;
    }

    // Low confidence = REFERRED (needs manual review)
    if (confidenceScore < 60) {
      return DecisionStatus.REFERRED;
    }

    // Medium risk + medium confidence = CONDITIONAL
    if (riskScore <= 60) {
      return DecisionStatus.CONDITIONAL;
    }

    // Default to REFERRED for manual review
    return DecisionStatus.REFERRED;
  }

  /**
   * Calculate approved amount
   */
  private calculateApprovedAmount(
    dto: CreditDecisionRequestDto,
    factors: Record<string, number>,
    loanProduct: LoanProduct | null,
  ): number {
    let approvedAmount = dto.requestedAmount;

    // Reduce amount based on risk
    if (factors.creditScore < 60) {
      approvedAmount *= 0.8; // Reduce by 20%
    }

    // Cap by product limits
    if (loanProduct) {
      if (loanProduct.maximumLoanAmount && approvedAmount > loanProduct.maximumLoanAmount) {
        approvedAmount = loanProduct.maximumLoanAmount;
      }
      if (loanProduct.minimumLoanAmount && approvedAmount < loanProduct.minimumLoanAmount) {
        approvedAmount = loanProduct.minimumLoanAmount;
      }
    }

    // Cap by income (max 5x annual income)
    if (dto.monthlyIncome) {
      const maxByIncome = dto.monthlyIncome * 12 * 5;
      approvedAmount = Math.min(approvedAmount, maxByIncome);
    }

    return Math.round(approvedAmount);
  }

  /**
   * Calculate approved interest rate
   */
  private calculateApprovedRate(
    dto: CreditDecisionRequestDto,
    factors: Record<string, number>,
    loanProduct: LoanProduct | null,
  ): number {
    let baseRate = loanProduct ? Number(loanProduct.rateOfInterest) : 15;

    // Adjust rate based on risk
    if (factors.creditScore < 60) {
      baseRate += 2; // Increase by 2%
    } else if (factors.creditScore >= 80) {
      baseRate -= 1; // Decrease by 1%
    }

    if (factors.debtToIncome > 70) {
      baseRate -= 0.5; // Good DTI = lower rate
    } else if (factors.debtToIncome < 40) {
      baseRate += 1; // Poor DTI = higher rate
    }

    if (factors.collateral > 80) {
      baseRate -= 1.5; // Good collateral = lower rate
    }

    return Math.round(baseRate * 100) / 100;
  }

  /**
   * Calculate approved tenure
   */
  private calculateApprovedTenure(
    dto: CreditDecisionRequestDto,
    factors: Record<string, number>,
  ): number {
    // Default to 24 months, adjust based on risk
    let tenure = 24;

    if (factors.creditScore < 60) {
      tenure = 18; // Shorter tenure for higher risk
    } else if (factors.creditScore >= 80) {
      tenure = 36; // Longer tenure for lower risk
    }

    return tenure;
  }

  /**
   * Generate decision reasons
   */
  private generateReasons(
    decision: DecisionStatus,
    factors: Record<string, number>,
    dto: CreditDecisionRequestDto,
    loanProduct: LoanProduct | null,
  ): string[] {
    const reasons: string[] = [];

    if (decision === DecisionStatus.APPROVED) {
      reasons.push('Application meets all eligibility criteria');
      if (factors.creditScore >= 80) {
        reasons.push('Excellent credit score');
      }
      if (factors.debtToIncome >= 70) {
        reasons.push('Healthy debt-to-income ratio');
      }
      if (factors.collateral >= 80) {
        reasons.push('Strong collateral coverage');
      }
    } else if (decision === DecisionStatus.REJECTED) {
      reasons.push('Application does not meet minimum eligibility criteria');
      if (factors.creditScore < 40) {
        reasons.push('Credit score below minimum threshold');
      }
      if (factors.debtToIncome < 30) {
        reasons.push('Debt-to-income ratio too high');
      }
      if (factors.productEligibility < 50) {
        reasons.push('Does not meet product-specific requirements');
      }
    } else if (decision === DecisionStatus.CONDITIONAL) {
      reasons.push('Approved with conditions');
      if (factors.creditScore < 70) {
        reasons.push('Credit score requires additional documentation');
      }
      if (factors.collateral < 50) {
        reasons.push('Collateral or guarantor may be required');
      }
    } else {
      reasons.push('Requires manual review');
      reasons.push('Insufficient data for automated decision');
    }

    return reasons;
  }

  /**
   * Generate recommendations
   */
  private generateRecommendations(
    decision: DecisionStatus,
    factors: Record<string, number>,
    dto: CreditDecisionRequestDto,
  ): string[] {
    const recommendations: string[] = [];

    if (decision === DecisionStatus.REJECTED) {
      if (factors.creditScore < 50) {
        recommendations.push('Improve credit score by paying bills on time');
      }
      if (factors.debtToIncome < 40) {
        recommendations.push('Reduce existing debt to improve debt-to-income ratio');
      }
      recommendations.push('Reapply after improving your financial profile');
    } else if (decision === DecisionStatus.CONDITIONAL) {
      recommendations.push('Provide additional documentation as requested');
      if (factors.collateral < 50) {
        recommendations.push('Consider providing collateral for better terms');
      }
    }

    return recommendations;
  }

  /**
   * Generate conditions for conditional approval
   */
  private generateConditions(
    factors: Record<string, number>,
    dto: CreditDecisionRequestDto,
  ): string[] {
    const conditions: string[] = [];

    if (factors.creditScore < 70) {
      conditions.push('Provide additional income documentation');
    }
    if (factors.collateral < 50 && dto.requestedAmount > 50000) {
      conditions.push('Provide collateral or guarantor');
    }
    if (factors.employmentStability < 60) {
      conditions.push('Provide employment verification letter');
    }

    return conditions;
  }
}

