import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LoanProduct } from '../../loan-product/entities/loan-product.entity';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

/**
 * AI Product Recommendation Service
 * 
 * Uses AI to recommend the best loan products for customers based on their profile,
 * needs, and eligibility criteria.
 */

export interface CustomerProfile {
  age?: number;
  monthlyIncome?: number;
  annualIncome?: number;
  employmentType?: string;
  employmentDuration?: number; // months
  creditScore?: number;
  requestedAmount?: number;
  preferredTerm?: number; // months
  useCase?: string;
  country?: string;
  region?: string;
  hasCollateral?: boolean;
  existingLoans?: number;
  debtToIncomeRatio?: number;
}

export interface ProductRecommendation {
  product: LoanProduct;
  matchScore: number; // 0-1, higher is better
  reasons: string[];
  estimatedApproval: number; // 0-1 probability
  estimatedAmount?: number;
  estimatedRate?: number;
  estimatedMonthlyPayment?: number;
  eligibilityStatus: 'ELIGIBLE' | 'PARTIALLY_ELIGIBLE' | 'NOT_ELIGIBLE';
  missingRequirements?: string[];
}

export interface RecommendProductsDto {
  customerProfile: CustomerProfile;
  companyId: string;
  limit?: number; // Max number of recommendations
  includeNotEligible?: boolean; // Include products customer doesn't qualify for
}

@Injectable()
export class AIProductRecommendationService {
  private readonly logger = new Logger(AIProductRecommendationService.name);
  private readonly aiProvider: string;
  private readonly openaiApiKey?: string;
  private readonly useAIAssistance: boolean;

  constructor(
    @InjectRepository(LoanProduct)
    private readonly loanProductRepository: Repository<LoanProduct>,
    private readonly configService: ConfigService,
  ) {
    this.aiProvider = this.configService.get('AI_PROVIDER') || 'openai';
    this.openaiApiKey = this.configService.get('OPENAI_API_KEY');
    this.useAIAssistance = !!this.openaiApiKey;
  }

  /**
   * Recommend loan products for a customer
   */
  async recommendProducts(dto: RecommendProductsDto): Promise<ProductRecommendation[]> {
    this.logger.log(`Recommending products for customer profile: ${JSON.stringify(dto.customerProfile)}`);

    // Get all active products for the company
    const products = await this.loanProductRepository.find({
      where: {
        companyId: dto.companyId,
        disabled: false,
      },
    });

    if (products.length === 0) {
      this.logger.warn(`No active products found for company ${dto.companyId}`);
      return [];
    }

    // Evaluate each product
    const recommendations: ProductRecommendation[] = [];

    for (const product of products) {
      const recommendation = await this.evaluateProduct(product, dto.customerProfile);
      
      if (recommendation.eligibilityStatus !== 'NOT_ELIGIBLE' || dto.includeNotEligible) {
        recommendations.push(recommendation);
      }
    }

    // Sort by match score (highest first)
    recommendations.sort((a, b) => b.matchScore - a.matchScore);

    // Limit results
    const limit = dto.limit || 5;
    return recommendations.slice(0, limit);
  }

  /**
   * Evaluate a single product against customer profile
   */
  private async evaluateProduct(
    product: LoanProduct,
    profile: CustomerProfile,
  ): Promise<ProductRecommendation> {
    // Calculate eligibility score
    const eligibilityScore = this.calculateEligibilityScore(product, profile);
    
    // Calculate match score (combination of eligibility and fit)
    const matchScore = this.calculateMatchScore(product, profile, eligibilityScore);

    // Determine eligibility status
    const eligibilityStatus = this.determineEligibilityStatus(eligibilityScore);

    // Generate reasons using AI or rule-based
    const reasons = await this.generateRecommendationReasons(product, profile, matchScore);

    // Calculate estimates
    const estimates = this.calculateEstimates(product, profile);

    // Identify missing requirements
    const missingRequirements = this.identifyMissingRequirements(product, profile);

    return {
      product,
      matchScore,
      reasons,
      estimatedApproval: eligibilityScore,
      estimatedAmount: estimates.amount,
      estimatedRate: estimates.rate,
      estimatedMonthlyPayment: estimates.monthlyPayment,
      eligibilityStatus,
      missingRequirements,
    };
  }

