import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LoanProduct } from '../../loan-product/entities/loan-product.entity';
import { LoanApplication } from '../../loan-application/entities/loan-application.entity';
import { Loan } from '../../loan/entities/loan.entity';
import { CalculationService } from '../../calculation/calculation.service';
import { MatchProductsDto, ProductMatchResult } from '../dto/product-matching.dto';
import { LoanCalculatorService } from '../../loan-calculator/services/loan-calculator.service';

@Injectable()
export class SmartProductMatchingService {
  private readonly logger = new Logger(SmartProductMatchingService.name);

  constructor(
    @InjectRepository(LoanProduct)
    private readonly loanProductRepository: Repository<LoanProduct>,
    @InjectRepository(LoanApplication)
    private readonly applicationRepository: Repository<LoanApplication>,
    @InjectRepository(Loan)
    private readonly loanRepository: Repository<Loan>,
    private readonly calculationService: CalculationService,
    private readonly loanCalculator: LoanCalculatorService,
  ) {}

  /**
   * Match loan products to customer profile
   */
  async matchProducts(
    dto: MatchProductsDto,
    companyId: string,
  ): Promise<ProductMatchResult> {
    this.logger.log(`Matching products for applicant ${dto.applicantId}`);

    // Get all active products
    const products = await this.loanProductRepository.find({
      where: {
        companyId,
        disabled: false,
      },
    });

    if (products.length === 0) {
      return {
        matches: [],
        bestMatch: null as any,
        alternatives: [],
        recommendations: ['No loan products available'],
      };
    }

    // Get customer history
    const previousApplications = await this.applicationRepository.find({
      where: {
        applicantId: dto.applicantId,
        applicantType: dto.applicantType as any,
        companyId,
      },
      take: 5,
    });

    const previousLoans = await this.loanRepository.find({
      where: {
        applicantId: dto.applicantId,
        applicantType: dto.applicantType as any,
        companyId,
      },
      take: 5,
    });

    // Match each product
    const matches = [];

    for (const product of products) {
      const match = await this.evaluateProductMatch(
        product,
        dto,
        previousApplications,
        previousLoans,
      );

      if (match.eligibilityStatus !== 'NOT_ELIGIBLE' || match.matchScore >= 30) {
        matches.push(match);
      }
    }

    // Sort by match score (highest first)
    matches.sort((a, b) => b.matchScore - a.matchScore);

    // Identify best match
    const bestMatch = matches.length > 0
      ? {
          productId: matches[0].productId,
          productName: matches[0].productName,
          matchScore: matches[0].matchScore,
          reason: matches[0].matchReasons.join(', '),
        }
      : null;

    // Get alternatives (top 3 excluding best match)
    const alternatives = matches.slice(1, 4).map((match) => ({
      productId: match.productId,
      productName: match.productName,
      matchScore: match.matchScore,
      reason: match.matchReasons[0] || 'Good alternative option',
    }));

    // Generate recommendations
    const recommendations = this.generateRecommendations(matches, dto);

    return {
      matches,
      bestMatch: bestMatch as any,
      alternatives,
      recommendations,
    };
  }

