import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreditDecision, DecisionType, DecisionOutcome } from '../entities/credit-decision.entity';
import { LoanApplication, ApplicationStatus } from '../../loan-application/entities/loan-application.entity';
import { LoanProduct } from '../../loan-product/entities/loan-product.entity';
import { CreateCreditDecisionDto } from '../dto/credit-decision.dto';

/**
 * Service for automated credit scoring and decisioning
 * UC-006: Automated Credit Decision
 */
@Injectable()
export class CreditScoringService {
  private readonly logger = new Logger(CreditScoringService.name);

  constructor(
    @InjectRepository(CreditDecision)
    private readonly creditDecisionRepository: Repository<CreditDecision>,
    @InjectRepository(LoanApplication)
    private readonly applicationRepository: Repository<LoanApplication>,
    @InjectRepository(LoanProduct)
    private readonly loanProductRepository: Repository<LoanProduct>,
  ) {}

  /**
   * Perform automated credit decision for an application
   */
  async performCreditDecision(applicationId: string): Promise<CreditDecision> {
    const application = await this.applicationRepository.findOne({
      where: { id: applicationId },
    });

    if (!application) {
      throw new NotFoundException(`Application with ID ${applicationId} not found`);
    }

    const loanProduct = await this.loanProductRepository.findOne({
      where: { id: application.loanProductId },
    });

    // Pull credit report (mocked for now - in production, integrate with credit bureaus)
    const creditReport = await this.pullCreditReport(application);

    // Calculate credit score
    const creditScore = await this.calculateCreditScore(application, creditReport);

    // Apply scoring model
    const scoringFactors = this.calculateScoringFactors(application, creditReport);

    // Evaluate rules
    const riskFactors = this.evaluateRiskFactors(application, creditReport);

    // Calculate debt-to-income ratio
    const debtToIncomeRatio = await this.calculateDebtToIncomeRatio(application);

    // Make decision based on rules
    const decision = this.makeDecision(
      application,
      loanProduct,
      creditScore,
      debtToIncomeRatio,
      riskFactors,
      scoringFactors,
    );

    // Create and save credit decision
    const creditDecision = this.creditDecisionRepository.create({
      applicationId: application.id,
      decisionType: DecisionType.AUTOMATED,
      outcome: decision.outcome,
      creditScore: creditScore.totalScore,
      debtToIncomeRatio,
      approvedAmount: decision.approvedAmount,
      approvedInterestRate: decision.approvedInterestRate,
      approvedTerm: decision.approvedTerm,
      decisionRationale: decision.rationale,
      riskFactors,
      scoringFactors,
      decisionDate: new Date(),
      conditions: decision.conditions,
    });

    const savedDecision = await this.creditDecisionRepository.save(creditDecision);

    this.logger.log(`Automated credit decision created for application ${application.applicationNumber}: ${decision.outcome}`);

    // Update application status based on decision
    if (decision.outcome === DecisionOutcome.APPROVED || decision.outcome === DecisionOutcome.CONDITIONALLY_APPROVED) {
      application.status = ApplicationStatus.UNDER_REVIEW;
    } else if (decision.outcome === DecisionOutcome.DECLINED) {
      application.status = ApplicationStatus.REJECTED;
      application.rejectionDate = new Date();
    } else if (decision.outcome === DecisionOutcome.REFERRED) {
      application.status = ApplicationStatus.UNDER_REVIEW;
    }

    await this.applicationRepository.save(application);

    return savedDecision;
  }

  /**
   * Pull credit report (mocked - integrate with credit bureaus in production)
   */
  private async pullCreditReport(application: LoanApplication): Promise<any> {
    // Mock credit report - in production, integrate with Equifax, Experian, TransUnion
    // This would make API calls to credit bureaus
    return {
      creditScore: 650 + Math.floor(Math.random() * 200), // 650-850
      creditHistory: 'Good',
      delinquencies: Math.floor(Math.random() * 3),
      publicRecords: Math.floor(Math.random() * 2),
      inquiries: Math.floor(Math.random() * 5),
      accounts: {
        open: Math.floor(Math.random() * 10) + 5,
        closed: Math.floor(Math.random() * 10),
        total: 0,
      },
      utilization: Math.random() * 0.5, // 0-50%
    };
  }

  /**
   * Calculate comprehensive credit score
   */
  private async calculateCreditScore(application: LoanApplication, creditReport: any): Promise<any> {
    const baseScore = creditReport.creditScore || 650;
    
    // Factor weights (customizable scoring model)
    const factors = {
      creditHistory: Math.min(creditReport.creditHistory === 'Good' ? 30 : 15, 30),
      paymentHistory: Math.max(30 - (creditReport.delinquencies * 5), 0),
      creditUtilization: Math.max(20 - (creditReport.utilization * 40), 0),
      creditAge: Math.min(creditReport.accounts.total > 0 ? 10 : 5, 10),
      creditMix: Math.min(creditReport.accounts.open > 3 ? 10 : 5, 10),
    };

    const totalScore = Object.values(factors).reduce((sum, val) => sum + val, 0);
    const normalizedScore = Math.min(Math.max((totalScore / 100) * 850, 300), 850);

    return {
      baseScore,
      factors,
      totalScore: normalizedScore,
    };
  }

