import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LoanApplication } from '../../loan-application/entities/loan-application.entity';
import { Loan } from '../../loan/entities/loan.entity';
import { LoanProduct } from '../../loan-product/entities/loan-product.entity';
import { CreditDecision } from '../../credit-assessment/entities/credit-decision.entity';
import { PredictApprovalDto, ApprovalProbabilityResult } from '../dto/approval-probability.dto';
import { LoanStatus } from '../../../common/enums/loan-status.enum';

@Injectable()
export class ApprovalPredictorService {
  private readonly logger = new Logger(ApprovalPredictorService.name);

  constructor(
    @InjectRepository(LoanApplication)
    private readonly applicationRepository: Repository<LoanApplication>,
    @InjectRepository(Loan)
    private readonly loanRepository: Repository<Loan>,
    @InjectRepository(LoanProduct)
    private readonly loanProductRepository: Repository<LoanProduct>,
    @InjectRepository(CreditDecision)
    private readonly creditDecisionRepository: Repository<CreditDecision>,
  ) {}

  /**
   * Predict loan approval probability
   */
  async predictApproval(
    dto: PredictApprovalDto,
    companyId: string,
  ): Promise<ApprovalProbabilityResult> {
    this.logger.log(`Predicting approval for application ${dto.applicationId || 'new'}`);

    // Get loan product
    const product = await this.loanProductRepository.findOne({
      where: { id: dto.loanProductId, companyId },
    });

    if (!product) {
      throw new Error('Loan product not found');
    }

    // Start with base probability
    let probability = 0.5;
    const factors: Array<{
      factor: string;
      impact: 'positive' | 'negative' | 'neutral';
      weight: number;
      description: string;
    }> = [];
    const recommendations: string[] = [];

    // Factor 1: Credit Score (30% weight)
    if (dto.creditScore) {
      const creditFactor = this.evaluateCreditScore(dto.creditScore);
      probability += creditFactor.impact * 0.3;
      factors.push({
        factor: 'Credit Score',
        impact: creditFactor.impact > 0 ? 'positive' : creditFactor.impact < 0 ? 'negative' : 'neutral',
        weight: 0.3,
        description: creditFactor.description,
      });

      if (creditFactor.impact < 0) {
        recommendations.push('Improve your credit score to increase approval chances');
      }
    } else {
      factors.push({
        factor: 'Credit Score',
        impact: 'neutral',
        weight: 0.3,
        description: 'Credit score not provided - cannot assess',
      });
      recommendations.push('Provide credit score for more accurate prediction');
    }

    // Factor 2: Debt-to-Income Ratio (25% weight)
    if (dto.monthlyIncome) {
      const dti = this.calculateDebtToIncomeRatio(
        dto.monthlyIncome,
        dto.existingLoanEMIs || 0,
        dto.requestedAmount,
      );
      const dtiFactor = this.evaluateDTI(dti);
      probability += dtiFactor.impact * 0.25;
      factors.push({
        factor: 'Debt-to-Income Ratio',
        impact: dtiFactor.impact > 0 ? 'positive' : dtiFactor.impact < 0 ? 'negative' : 'neutral',
        weight: 0.25,
        description: dtiFactor.description,
      });

      if (dtiFactor.impact < 0) {
        recommendations.push('Reduce existing debt or increase income to improve approval chances');
      }
    } else {
      factors.push({
        factor: 'Debt-to-Income Ratio',
        impact: 'neutral',
        weight: 0.25,
        description: 'Income not provided - cannot assess',
      });
      recommendations.push('Provide monthly income for more accurate prediction');
    }

    // Factor 3: Loan-to-Income Ratio (15% weight)
    if (dto.monthlyIncome) {
      const annualIncome = dto.monthlyIncome * 12;
      const ltiRatio = dto.requestedAmount / annualIncome;
      const ltiFactor = this.evaluateLTI(ltiRatio);
      probability += ltiFactor.impact * 0.15;
      factors.push({
        factor: 'Loan-to-Income Ratio',
        impact: ltiFactor.impact > 0 ? 'positive' : ltiFactor.impact < 0 ? 'negative' : 'neutral',
        weight: 0.15,
        description: ltiFactor.description,
      });

      if (ltiFactor.impact < 0) {
        recommendations.push(`Consider reducing loan amount to ${Math.floor(annualIncome * 0.5)} for better approval chances`);
      }
    }

    // Factor 4: Employment Stability (10% weight)
    if (dto.employmentType && dto.employmentYears !== undefined) {
      const employmentFactor = this.evaluateEmployment(dto.employmentType, dto.employmentYears);
      probability += employmentFactor.impact * 0.1;
      factors.push({
        factor: 'Employment Stability',
        impact: employmentFactor.impact > 0 ? 'positive' : employmentFactor.impact < 0 ? 'negative' : 'neutral',
        weight: 0.1,
        description: employmentFactor.description,
      });

      if (employmentFactor.impact < 0) {
        recommendations.push('Build longer employment history to improve approval chances');
      }
    }

    // Factor 5: Product Eligibility (10% weight)
    const eligibilityFactor = this.evaluateProductEligibility(dto, product);
    probability += eligibilityFactor.impact * 0.1;
    factors.push({
      factor: 'Product Eligibility',
      impact: eligibilityFactor.impact > 0 ? 'positive' : eligibilityFactor.impact < 0 ? 'negative' : 'neutral',
      weight: 0.1,
      description: eligibilityFactor.description,
    });

    // Factor 6: Applicant History (10% weight)
    const historyFactor = await this.evaluateApplicantHistory(dto.applicantId, dto.applicantType, companyId);
    probability += historyFactor.impact * 0.1;
    factors.push({
      factor: 'Application History',
      impact: historyFactor.impact > 0 ? 'positive' : historyFactor.impact < 0 ? 'negative' : 'neutral',
      weight: 0.1,
      description: historyFactor.description,
    });

    // Factor 7: Collateral (5% weight)
    if (dto.hasCollateral) {
      probability += 0.05;
      factors.push({
        factor: 'Collateral',
        impact: 'positive',
        weight: 0.05,
        description: 'Collateral provided - reduces risk',
      });
    } else if (product.productType === 'Secured') {
      probability -= 0.05;
      factors.push({
        factor: 'Collateral',
        impact: 'negative',
        weight: 0.05,
        description: 'Product requires collateral but none provided',
      });
      recommendations.push('Provide collateral to improve approval chances');
    }

    // Clamp probability between 0 and 1
    probability = Math.max(0, Math.min(1, probability));

    // Determine predicted outcome
    let predictedOutcome: 'LIKELY_APPROVED' | 'LIKELY_REJECTED' | 'UNCERTAIN';
    let confidence: 'HIGH' | 'MEDIUM' | 'LOW';

    if (probability >= 0.7) {
      predictedOutcome = 'LIKELY_APPROVED';
      confidence = probability >= 0.85 ? 'HIGH' : 'MEDIUM';
    } else if (probability <= 0.3) {
      predictedOutcome = 'LIKELY_REJECTED';
      confidence = probability <= 0.15 ? 'HIGH' : 'MEDIUM';
    } else {
      predictedOutcome = 'UNCERTAIN';
      confidence = 'LOW';
    }

    // Estimate approved amount and rate
    let estimatedApprovedAmount: number | undefined;
    let estimatedInterestRate: number | undefined;

    if (predictedOutcome === 'LIKELY_APPROVED') {
      // Typically approve 80-100% of requested amount
      estimatedApprovedAmount = Math.floor(dto.requestedAmount * (0.8 + probability * 0.2));
      
      // Estimate interest rate based on credit score and product
      if (dto.creditScore) {
        const baseRate = Number(product.rateOfInterest);
        if (dto.creditScore >= 750) {
          estimatedInterestRate = baseRate * 0.9; // 10% discount
        } else if (dto.creditScore >= 700) {
          estimatedInterestRate = baseRate * 0.95; // 5% discount
        } else if (dto.creditScore >= 650) {
          estimatedInterestRate = baseRate;
        } else {
          estimatedInterestRate = baseRate * 1.1; // 10% premium
        }
      } else {
        estimatedInterestRate = Number(product.rateOfInterest);
      }
    }

    return {
      probability,
      probabilityPercentage: Math.round(probability * 100),
      predictedOutcome,
      confidence,
      factors,
      recommendations,
      estimatedApprovedAmount,
      estimatedInterestRate,
    };
  }

