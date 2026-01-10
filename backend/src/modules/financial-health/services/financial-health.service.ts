import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Loan, LoanStatus } from '../../loan/entities/loan.entity';
import { LoanApplication } from '../../loan-application/entities/loan-application.entity';
import { LoanRepayment } from '../../loan-repayment/entities/loan-repayment.entity';
import { CreditDecision } from '../../credit-assessment/entities/credit-decision.entity';
import { CalculateFinancialHealthDto, FinancialHealthResult } from '../dto/financial-health.dto';

@Injectable()
export class FinancialHealthService {
  private readonly logger = new Logger(FinancialHealthService.name);

  constructor(
    @InjectRepository(Loan)
    private readonly loanRepository: Repository<Loan>,
    @InjectRepository(LoanApplication)
    private readonly applicationRepository: Repository<LoanApplication>,
    @InjectRepository(LoanRepayment)
    private readonly repaymentRepository: Repository<LoanRepayment>,
    @InjectRepository(CreditDecision)
    private readonly creditDecisionRepository: Repository<CreditDecision>,
  ) {}

  /**
   * Calculate comprehensive financial health score
   */
  async calculateFinancialHealth(
    dto: CalculateFinancialHealthDto,
    companyId: string,
  ): Promise<FinancialHealthResult> {
    this.logger.log(`Calculating financial health for applicant ${dto.applicantId}`);

    // Get all loans
    const loans = await this.loanRepository.find({
      where: {
        applicantId: dto.applicantId,
        applicantType: dto.applicantType as any,
        companyId,
      },
      relations: ['repaymentSchedules'],
    });

    // Get all applications
    const applications = await this.applicationRepository.find({
      where: {
        applicantId: dto.applicantId,
        applicantType: dto.applicantType as any,
        companyId,
      },
    });

    // Get all repayments
    const repayments = await this.repaymentRepository.find({
      where: {
        loan: { applicantId: dto.applicantId, applicantType: dto.applicantType as any, companyId },
      } as any,
      relations: ['loan'],
      order: { postingDate: 'DESC' },
    });

    // Get credit decisions
    const applicationIds = applications.map((app) => app.id);
    const creditDecisions = applicationIds.length > 0
      ? await this.creditDecisionRepository.find({
          where: { applicationId: applicationIds as any },
          order: { decisionDate: 'DESC' },
          take: 1,
        })
      : [];

    // Calculate category scores
    const creditScore = dto.includeCreditScore !== false
      ? this.calculateCreditScore(creditDecisions)
      : 500; // Default if not available

    const debtManagement = this.calculateDebtManagementScore(loans);
    const paymentHistory = dto.includePaymentBehavior !== false
      ? this.calculatePaymentHistoryScore(repayments, loans)
      : 500;
    const incomeStability = this.calculateIncomeStabilityScore(applications, loans);
    const loanUtilization = this.calculateLoanUtilizationScore(loans);

    const categoryScores = {
      creditScore,
      debtManagement,
      paymentHistory,
      incomeStability,
      loanUtilization,
    };

    // Calculate overall score (weighted average)
    const overallScore = Math.round(
      creditScore * 0.3 +
      debtManagement * 0.25 +
      paymentHistory * 0.25 +
      incomeStability * 0.1 +
      loanUtilization * 0.1,
    );

    // Determine health grade
    const healthGrade = this.getHealthGrade(overallScore);

    // Determine risk level
    const riskLevel = this.getRiskLevel(overallScore, categoryScores);

    // Identify strengths and weaknesses
    const strengths = this.identifyStrengths(categoryScores);
    const weaknesses = this.identifyWeaknesses(categoryScores);
    const recommendations = this.generateRecommendations(categoryScores, weaknesses);

    // Calculate eligible loan amount
    const eligibleLoanAmount = this.calculateEligibleLoanAmount(overallScore, loans);

    // Calculate recommended rate range
    const recommendedRateRange = this.calculateRecommendedRateRange(overallScore, creditScore);

    return {
      overallScore,
      healthGrade,
      categoryScores,
      strengths,
      weaknesses,
      recommendations,
      riskLevel,
      eligibleLoanAmount,
      recommendedRateRange,
    };
  }