  /**
   * Calculate eligibility score (0-1)
   */
  private calculateEligibilityScore(product: LoanProduct, profile: CustomerProfile): number {
    let score = 0;
    let factors = 0;

    // Age check
    if (product.minimumAge || product.maximumAge) {
      factors++;
      if (profile.age) {
        const ageMatch = (!product.minimumAge || profile.age >= product.minimumAge) &&
                        (!product.maximumAge || profile.age <= product.maximumAge);
        if (ageMatch) score += 1;
      }
    }

    // Income check
    if (product.minimumMonthlyIncome) {
      factors++;
      if (profile.monthlyIncome && profile.monthlyIncome >= product.minimumMonthlyIncome) {
        score += 1;
      } else if (profile.monthlyIncome) {
        // Partial credit if close
        const ratio = profile.monthlyIncome / product.minimumMonthlyIncome;
        score += Math.max(0, ratio * 0.7); // Up to 70% credit if close
      }
    }

    // Credit score check
    if (product.minimumCreditScore) {
      factors++;
      if (profile.creditScore && profile.creditScore >= product.minimumCreditScore) {
        score += 1;
      } else if (profile.creditScore) {
        const ratio = profile.creditScore / product.minimumCreditScore;
        score += Math.max(0, ratio * 0.5); // Up to 50% credit if close
      }
    }

    // Employment type check
    if (product.employmentTypes && product.employmentTypes.length > 0) {
      factors++;
      if (profile.employmentType && product.employmentTypes.includes(profile.employmentType)) {
        score += 1;
      }
    }

    // Employment duration check
    if (product.minimumEmploymentDuration) {
      factors++;
      if (profile.employmentDuration && profile.employmentDuration >= product.minimumEmploymentDuration) {
        score += 1;
      } else if (profile.employmentDuration) {
        const ratio = profile.employmentDuration / product.minimumEmploymentDuration;
        score += Math.max(0, ratio * 0.6);
      }
    }

    // Collateral check
    if (product.requiresCollateral) {
      factors++;
      if (profile.hasCollateral) {
        score += 1;
      }
    }

    // Amount range check
    if (product.minimumLoanAmount || product.maximumLoanAmount) {
      factors++;
      if (profile.requestedAmount) {
        const withinRange = (!product.minimumLoanAmount || profile.requestedAmount >= product.minimumLoanAmount) &&
                           (!product.maximumLoanAmount || profile.requestedAmount <= product.maximumLoanAmount);
        if (withinRange) score += 1;
      }
    }

    // Term range check
    if (product.minimumTerm || product.maximumTerm) {
      factors++;
      if (profile.preferredTerm) {
        const withinRange = (!product.minimumTerm || profile.preferredTerm >= product.minimumTerm) &&
                           (!product.maximumTerm || profile.preferredTerm <= product.maximumTerm);
        if (withinRange) score += 1;
      }
    }

    // Use case match
    if (product.useCases && product.useCases.length > 0 && profile.useCase) {
      factors++;
      if (product.useCases.includes(profile.useCase)) {
        score += 1.2; // Bonus for use case match
      }
    }

    return factors > 0 ? Math.min(1, score / factors) : 0.5; // Default to 0.5 if no factors
  }

  /**
   * Calculate overall match score
   */
  private calculateMatchScore(
    product: LoanProduct,
    profile: CustomerProfile,
    eligibilityScore: number,
  ): number {
    let matchScore = eligibilityScore * 0.6; // 60% weight on eligibility

    // Use case match bonus
    if (product.useCases && profile.useCase && product.useCases.includes(profile.useCase)) {
      matchScore += 0.2;
    }

    // Amount fit (prefer products where requested amount is in middle of range)
    if (profile.requestedAmount && product.minimumLoanAmount && product.maximumLoanAmount) {
      const range = product.maximumLoanAmount - product.minimumLoanAmount;
      const position = (profile.requestedAmount - product.minimumLoanAmount) / range;
      // Prefer middle of range (0.3 to 0.7)
      if (position >= 0.3 && position <= 0.7) {
        matchScore += 0.1;
      }
    }

    // Interest rate preference (lower is better, but consider risk)
    if (product.rateOfInterest) {
      // Normalize: lower rates get slight bonus
      const rateScore = Math.max(0, 1 - (product.rateOfInterest / 5)); // Assuming max 5% per month
      matchScore += rateScore * 0.1;
    }

    return Math.min(1, matchScore);
  }

  /**
   * Determine eligibility status
   */
  private determineEligibilityStatus(score: number): 'ELIGIBLE' | 'PARTIALLY_ELIGIBLE' | 'NOT_ELIGIBLE' {
    if (score >= 0.8) return 'ELIGIBLE';
    if (score >= 0.5) return 'PARTIALLY_ELIGIBLE';
    return 'NOT_ELIGIBLE';
  }