  /**
   * Evaluate credit score impact
   */
  private evaluateCreditScore(score: number): { impact: number; description: string } {
    if (score >= 750) {
      return { impact: 0.3, description: `Excellent credit score (${score}) - strong approval factor` };
    } else if (score >= 700) {
      return { impact: 0.15, description: `Good credit score (${score}) - positive factor` };
    } else if (score >= 650) {
      return { impact: 0, description: `Fair credit score (${score}) - neutral` };
    } else if (score >= 600) {
      return { impact: -0.15, description: `Below average credit score (${score}) - negative factor` };
    } else {
      return { impact: -0.3, description: `Poor credit score (${score}) - significant negative factor` };
    }
  }

  /**
   * Calculate debt-to-income ratio
   */
  private calculateDebtToIncomeRatio(
    monthlyIncome: number,
    existingEMIs: number,
    requestedAmount: number,
  ): number {
    // Estimate new loan EMI (simplified - using 12% rate, 24 months)
    const estimatedEMI = (requestedAmount * 0.12) / 12 + (requestedAmount / 24);
    const totalDebtService = existingEMIs + estimatedEMI;
    return monthlyIncome > 0 ? totalDebtService / monthlyIncome : 1;
  }

  /**
   * Evaluate debt-to-income ratio
   */
  private evaluateDTI(dti: number): { impact: number; description: string } {
    if (dti <= 0.3) {
      return { impact: 0.2, description: `Low DTI (${(dti * 100).toFixed(1)}%) - excellent` };
    } else if (dti <= 0.4) {
      return { impact: 0.1, description: `Moderate DTI (${(dti * 100).toFixed(1)}%) - good` };
    } else if (dti <= 0.5) {
      return { impact: -0.1, description: `High DTI (${(dti * 100).toFixed(1)}%) - concerning` };
    } else {
      return { impact: -0.25, description: `Very high DTI (${(dti * 100).toFixed(1)}%) - high risk` };
    }
  }