  /**
   * Evaluate product match
   */
  private async evaluateProductMatch(
    product: LoanProduct,
    dto: MatchProductsDto,
    previousApplications: LoanApplication[],
    previousLoans: Loan[],
  ): Promise<any> {
    let matchScore = 0;
    const matchReasons: string[] = [];
    const benefits: string[] = [];
    const drawbacks: string[] = [];

    // Factor 1: Amount eligibility (30% weight)
    const amountMatch = this.evaluateAmountMatch(product, dto.requestedAmount);
    matchScore += amountMatch.score * 0.3;
    if (amountMatch.reason) {
      matchReasons.push(amountMatch.reason);
    }
    if (amountMatch.isEligible) {
      benefits.push(`Loan amount within product limits`);
    } else {
      drawbacks.push(`Requested amount ${amountMatch.reason}`);
    }

    // Factor 2: Interest rate competitiveness (25% weight)
    const rateMatch = this.evaluateRateMatch(product, dto.creditScore);
    matchScore += rateMatch.score * 0.25;
    if (rateMatch.reason) {
      matchReasons.push(rateMatch.reason);
    }
    if (rateMatch.isCompetitive) {
      benefits.push(`Competitive interest rate: ${product.rateOfInterest}%`);
    }

    // Factor 3: EMI affordability (20% weight)
    const emiMatch = await this.evaluateEMIAffordability(product, dto);
    matchScore += emiMatch.score * 0.2;
    if (emiMatch.reason) {
      matchReasons.push(emiMatch.reason);
    }
    if (emiMatch.isAffordable) {
      benefits.push(`EMI is affordable based on your income`);
    } else {
      drawbacks.push(`EMI may be too high for your income`);
    }

    // Factor 4: Product type match (15% weight)
    const typeMatch = this.evaluateProductTypeMatch(product, dto);
    matchScore += typeMatch.score * 0.15;
    if (typeMatch.reason) {
      matchReasons.push(typeMatch.reason);
    }

    // Factor 5: Customer history (10% weight)
    const historyMatch = this.evaluateHistoryMatch(product, previousApplications, previousLoans);
    matchScore += historyMatch.score * 0.1;
    if (historyMatch.reason) {
      matchReasons.push(historyMatch.reason);
    }

    // Calculate estimated EMI and costs
    const tenure = dto.preferredTenure || 24;
    const emi = this.calculationService.calculateEMI(
      dto.requestedAmount,
      Number(product.rateOfInterest),
      tenure,
      'Monthly',
    );

    const totalAmount = emi * tenure;
    const totalInterest = totalAmount - dto.requestedAmount;

    // Determine eligibility
    let eligibilityStatus: 'ELIGIBLE' | 'PARTIALLY_ELIGIBLE' | 'NOT_ELIGIBLE';
    let eligibilityScore = matchScore;

    if (matchScore >= 70 && amountMatch.isEligible && emiMatch.isAffordable) {
      eligibilityStatus = 'ELIGIBLE';
    } else if (matchScore >= 50) {
      eligibilityStatus = 'PARTIALLY_ELIGIBLE';
    } else {
      eligibilityStatus = 'NOT_ELIGIBLE';
    }

    // Recommend amount and tenure if needed
    let recommendedAmount: number | undefined;
    let recommendedTenure: number | undefined;

    if (!amountMatch.isEligible && product.maximumLoanAmount) {
      recommendedAmount = Math.min(dto.requestedAmount, product.maximumLoanAmount);
    }

    if (!emiMatch.isAffordable && dto.monthlyIncome) {
      // Calculate maximum affordable EMI (40% of income)
      const maxEMI = dto.monthlyIncome * 0.4;
      // Reverse calculate tenure
      recommendedTenure = this.calculateOptimalTenure(
        dto.requestedAmount,
        Number(product.rateOfInterest),
        maxEMI,
      );
    }

    return {
      productId: product.id,
      productName: product.productName,
      matchScore: Math.round(matchScore),
      matchReasons,
      estimatedEMI: Math.round(emi * 100) / 100,
      estimatedTotalCost: Math.round(totalAmount * 100) / 100,
      estimatedInterest: Math.round(totalInterest * 100) / 100,
      eligibilityStatus,
      eligibilityScore: Math.round(eligibilityScore),
      recommendedAmount,
      recommendedTenure,
      benefits,
      drawbacks,
    };
  }

  /**
   * Evaluate amount match
   */
  private evaluateAmountMatch(
    product: LoanProduct,
    requestedAmount: number,
  ): { score: number; reason: string; isEligible: boolean } {
    if (product.maximumLoanAmount && requestedAmount > product.maximumLoanAmount) {
      return {
        score: 0,
        reason: `exceeds maximum loan amount (${product.maximumLoanAmount})`,
        isEligible: false,
      };
    }

    if (product.minimumLoanAmount && requestedAmount < product.minimumLoanAmount) {
      return {
        score: 50,
        reason: `below minimum loan amount (${product.minimumLoanAmount})`,
        isEligible: false,
      };
    }

    // Score based on how close to maximum (closer to max = higher score)
    if (product.maximumLoanAmount) {
      const ratio = requestedAmount / product.maximumLoanAmount;
      const score = ratio >= 0.8 ? 100 : ratio >= 0.5 ? 80 : 60;
      return {
        score,
        reason: 'Amount within product limits',
        isEligible: true,
      };
    }

    return { score: 100, reason: 'Amount eligible', isEligible: true };
  }

  /**
   * Evaluate rate match
   */
  private evaluateRateMatch(
    product: LoanProduct,
    creditScore?: number,
  ): { score: number; reason: string; isCompetitive: boolean } {
    const rate = Number(product.rateOfInterest);

    if (!creditScore) {
      return { score: 50, reason: 'Rate information available', isCompetitive: true };
    }

    // Score based on credit score vs rate
    if (creditScore >= 750 && rate <= 12) {
      return { score: 100, reason: 'Excellent rate for your credit score', isCompetitive: true };
    } else if (creditScore >= 700 && rate <= 15) {
      return { score: 80, reason: 'Good rate for your credit score', isCompetitive: true };
    } else if (creditScore >= 650 && rate <= 18) {
      return { score: 60, reason: 'Reasonable rate', isCompetitive: true };
    } else {
      return { score: 40, reason: 'Rate may be high for your profile', isCompetitive: false };
    }
  }

