import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PreQualification } from './entities/pre-qualification.entity';
import { PreQualificationCheckDto, PreQualificationResultDto } from './dto/pre-qualification-check.dto';
import { LoanProduct } from '../loan-product/entities/loan-product.entity';
import { randomUUID } from 'crypto';

@Injectable()
export class PreQualificationService {
  private readonly logger = new Logger(PreQualificationService.name);

  constructor(
    @InjectRepository(PreQualification)
    private readonly preQualificationRepository: Repository<PreQualification>,
    @InjectRepository(LoanProduct)
    private readonly loanProductRepository: Repository<LoanProduct>,
  ) {}

  /**
   * Perform pre-qualification check
   */
  async checkPreQualification(
    dto: PreQualificationCheckDto,
  ): Promise<PreQualificationResultDto> {
    this.logger.log(`Pre-qualification check for amount: ${dto.requestedAmount}`);

    // Generate unique token
    const token = `pq-${randomUUID()}`;

    // Calculate qualification score (0-100)
    const qualificationScore = this.calculateQualificationScore(dto);

    // Determine if qualified (score >= 60)
    const isQualified = qualificationScore >= 60;

    // Get loan products
    let loanProduct: LoanProduct | null = null;
    if (dto.loanProductId) {
      loanProduct = await this.loanProductRepository.findOne({
        where: { id: dto.loanProductId },
      });
    }

    // If no specific product, get best matching product
    if (!loanProduct) {
      const products = await this.loanProductRepository.find({
        where: { disabled: false },
        order: { maximumLoanAmount: 'ASC' },
      });
      loanProduct = products.find(
        (p) => dto.requestedAmount <= (p.maximumLoanAmount || Infinity),
      ) || products[0];
    }

    // Calculate estimated terms
    const estimatedApprovedAmount = isQualified
      ? this.calculateEstimatedAmount(dto.requestedAmount, qualificationScore)
      : 0;

    const estimatedInterestRate = loanProduct
      ? Number(loanProduct.rateOfInterest) || 10
      : this.estimateInterestRate(qualificationScore);

    const estimatedTerm = this.estimateTerm(dto.requestedAmount, estimatedApprovedAmount);

    // Create expiry date (30 days from now)
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 30);

    // Save pre-qualification record
    const preQual = this.preQualificationRepository.create({
      email: dto.email,
      phoneNumber: dto.phoneNumber,
      token,
      requestedAmount: dto.requestedAmount,
      estimatedApprovedAmount,
      estimatedInterestRate,
      estimatedTerm,
      loanProductId: loanProduct?.id,
      loanProductName: loanProduct?.productName,
      preQualificationResult: JSON.stringify({
        qualificationScore,
        isQualified,
        factors: this.getQualificationFactors(dto, qualificationScore),
      }),
      expiryDate,
      isActive: true,
    });

    await this.preQualificationRepository.save(preQual);