  /**
   * Evaluate loan-to-income ratio
   */
  private evaluateLTI(lti: number): { impact: number; description: string } {
    if (lti <= 0.5) {
      return { impact: 0.1, description: `Low LTI (${(lti * 100).toFixed(1)}%) - reasonable` };
    } else if (lti <= 1.0) {
      return { impact: 0, description: `Moderate LTI (${(lti * 100).toFixed(1)}%) - acceptable` };
    } else if (lti <= 1.5) {
      return { impact: -0.1, description: `High LTI (${(lti * 100).toFixed(1)}%) - risky` };
    } else {
      return { impact: -0.2, description: `Very high LTI (${(lti * 100).toFixed(1)}%) - very risky` };
    }
  }

  /**
   * Evaluate employment stability
   */
  private evaluateEmployment(type: string, years: number): { impact: number; description: string } {
    if (type === 'Salaried' && years >= 2) {
      return { impact: 0.1, description: `Stable salaried employment (${years} years) - positive` };
    } else if (type === 'Self-Employed' && years >= 3) {
      return { impact: 0.1, description: `Established business (${years} years) - positive` };
    } else if (years >= 1) {
      return { impact: 0, description: `Employment history (${years} years) - acceptable` };
    } else {
      return { impact: -0.1, description: `Limited employment history (${years} years) - concerning` };
    }
  }

  /**
   * Evaluate product eligibility
   */
  private evaluateProductEligibility(dto: PredictApprovalDto, product: LoanProduct): {
    impact: number;
    description: string;
  } {
    // Check amount limits
    if (product.maximumLoanAmount && dto.requestedAmount > product.maximumLoanAmount) {
      return {
        impact: -0.2,
        description: `Requested amount exceeds product maximum (${product.maximumLoanAmount})`,
      };
    }

    if (product.minimumLoanAmount && dto.requestedAmount < product.minimumLoanAmount) {
      return {
        impact: -0.1,
        description: `Requested amount below product minimum (${product.minimumLoanAmount})`,
      };
    }

    // Check term limits (if applicable)
    // This would require repaymentPeriods in the DTO

    return { impact: 0.1, description: 'Meets product eligibility criteria' };
  }

  /**
   * Evaluate applicant history
   */
  private async evaluateApplicantHistory(
    applicantId: string,
    applicantType: string,
    companyId: string,
  ): Promise<{ impact: number; description: string }> {
    // Get previous applications
    const previousApps = await this.applicationRepository.find({
      where: { applicantId, applicantType: applicantType as any, companyId },
    });

    // Get active loans
    const activeLoans = await this.loanRepository.find({
      where: { applicantId, applicantType: applicantType as any, companyId, status: LoanStatus.ACTIVE },
    });

    // Get credit decisions (via applications)
    const applications = await this.applicationRepository.find({
      where: { applicantId, applicantType: applicantType as any, companyId },
      select: ['id'],
    });
    const applicationIds = applications.map((app) => app.id);
    
    const creditDecisions = applicationIds.length > 0
      ? await this.creditDecisionRepository.find({
          where: { applicationId: applicationIds as any },
          take: 5,
          order: { decisionDate: 'DESC' },
        })
      : [];

    // Analyze history
    const approvedCount = previousApps.filter((app) => app.status === 'Approved').length;
    const rejectedCount = previousApps.filter((app) => app.status === 'Rejected').length;
    const totalApps = previousApps.length;

    if (totalApps === 0) {
      return { impact: 0, description: 'No previous applications - new customer' };
    }

    const approvalRate = approvedCount / totalApps;

    if (approvalRate >= 0.8 && activeLoans.length > 0) {
      return {
        impact: 0.15,
        description: `Strong history: ${approvedCount}/${totalApps} approved, ${activeLoans.length} active loans`,
      };
    } else if (approvalRate >= 0.5) {
      return {
        impact: 0.05,
        description: `Moderate history: ${approvedCount}/${totalApps} approved`,
      };
    } else if (rejectedCount > approvedCount) {
      return {
        impact: -0.15,
        description: `Poor history: ${rejectedCount} rejections vs ${approvedCount} approvals`,
      };
    }

    return { impact: 0, description: `Mixed history: ${approvedCount} approved, ${rejectedCount} rejected` };
  }
}