  /**
   * Evaluate EMI affordability
   */
  private async evaluateEMIAffordability(
    product: LoanProduct,
    dto: MatchProductsDto,
  ): Promise<{ score: number; reason: string; isAffordable: boolean }> {
    if (!dto.monthlyIncome) {
      return { score: 50, reason: 'Income not provided', isAffordable: true };
    }

    const tenure = dto.preferredTenure || 24;
    const emi = this.calculationService.calculateEMI(
      dto.requestedAmount,
      Number(product.rateOfInterest),
      tenure,
      'Monthly',
    );

    // EMI should be <= 40% of monthly income
    const maxAffordableEMI = dto.monthlyIncome * 0.4;
    const emiRatio = emi / dto.monthlyIncome;

    if (emi <= maxAffordableEMI) {
      return {
        score: 100,
        reason: `EMI (${emi.toFixed(2)}) is affordable (${(emiRatio * 100).toFixed(1)}% of income)`,
        isAffordable: true,
      };
    } else if (emi <= dto.monthlyIncome * 0.5) {
      return {
        score: 60,
        reason: `EMI (${emi.toFixed(2)}) is moderately affordable (${(emiRatio * 100).toFixed(1)}% of income)`,
        isAffordable: false,
      };
    } else {
      return {
        score: 20,
        reason: `EMI (${emi.toFixed(2)}) may be too high (${(emiRatio * 100).toFixed(1)}% of income)`,
        isAffordable: false,
      };
    }
  }

  /**
   * Evaluate product type match
   */
  private evaluateProductTypeMatch(
    product: LoanProduct,
    dto: MatchProductsDto,
  ): { score: number; reason: string } {
    // Check if product type matches loan purpose
    if (dto.loanPurpose) {
      const purpose = dto.loanPurpose.toLowerCase();
      const productName = product.productName.toLowerCase();

      if (
        (purpose.includes('business') && productName.includes('business')) ||
        (purpose.includes('personal') && productName.includes('personal')) ||
        (purpose.includes('home') && productName.includes('home'))
      ) {
        return { score: 100, reason: 'Product type matches loan purpose' };
      }
    }

    // Check collateral requirement - LoanProduct doesn't have isSecuredLoan field
    // This would need to be checked from loan security or product configuration
    // if (product.isSecuredLoan && !dto.hasCollateral) {
    //   return { score: 30, reason: 'Product requires collateral' };
    // }

    return { score: 70, reason: 'Product type is suitable' };
  }

  /**
   * Evaluate history match
   */
  private evaluateHistoryMatch(
    product: LoanProduct,
    previousApplications: LoanApplication[],
    previousLoans: Loan[],
  ): { score: number; reason: string } {
    // Check if customer has used this product before
    const usedProduct = previousLoans.some((loan) => loan.loanProductId === product.id);
    if (usedProduct) {
      return { score: 100, reason: 'You have used this product before' };
    }

    const appliedProduct = previousApplications.some((app) => app.loanProductId === product.id);
    if (appliedProduct) {
      return { score: 80, reason: 'You have applied for this product before' };
    }

    return { score: 50, reason: 'New product for you' };
  }

  /**
   * Calculate optimal tenure
   */
  private calculateOptimalTenure(
    amount: number,
    rate: number,
    maxEMI: number,
  ): number {
    // Reverse calculate tenure from EMI
    const monthlyRate = rate / 12 / 100;
    if (monthlyRate === 0) {
      return Math.ceil(amount / maxEMI);
    }

    // EMI = P * r * (1+r)^n / ((1+r)^n - 1)
    // Solve for n
    const ratio = (amount * monthlyRate) / maxEMI;
    if (ratio >= 1) {
      return 1; // Minimum 1 month
    }

    const tenure = Math.log(1 + ratio) / Math.log(1 + monthlyRate);
    return Math.ceil(tenure);
  }

  /**
   * Generate recommendations
   */
  private generateRecommendations(matches: any[], dto: MatchProductsDto): string[] {
    const recommendations: string[] = [];

    if (matches.length === 0) {
      recommendations.push('No products match your profile. Consider improving your credit score or reducing loan amount.');
      return recommendations;
    }

    const bestMatch = matches[0];
    if (bestMatch.eligibilityStatus === 'ELIGIBLE') {
      recommendations.push(`Best match: ${bestMatch.productName} with ${bestMatch.matchScore}% match score`);
    } else {
      recommendations.push(`Consider ${bestMatch.productName} but may need adjustments`);
    }

    if (bestMatch.recommendedAmount && bestMatch.recommendedAmount < dto.requestedAmount) {
      recommendations.push(`Consider reducing loan amount to ${bestMatch.recommendedAmount} for better eligibility`);
    }

    if (bestMatch.recommendedTenure && bestMatch.recommendedTenure > (dto.preferredTenure || 24)) {
      recommendations.push(`Consider longer tenure (${bestMatch.recommendedTenure} months) for more affordable EMI`);
    }

    if (matches.length > 1) {
      recommendations.push(`Compare ${matches.length} matched products to find the best option`);
    }

    return recommendations;
  }
}