  /**
   * Calculate scoring factors breakdown
   */
  private calculateScoringFactors(application: LoanApplication, creditReport: any): Record<string, any> {
    return {
      creditHistory: creditReport.creditHistory,
      paymentHistory: {
        delinquencies: creditReport.delinquencies,
        score: Math.max(30 - (creditReport.delinquencies * 5), 0),
      },
      creditUtilization: {
        utilization: creditReport.utilization,
        score: Math.max(20 - (creditReport.utilization * 40), 0),
      },
      creditAge: {
        accounts: creditReport.accounts.total,
        score: Math.min(creditReport.accounts.total > 0 ? 10 : 5, 10),
      },
      creditMix: {
        openAccounts: creditReport.accounts.open,
        score: Math.min(creditReport.accounts.open > 3 ? 10 : 5, 10),
      },
    };
  }

  /**
   * Evaluate risk factors
   */
  private evaluateRiskFactors(application: LoanApplication, creditReport: any): Record<string, any> {
    const risks: Record<string, any> = {};

    if (creditReport.creditScore < 600) {
      risks.lowCreditScore = true;
    }
    if (creditReport.delinquencies > 2) {
      risks.highDelinquencies = true;
    }
    if (creditReport.utilization > 0.7) {
      risks.highUtilization = true;
    }
    if (creditReport.publicRecords > 0) {
      risks.publicRecords = true;
    }
    if (application.requestedAmount > 100000) {
      risks.highLoanAmount = true;
    }

    return risks;
  }

  /**
   * Calculate debt-to-income ratio
   */
  private async calculateDebtToIncomeRatio(application: LoanApplication): Promise<number> {
    // Mock calculation - in production, pull actual income and debt data
    // For now, use a random value between 0.2 and 0.6
    return 0.2 + Math.random() * 0.4;
  }

  /**
   * Make decision based on rules
   */
  private makeDecision(
    application: LoanApplication,
    loanProduct: LoanProduct | null,
    creditScore: any,
    debtToIncomeRatio: number,
    riskFactors: Record<string, any>,
    scoringFactors: Record<string, any>,
  ): {
    outcome: DecisionOutcome;
    approvedAmount?: number;
    approvedInterestRate?: number;
    approvedTerm?: number;
    rationale: string;
    conditions?: string;
  } {
    const score = creditScore.totalScore;

    // Decision rules
    if (score >= 750 && debtToIncomeRatio < 0.36 && Object.keys(riskFactors).length === 0) {
      // Excellent credit - approve at requested amount
      return {
        outcome: DecisionOutcome.APPROVED,
        approvedAmount: application.requestedAmount,
        approvedInterestRate: loanProduct?.rateOfInterest || 5.5,
        approvedTerm: application.repaymentPeriods || 36,
        rationale: 'Excellent credit score and low debt-to-income ratio. All criteria met.',
      };
    } else if (score >= 700 && debtToIncomeRatio < 0.43 && Object.keys(riskFactors).length <= 1) {
      // Good credit - approve at requested amount
      return {
        outcome: DecisionOutcome.APPROVED,
        approvedAmount: application.requestedAmount,
        approvedInterestRate: loanProduct?.rateOfInterest || 6.5,
        approvedTerm: application.repaymentPeriods || 36,
        rationale: 'Good credit score and acceptable debt-to-income ratio.',
      };
    } else if (score >= 650 && debtToIncomeRatio < 0.50) {
      // Fair credit - conditional approval or reduced amount
      const approvedAmount = application.requestedAmount * 0.8; // 80% of requested
      return {
        outcome: DecisionOutcome.CONDITIONALLY_APPROVED,
        approvedAmount,
        approvedInterestRate: (loanProduct?.rateOfInterest || 7.5) + 1.5,
        approvedTerm: application.repaymentPeriods || 36,
        rationale: 'Fair credit score. Conditional approval with reduced amount and higher rate.',
        conditions: 'Requires additional documentation and co-signer may be recommended.',
      };
    } else if (score >= 600 && debtToIncomeRatio < 0.55) {
      // Refer to manual underwriting
      return {
        outcome: DecisionOutcome.REFERRED,
        rationale: 'Application requires manual underwriting review due to borderline credit profile.',
      };
    } else {
      // Decline
      const reasons: string[] = [];
      if (score < 600) reasons.push('Credit score below minimum threshold');
      if (debtToIncomeRatio >= 0.55) reasons.push('Debt-to-income ratio too high');
      if (Object.keys(riskFactors).length > 2) reasons.push('Multiple risk factors identified');

      return {
        outcome: DecisionOutcome.DECLINED,
        rationale: `Application declined: ${reasons.join('; ')}`,
      };
    }
  }

  /**
   * Get credit decision for an application
   */
  async getCreditDecision(applicationId: string): Promise<CreditDecision | null> {
    return await this.creditDecisionRepository.findOne({
      where: { applicationId },
      order: { decisionDate: 'DESC' },
    });
  }

  /**
   * Get all credit decisions
   */
  async getAllCreditDecisions(): Promise<CreditDecision[]> {
    return await this.creditDecisionRepository.find({
      order: { decisionDate: 'DESC' },
      relations: ['application'],
    });
  }
}