    return {
      token,
      isQualified,
      estimatedApprovedAmount,
      estimatedInterestRate,
      estimatedTerm,
      recommendedProduct: loanProduct?.productName || 'Personal Loan',
      qualificationScore,
      expiryDate: expiryDate.toISOString().split('T')[0],
      reason: this.getQualificationReason(qualificationScore, isQualified),
      nextSteps: isQualified
        ? 'Submit full application to proceed with loan processing'
        : 'Improve your credit profile or reduce requested amount to qualify',
    };
  }

  /**
   * Calculate qualification score (0-100)
   */
  private calculateQualificationScore(dto: PreQualificationCheckDto): number {
    let score = 50; // Base score

    // Income factor (0-30 points)
    if (dto.annualIncome) {
      const incomeRatio = dto.requestedAmount / dto.annualIncome;
      if (incomeRatio <= 0.3) score += 30;
      else if (incomeRatio <= 0.5) score += 20;
      else if (incomeRatio <= 0.7) score += 10;
      else score += 5;
    }

    // Employment status (0-15 points)
    if (dto.employmentStatus) {
      const employment = dto.employmentStatus.toLowerCase();
      if (employment.includes('employed') || employment.includes('full-time')) {
        score += 15;
      } else if (employment.includes('self-employed') || employment.includes('business')) {
        score += 10;
      } else if (employment.includes('part-time')) {
        score += 5;
      }
    }

    // Credit score factor (0-20 points)
    if (dto.creditScore) {
      if (dto.creditScore >= 750) score += 20;
      else if (dto.creditScore >= 700) score += 15;
      else if (dto.creditScore >= 650) score += 10;
      else if (dto.creditScore >= 600) score += 5;
    }

    // Requested amount reasonableness (0-15 points)
    if (dto.annualIncome) {
      const ratio = dto.requestedAmount / dto.annualIncome;
      if (ratio <= 0.5) score += 15;
      else if (ratio <= 1.0) score += 10;
      else if (ratio <= 1.5) score += 5;
    }

    return Math.min(100, Math.max(0, score));
  }

  /**
   * Calculate estimated approved amount
   */
  private calculateEstimatedAmount(
    requestedAmount: number,
    score: number,
  ): number {
    // Approved amount is based on score
    // Score 60-70: 70% of requested
    // Score 71-80: 85% of requested
    // Score 81-90: 95% of requested
    // Score 91-100: 100% of requested

    let multiplier = 0.7;
    if (score >= 91) multiplier = 1.0;
    else if (score >= 81) multiplier = 0.95;
    else if (score >= 71) multiplier = 0.85;

    return Math.round(requestedAmount * multiplier);
  }

  /**
   * Estimate interest rate based on score
   */
  private estimateInterestRate(score: number): number {
    // Higher score = lower interest rate
    if (score >= 90) return 6.5;
    if (score >= 80) return 8.0;
    if (score >= 70) return 10.0;
    if (score >= 60) return 12.5;
    return 15.0;
  }

  /**
   * Estimate loan term
   */
  private estimateTerm(requestedAmount: number, approvedAmount: number): number {
    // Larger amounts get longer terms
    if (approvedAmount >= 100000) return 60;
    if (approvedAmount >= 50000) return 48;
    if (approvedAmount >= 25000) return 36;
    return 24;
  }

  /**
   * Get qualification factors
   */
  private getQualificationFactors(
    dto: PreQualificationCheckDto,
    score: number,
  ): Record<string, any> {
    return {
      incomeProvided: !!dto.annualIncome,
      employmentProvided: !!dto.employmentStatus,
      creditScoreProvided: !!dto.creditScore,
      score,
    };
  }

  /**
   * Get qualification reason
   */
  private getQualificationReason(score: number, isQualified: boolean): string {
    if (isQualified) {
      if (score >= 90) {
        return 'Excellent credit profile and income. High approval likelihood.';
      } else if (score >= 80) {
        return 'Strong credit profile. Good approval chances.';
      } else if (score >= 70) {
        return 'Good credit profile. Moderate approval chances.';
      } else {
        return 'Fair credit profile. May qualify with conditions.';
      }
    } else {
      if (score >= 50) {
        return 'Credit profile needs improvement. Consider reducing loan amount.';
      } else {
        return 'Does not meet minimum qualification criteria.';
      }
    }
  }

  /**
   * Get pre-qualification by token
   */
  async getByToken(token: string): Promise<PreQualification | null> {
    return await this.preQualificationRepository.findOne({
      where: { token, isActive: true },
    });
  }

  /**
   * Mark pre-qualification as converted
   */
  async markAsConverted(
    token: string,
    applicationId: string,
  ): Promise<void> {
    const preQual = await this.getByToken(token);
    if (preQual) {
      preQual.isConverted = true;
      preQual.convertedApplicationId = applicationId;
      await this.preQualificationRepository.save(preQual);
    }
  }
}