  /**
   * Calculate credit score component (0-1000)
   */
  private calculateCreditScore(creditDecisions: CreditDecision[]): number {
    if (creditDecisions.length === 0) {
      return 500; // Neutral if no credit history
    }

    const latestDecision = creditDecisions[0];
    const score = latestDecision.creditScore;

    // Normalize to 0-1000 scale (assuming 300-850 scale)
    if (score <= 850) {
      return Math.round(((score - 300) / 550) * 1000);
    }

    // If already 0-100 scale, scale to 0-1000
    return Math.round(score * 10);
  }

  /**
   * Calculate debt management score (0-1000)
   */
  private calculateDebtManagementScore(loans: Loan[]): number {
    if (loans.length === 0) {
      return 800; // Good if no debt
    }

    const activeLoans = loans.filter((loan) => loan.status === LoanStatus.ACTIVE);
    if (activeLoans.length === 0) {
      return 700; // Good if all loans closed
    }

    // Calculate debt-to-income ratio (simplified)
    const totalOutstanding = activeLoans.reduce((sum, loan) => {
      const outstanding = (loan.disbursedAmount || loan.loanAmount) - (loan.totalAmountPaid || 0);
      return sum + outstanding;
    }, 0);

    // Score based on number of active loans and total debt
    let score = 1000;
    
    // Penalize for multiple active loans
    score -= activeLoans.length * 50;
    
    // Penalize for high total debt (simplified - would need income data)
    if (totalOutstanding > 500000) {
      score -= 200;
    } else if (totalOutstanding > 200000) {
      score -= 100;
    }

    return Math.max(0, Math.min(1000, score));
  }

  /**
   * Calculate payment history score (0-1000)
   */
  private calculatePaymentHistoryScore(repayments: LoanRepayment[], loans: Loan[]): number {
    if (repayments.length === 0) {
      return 500; // Neutral if no payment history
    }

    // Calculate on-time payment rate
    const totalRepayments = repayments.length;
    const onTimeRepayments = repayments.filter((repayment) => {
      // Check if payment was on time (simplified)
      return repayment.penaltyPaid === 0 || (repayment.penaltyPaid || 0) < repayment.amountPaid * 0.1;
    }).length;

    const onTimeRate = onTimeRepayments / totalRepayments;

    // Score based on on-time rate
    return Math.round(onTimeRate * 1000);
  }

  /**
   * Calculate income stability score (0-1000)
   */
  private calculateIncomeStabilityScore(applications: LoanApplication[], loans: Loan[]): number {
    // Analyze application frequency and approval rate
    if (applications.length === 0) {
      return 600; // Neutral for new customers
    }

    const approvedCount = applications.filter((app) => app.status === 'Approved').length;
    const approvalRate = approvedCount / applications.length;

    // Score based on approval rate (indicates income stability)
    let score = Math.round(approvalRate * 800);

    // Bonus for consistent application behavior
    if (applications.length >= 3 && approvalRate >= 0.7) {
      score += 100;
    }

    return Math.min(1000, score);
  }

  /**
   * Calculate loan utilization score (0-1000)
   */
  private calculateLoanUtilizationScore(loans: Loan[]): number {
    if (loans.length === 0) {
      return 900; // Excellent if no loans
    }

    const activeLoans = loans.filter((loan) => loan.status === LoanStatus.ACTIVE);
    const closedLoans = loans.filter((loan) => loan.status === LoanStatus.CLOSED || loan.status === LoanStatus.SETTLED);

    // Score based on ratio of closed to active loans
    if (activeLoans.length === 0) {
      return 1000; // Perfect if all loans closed
    }

    const closedRatio = closedLoans.length / loans.length;
    return Math.round(closedRatio * 1000);
  }

