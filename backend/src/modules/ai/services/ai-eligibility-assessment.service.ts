import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LoanProduct } from '../../loan-product/entities/loan-product.entity';
import { CustomerProfileDto } from '../dto/product-recommendation.dto';

/**
 * AI Eligibility Assessment Service
 * 
 * Assesses customer eligibility for specific loan products based on
 * eligibility criteria and customer profile.
 */

export interface EligibilityCheckResult {
  isEligible: boolean;
  eligibilityScore: number; // 0-1
  passedCriteria: string[];
  failedCriteria: string[];
  warnings: string[];
  suggestions: string[];
  missingRequirements: string[];
  estimatedApproval: number; // 0-1 probability
}

export interface CheckEligibilityDto {
  productId: string;
  customerProfile: CustomerProfileDto;
}

@Injectable()
export class AIEligibilityAssessmentService {
  private readonly logger = new Logger(AIEligibilityAssessmentService.name);

  constructor(
    @InjectRepository(LoanProduct)
    private readonly loanProductRepository: Repository<LoanProduct>,
  ) {}

  /**
   * Check eligibility for a specific product
   */
  async checkEligibility(dto: CheckEligibilityDto): Promise<EligibilityCheckResult> {
    this.logger.log(`Checking eligibility for product ${dto.productId}`);

    const product = await this.loanProductRepository.findOne({
      where: { id: dto.productId },
    });

    if (!product) {
      throw new NotFoundException(`Product with ID ${dto.productId} not found`);
    }

    return this.assessEligibility(product, dto.customerProfile);
  }

  /**
   * Check eligibility by product code
   */
  async checkEligibilityByCode(productCode: string, customerProfile: CustomerProfileDto): Promise<EligibilityCheckResult> {
    const product = await this.loanProductRepository.findOne({
      where: { productCode },
    });

    if (!product) {
      throw new NotFoundException(`Product with code ${productCode} not found`);
    }

    return this.assessEligibility(product, customerProfile);
  }