  /**
   * Generate recommendation reasons
   */
  private async generateRecommendationReasons(
    product: LoanProduct,
    profile: CustomerProfile,
    matchScore: number,
  ): Promise<string[]> {
    const reasons: string[] = [];

    // Rule-based reasons
    if (matchScore >= 0.8) {
      reasons.push('Excellent match for your profile');
    } else if (matchScore >= 0.6) {
      reasons.push('Good match for your needs');
    }

    // Eligibility reasons
    if (profile.age && product.minimumAge && profile.age >= product.minimumAge) {
      reasons.push('Meets age requirements');
    }

    if (profile.monthlyIncome && product.minimumMonthlyIncome && 
        profile.monthlyIncome >= product.minimumMonthlyIncome) {
      reasons.push('Meets income requirements');
    }

    if (profile.creditScore && product.minimumCreditScore && 
        profile.creditScore >= product.minimumCreditScore) {
      reasons.push('Meets credit score requirements');
    }

    // Use case match
    if (profile.useCase && product.useCases && product.useCases.includes(profile.useCase)) {
      reasons.push(`Perfect for ${profile.useCase}`);
    }

    // Product highlights
    if (product.productHighlights && product.productHighlights.length > 0) {
      reasons.push(product.productHighlights[0]); // Add first highlight
    }

    // AI-generated reasons (if available)
    if (this.useAIAssistance) {
      try {
        const aiReasons = await this.generateAIReasons(product, profile, matchScore);
        reasons.push(...aiReasons);
      } catch (error) {
        this.logger.warn('Failed to generate AI reasons, using rule-based only', error);
      }
    }

    return reasons.length > 0 ? reasons : ['Product available for your profile'];
  }

  /**
   * Generate AI-powered reasons
   */
  private async generateAIReasons(
    product: LoanProduct,
    profile: CustomerProfile,
    matchScore: number,
  ): Promise<string[]> {
    if (!this.openaiApiKey) return [];

    try {
      const prompt = `You are a loan product recommendation assistant. 
Given this loan product and customer profile, provide 2-3 concise reasons why this product is a good match.

Product: ${product.productName}
Category: ${product.loanCategory}
Interest Rate: ${product.rateOfInterest}% per month
Loan Amount Range: $${product.minimumLoanAmount || 0} - $${product.maximumLoanAmount || 'unlimited'}

Customer Profile:
- Age: ${profile.age || 'Not provided'}
- Monthly Income: $${profile.monthlyIncome || 'Not provided'}
- Employment: ${profile.employmentType || 'Not provided'}
- Credit Score: ${profile.creditScore || 'Not provided'}
- Use Case: ${profile.useCase || 'Not provided'}
- Requested Amount: $${profile.requestedAmount || 'Not provided'}

Match Score: ${(matchScore * 100).toFixed(0)}%

Provide 2-3 concise reasons (one sentence each) why this product is recommended. Return as JSON array of strings.`;

      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: 'gpt-4',
          messages: [
            {
              role: 'system',
              content: 'You are a helpful loan product recommendation assistant. Always return valid JSON only.',
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
          response_format: { type: 'json_object' },
          temperature: 0.7,
          max_tokens: 200,
        },
        {
          headers: {
            Authorization: `Bearer ${this.openaiApiKey}`,
            'Content-Type': 'application/json',
          },
        },
      );

      const result = JSON.parse(response.data.choices[0].message.content);
      return result.reasons || [];
    } catch (error) {
      this.logger.error('Error generating AI reasons:', error);
      return [];
    }
  }

  /**
   * Calculate estimates
   */
  private calculateEstimates(product: LoanProduct, profile: CustomerProfile) {
    const amount = profile.requestedAmount || product.minimumLoanAmount || 0;
    const rate = product.rateOfInterest || 0;
    const term = profile.preferredTerm || product.minimumTerm || 12;

    // Simple monthly payment calculation (principal + interest)
    const monthlyInterest = (amount * rate / 100);
    const monthlyPrincipal = amount / term;
    const monthlyPayment = monthlyInterest + monthlyPrincipal;

    return {
      amount,
      rate,
      monthlyPayment: Math.round(monthlyPayment * 100) / 100,
    };
  }

  /**
   * Identify missing requirements
   */
  private identifyMissingRequirements(
    product: LoanProduct,
    profile: CustomerProfile,
  ): string[] {
    const missing: string[] = [];

    if (product.minimumAge && (!profile.age || profile.age < product.minimumAge)) {
      missing.push(`Minimum age: ${product.minimumAge} years`);
    }

    if (product.minimumMonthlyIncome && 
        (!profile.monthlyIncome || profile.monthlyIncome < product.minimumMonthlyIncome)) {
      missing.push(`Minimum monthly income: $${product.minimumMonthlyIncome}`);
    }

    if (product.minimumCreditScore && 
        (!profile.creditScore || profile.creditScore < product.minimumCreditScore)) {
      missing.push(`Minimum credit score: ${product.minimumCreditScore}`);
    }

    if (product.requiresCollateral && !profile.hasCollateral) {
      missing.push('Collateral required');
    }

    if (product.requiresCoApplicant) {
      missing.push('Co-applicant required');
    }

    if (product.requiresGuarantor) {
      missing.push('Guarantor required');
    }

    return missing;
  }
}