  /**
   * Get health grade from score
   */
  private getHealthGrade(score: number): 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR' | 'CRITICAL' {
    if (score >= 800) return 'EXCELLENT';
    if (score >= 650) return 'GOOD';
    if (score >= 500) return 'FAIR';
    if (score >= 350) return 'POOR';
    return 'CRITICAL';
  }

  /**
   * Get risk level
   */
  private getRiskLevel(
    overallScore: number,
    categoryScores: any,
  ): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
    if (overallScore >= 750 && categoryScores.paymentHistory >= 700) {
      return 'LOW';
    }
    if (overallScore >= 600) {
      return 'MEDIUM';
    }
    if (overallScore >= 400) {
      return 'HIGH';
    }
    return 'CRITICAL';
  }

  /**
   * Identify strengths
   */
  private identifyStrengths(categoryScores: any): string[] {
    const strengths: string[] = [];

    if (categoryScores.creditScore >= 750) {
      strengths.push('Excellent credit score');
    }
    if (categoryScores.debtManagement >= 700) {
      strengths.push('Good debt management');
    }
    if (categoryScores.paymentHistory >= 800) {
      strengths.push('Excellent payment history');
    }
    if (categoryScores.incomeStability >= 700) {
      strengths.push('Stable income');
    }
    if (categoryScores.loanUtilization >= 800) {
      strengths.push('Good loan utilization');
    }

    return strengths;
  }

  /**
   * Identify weaknesses
   */
  private identifyWeaknesses(categoryScores: any): string[] {
    const weaknesses: string[] = [];

    if (categoryScores.creditScore < 600) {
      weaknesses.push('Low credit score');
    }
    if (categoryScores.debtManagement < 500) {
      weaknesses.push('High debt burden');
    }
    if (categoryScores.paymentHistory < 600) {
      weaknesses.push('Poor payment history');
    }
    if (categoryScores.incomeStability < 500) {
      weaknesses.push('Unstable income');
    }
    if (categoryScores.loanUtilization < 500) {
      weaknesses.push('High loan utilization');
    }

    return weaknesses;
  }

  /**
   * Generate recommendations
   */
  private generateRecommendations(categoryScores: any, weaknesses: string[]): string[] {
    const recommendations: string[] = [];

    if (weaknesses.includes('Low credit score')) {
      recommendations.push('Improve credit score by paying bills on time and reducing debt');
    }
    if (weaknesses.includes('High debt burden')) {
      recommendations.push('Reduce existing debt before applying for new loans');
    }
    if (weaknesses.includes('Poor payment history')) {
      recommendations.push('Focus on making all payments on time to improve payment history');
    }
    if (weaknesses.includes('Unstable income')) {
      recommendations.push('Build stable employment history before applying');
    }
    if (weaknesses.includes('High loan utilization')) {
      recommendations.push('Consider closing some existing loans before applying for new ones');
    }

    if (recommendations.length === 0) {
      recommendations.push('Maintain current financial practices');
    }

    return recommendations;
  }

  /**
   * Calculate eligible loan amount
   */
  private calculateEligibleLoanAmount(overallScore: number, loans: Loan[]): number {
    // Base eligible amount on score
    const baseAmount = (overallScore / 1000) * 1000000; // Up to 1M for perfect score

    // Adjust based on existing loans
    const activeLoans = loans.filter((loan) => loan.status === LoanStatus.ACTIVE);
    const totalActiveDebt = activeLoans.reduce(
      (sum, loan) => sum + ((loan.disbursedAmount || loan.loanAmount) - (loan.totalAmountPaid || 0)),
      0,
    );

    // Reduce eligible amount if high existing debt
    const adjustedAmount = baseAmount - totalActiveDebt * 0.5;

    return Math.max(0, Math.round(adjustedAmount));
  }

  /**
   * Calculate recommended interest rate range
   */
  private calculateRecommendedRateRange(overallScore: number, creditScore: number): {
    min: number;
    max: number;
    likely: number;
  } {
    // Base rates
    let min = 8;
    let max = 24;
    let likely = 12;

    // Adjust based on overall score
    if (overallScore >= 800) {
      min = 6;
      max = 12;
      likely = 9;
    } else if (overallScore >= 650) {
      min = 8;
      max = 15;
      likely = 11;
    } else if (overallScore >= 500) {
      min = 12;
      max = 20;
      likely = 15;
    } else {
      min = 15;
      max = 24;
      likely = 18;
    }

    return { min, max, likely };
  }
}