  /**
   * Assess eligibility against product criteria
   */
  private assessEligibility(product: LoanProduct, profile: CustomerProfileDto): EligibilityCheckResult {
    const passedCriteria: string[] = [];
    const failedCriteria: string[] = [];
    const warnings: string[] = [];
    const suggestions: string[] = [];
    const missingRequirements: string[] = [];

    let score = 0;
    let totalCriteria = 0;

    // Age check
    if (product.minimumAge || product.maximumAge) {
      totalCriteria++;
      if (profile.age) {
        const agePass = (!product.minimumAge || profile.age >= product.minimumAge) &&
                        (!product.maximumAge || profile.age <= product.maximumAge);
        if (agePass) {
          passedCriteria.push('Age requirement');
          score += 1;
        } else {
          failedCriteria.push(`Age requirement (${product.minimumAge || 'N/A'}-${product.maximumAge || 'N/A'} years)`);
          if (product.minimumAge && profile.age < product.minimumAge) {
            missingRequirements.push(`Minimum age: ${product.minimumAge} years (current: ${profile.age})`);
          }
          if (product.maximumAge && profile.age > product.maximumAge) {
            missingRequirements.push(`Maximum age: ${product.maximumAge} years (current: ${profile.age})`);
          }
        }
      } else {
        warnings.push('Age not provided - cannot verify age requirement');
      }
    }

    // Monthly income check
    if (product.minimumMonthlyIncome) {
      totalCriteria++;
      if (profile.monthlyIncome) {
        if (profile.monthlyIncome >= product.minimumMonthlyIncome) {
          passedCriteria.push('Monthly income requirement');
          score += 1;
        } else {
          failedCriteria.push(`Monthly income requirement (minimum: $${product.minimumMonthlyIncome})`);
          missingRequirements.push(`Minimum monthly income: $${product.minimumMonthlyIncome} (current: $${profile.monthlyIncome})`);
          suggestions.push(`Increase income or consider products with lower income requirements`);
        }
      } else if (profile.annualIncome) {
        // Convert annual to monthly
        const monthlyIncome = profile.annualIncome / 12;
        if (monthlyIncome >= product.minimumMonthlyIncome) {
          passedCriteria.push('Monthly income requirement (calculated from annual)');
          score += 1;
        } else {
          failedCriteria.push(`Monthly income requirement (minimum: $${product.minimumMonthlyIncome})`);
          missingRequirements.push(`Minimum monthly income: $${product.minimumMonthlyIncome} (calculated: $${monthlyIncome.toFixed(2)})`);
        }
      } else {
        warnings.push('Income not provided - cannot verify income requirement');
      }
    }

    // Credit score check
    if (product.minimumCreditScore) {
      totalCriteria++;
      if (profile.creditScore) {
        if (profile.creditScore >= product.minimumCreditScore) {
          passedCriteria.push('Credit score requirement');
          score += 1;
          if (profile.creditScore === product.minimumCreditScore) {
            warnings.push('Credit score is at minimum threshold - consider improving for better rates');
          }
        } else {
          failedCriteria.push(`Credit score requirement (minimum: ${product.minimumCreditScore})`);
          missingRequirements.push(`Minimum credit score: ${product.minimumCreditScore} (current: ${profile.creditScore})`);
          suggestions.push(`Improve credit score by ${product.minimumCreditScore - profile.creditScore} points to qualify`);
        }
      } else {
        warnings.push('Credit score not provided - cannot verify credit requirement');
      }
    }

    // Employment type check
    if (product.employmentTypes && product.employmentTypes.length > 0) {
      totalCriteria++;
      if (profile.employmentType) {
        if (product.employmentTypes.includes(profile.employmentType)) {
          passedCriteria.push('Employment type requirement');
          score += 1;
        } else {
          failedCriteria.push(`Employment type requirement (accepted: ${product.employmentTypes.join(', ')})`);
          missingRequirements.push(`Employment type must be one of: ${product.employmentTypes.join(', ')}`);
          suggestions.push(`Consider products that accept ${profile.employmentType} employment`);
        }
      } else {
        warnings.push('Employment type not provided - cannot verify employment requirement');
      }
    }

    // Employment duration check
    if (product.minimumEmploymentDuration) {
      totalCriteria++;
      if (profile.employmentDuration) {
        if (profile.employmentDuration >= product.minimumEmploymentDuration) {
          passedCriteria.push('Employment duration requirement');
          score += 1;
        } else {
          failedCriteria.push(`Employment duration requirement (minimum: ${product.minimumEmploymentDuration} months)`);
          missingRequirements.push(`Minimum employment duration: ${product.minimumEmploymentDuration} months (current: ${profile.employmentDuration})`);
          suggestions.push(`Wait ${product.minimumEmploymentDuration - profile.employmentDuration} more months to qualify`);
        }
      } else {
        warnings.push('Employment duration not provided - cannot verify employment duration requirement');
      }
    }

    // Collateral check
    if (product.requiresCollateral) {
      totalCriteria++;
      if (profile.hasCollateral) {
        passedCriteria.push('Collateral requirement');
        score += 1;
      } else {
        failedCriteria.push('Collateral required');
        missingRequirements.push('Collateral required for this product');
        suggestions.push('Provide collateral or consider unsecured loan products');
      }
    }

    // Co-applicant check
    if (product.requiresCoApplicant) {
      totalCriteria++;
      missingRequirements.push('Co-applicant required');
      suggestions.push('Add a co-applicant to qualify for this product');
    }

    // Guarantor check
    if (product.requiresGuarantor) {
      totalCriteria++;
      missingRequirements.push('Guarantor required');
      suggestions.push('Provide a guarantor to qualify for this product');
    }

    // Loan amount check
    if (product.minimumLoanAmount || product.maximumLoanAmount) {
      totalCriteria++;
      if (profile.requestedAmount) {
        const amountPass = (!product.minimumLoanAmount || profile.requestedAmount >= product.minimumLoanAmount) &&
                          (!product.maximumLoanAmount || profile.requestedAmount <= product.maximumLoanAmount);
        if (amountPass) {
          passedCriteria.push('Loan amount range');
          score += 1;
        } else {
          if (product.minimumLoanAmount && profile.requestedAmount < product.minimumLoanAmount) {
            failedCriteria.push(`Loan amount too low (minimum: $${product.minimumLoanAmount})`);
            missingRequirements.push(`Minimum loan amount: $${product.minimumLoanAmount} (requested: $${profile.requestedAmount})`);
          }
          if (product.maximumLoanAmount && profile.requestedAmount > product.maximumLoanAmount) {
            failedCriteria.push(`Loan amount too high (maximum: $${product.maximumLoanAmount})`);
            missingRequirements.push(`Maximum loan amount: $${product.maximumLoanAmount} (requested: $${profile.requestedAmount})`);
          }
        }
      } else {
        warnings.push('Requested amount not provided - cannot verify amount requirement');
      }
    }

    // Term check
    if (product.minimumTerm || product.maximumTerm) {
      totalCriteria++;
      if (profile.preferredTerm) {
        const termPass = (!product.minimumTerm || profile.preferredTerm >= product.minimumTerm) &&
                        (!product.maximumTerm || profile.preferredTerm <= product.maximumTerm);
        if (termPass) {
          passedCriteria.push('Loan term range');
          score += 1;
        } else {
          if (product.minimumTerm && profile.preferredTerm < product.minimumTerm) {
            failedCriteria.push(`Loan term too short (minimum: ${product.minimumTerm} months)`);
            missingRequirements.push(`Minimum term: ${product.minimumTerm} months (preferred: ${profile.preferredTerm})`);
          }
          if (product.maximumTerm && profile.preferredTerm > product.maximumTerm) {
            failedCriteria.push(`Loan term too long (maximum: ${product.maximumTerm} months)`);
            missingRequirements.push(`Maximum term: ${product.maximumTerm} months (preferred: ${profile.preferredTerm})`);
          }
        }
      }
    }

    // Debt-to-income ratio check
    if (product.maximumDebtToIncomeRatio) {
      totalCriteria++;
      if (profile.debtToIncomeRatio) {
        if (profile.debtToIncomeRatio <= product.maximumDebtToIncomeRatio) {
          passedCriteria.push('Debt-to-income ratio');
          score += 1;
        } else {
          failedCriteria.push(`Debt-to-income ratio too high (maximum: ${product.maximumDebtToIncomeRatio}%)`);
          missingRequirements.push(`Maximum debt-to-income ratio: ${product.maximumDebtToIncomeRatio}% (current: ${profile.debtToIncomeRatio}%)`);
          suggestions.push('Reduce existing debt to improve debt-to-income ratio');
        }
      }
    }

    // Use case match (bonus, not required)
    if (product.useCases && product.useCases.length > 0 && profile.useCase) {
      if (product.useCases.includes(profile.useCase)) {
        passedCriteria.push('Use case match');
        score += 0.5; // Bonus, not full point
      }
    }

    // Calculate final eligibility score
    const eligibilityScore = totalCriteria > 0 ? score / totalCriteria : 0;
    const isEligible = eligibilityScore >= 0.8 && failedCriteria.length === 0;

    // Estimate approval probability
    const estimatedApproval = this.estimateApprovalProbability(eligibilityScore, warnings.length, failedCriteria.length);

    return {
      isEligible,
      eligibilityScore,
      passedCriteria,
      failedCriteria,
      warnings,
      suggestions,
      missingRequirements,
      estimatedApproval,
    };
  }

  /**
   * Estimate approval probability based on eligibility score
   */
  private estimateApprovalProbability(
    eligibilityScore: number,
    warningCount: number,
    failedCriteriaCount: number,
  ): number {
    let probability = eligibilityScore;

    // Reduce probability for warnings
    probability -= warningCount * 0.05;

    // Reduce probability for failed criteria
    probability -= failedCriteriaCount * 0.1;

    // Ensure probability is between 0 and 1
    return Math.max(0, Math.min(1, probability));
  }
}

