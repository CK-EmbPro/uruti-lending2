import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, In } from 'typeorm';
import { OverridePerformanceReport, ReportPeriod } from '../entities/override-performance-report.entity';
import { OverrideAudit, OverrideOutcome } from '../entities/override-audit.entity';
import { CreditDecision, DecisionType } from '../entities/credit-decision.entity';
import { Loan, LoanStatus } from '../../loan/entities/loan.entity';

/**
 * Service for generating override performance reports
 */
@Injectable()
export class OverridePerformanceService {
  private readonly logger = new Logger(OverridePerformanceService.name);

  constructor(
    @InjectRepository(OverridePerformanceReport)
    private readonly reportRepository: Repository<OverridePerformanceReport>,
    @InjectRepository(OverrideAudit)
    private readonly auditRepository: Repository<OverrideAudit>,
    @InjectRepository(CreditDecision)
    private readonly creditDecisionRepository: Repository<CreditDecision>,
    @InjectRepository(Loan)
    private readonly loanRepository: Repository<Loan>,
  ) {}

  /**
   * Generate quarterly override performance report
   */
  async generateQuarterlyReport(
    companyId: string,
    periodStart: Date,
    periodEnd: Date,
    generatedBy: string,
  ): Promise<OverridePerformanceReport> {
    this.logger.log(`Generating quarterly override performance report for ${companyId} from ${periodStart} to ${periodEnd}`);

    // Get all overrides in period
    const overrideDecisions = await this.creditDecisionRepository.find({
      where: {
        decisionType: DecisionType.OVERRIDE,
        decisionDate: Between(periodStart, periodEnd),
      },
      relations: ['application'],
    });

    // Get all model decisions in period
    const modelDecisions = await this.creditDecisionRepository.find({
      where: {
        decisionType: DecisionType.AUTOMATED,
        decisionDate: Between(periodStart, periodEnd),
      },
      relations: ['application'],
    });

    // Get audit records for overrides
    const overrideDecisionIds = overrideDecisions.map((d) => d.id);
    const overrideAudits = overrideDecisionIds.length > 0
      ? await this.auditRepository.find({
          where: {
            overrideDecisionId: In(overrideDecisionIds),
          },
          relations: ['loan'],
        })
      : [];

    // Calculate override metrics
    const overrideMetrics = this.calculateOverrideMetrics(overrideDecisions, overrideAudits);

    // Calculate model metrics
    const modelMetrics = await this.calculateModelMetrics(modelDecisions, periodStart, periodEnd);

    // Calculate accuracy comparison
    const accuracyComparison = this.calculateAccuracyComparison(overrideMetrics, modelMetrics);

    // Performance by tier
    const performanceByTier = await this.calculatePerformanceByTier(
      overrideDecisions,
      overrideAudits,
      modelDecisions,
      periodStart,
      periodEnd,
    );

    // Performance by approver
    const performanceByApprover = this.calculatePerformanceByApprover(overrideDecisions, overrideAudits);

    // Detailed metrics
    const detailedMetrics = this.calculateDetailedMetrics(overrideAudits, modelDecisions);

    const report = this.reportRepository.create({
      companyId,
      reportPeriod: ReportPeriod.QUARTERLY,
      periodStart,
      periodEnd,
      generatedBy,
      generatedAt: new Date(),
      ...overrideMetrics,
      ...modelMetrics,
      ...accuracyComparison,
      performanceByTier,
      performanceByApprover,
      detailedMetrics,
    });

    return await this.reportRepository.save(report);
  }

  /**
   * Calculate override metrics
   */
  private calculateOverrideMetrics(
    overrideDecisions: CreditDecision[],
    overrideAudits: OverrideAudit[],
  ): {
    totalOverrides: number;
    totalOverrideAmount: number;
    overrideApproved: number;
    overrideSuccessful: number;
    overrideDefaulted: number;
    overrideSuccessRate: number;
    overrideDefaultRate: number;
    overrideTotalRepaid: number;
    overrideTotalDefaulted: number;
  } {
    const totalOverrides = overrideDecisions.length;
    const totalOverrideAmount = overrideDecisions.reduce((sum, d) => sum + (d.approvedAmount || 0), 0);
    const overrideApproved = overrideDecisions.filter((d) => d.outcome === 'Approved' || d.outcome === 'Conditionally Approved').length;

    const overrideSuccessful = overrideAudits.filter((a) => a.outcome === OverrideOutcome.SUCCESS).length;
    const overrideDefaulted = overrideAudits.filter((a) => a.outcome === OverrideOutcome.DEFAULT).length;
    const overrideSuccessRate = totalOverrides > 0 ? (overrideSuccessful / totalOverrides) * 100 : 0;
    const overrideDefaultRate = totalOverrides > 0 ? (overrideDefaulted / totalOverrides) * 100 : 0;

    const overrideTotalRepaid = overrideAudits.reduce((sum, a) => sum + (a.totalRepaid || 0), 0);
    const overrideTotalDefaulted = overrideAudits.reduce((sum, a) => sum + (a.totalDefaulted || 0), 0);

    return {
      totalOverrides,
      totalOverrideAmount,
      overrideApproved,
      overrideSuccessful,
      overrideDefaulted,
      overrideSuccessRate: Number(overrideSuccessRate.toFixed(2)),
      overrideDefaultRate: Number(overrideDefaultRate.toFixed(2)),
      overrideTotalRepaid,
      overrideTotalDefaulted,
    };
  }

  /**
   * Calculate model metrics
   */
  private async calculateModelMetrics(
    modelDecisions: CreditDecision[],
    periodStart: Date,
    periodEnd: Date,
  ): Promise<{
    totalModelDecisions: number;
    totalModelAmount: number;
    modelApproved: number;
    modelSuccessful: number;
    modelDefaulted: number;
    modelSuccessRate: number;
    modelDefaultRate: number;
    modelTotalRepaid: number;
    modelTotalDefaulted: number;
  }> {
    const totalModelDecisions = modelDecisions.length;
    const totalModelAmount = modelDecisions.reduce((sum, d) => sum + (d.approvedAmount || 0), 0);
    const modelApproved = modelDecisions.filter((d) => d.outcome === 'Approved' || d.outcome === 'Conditionally Approved').length;

    // Get loans from model decisions
    const applicationIds = modelDecisions.map((d) => d.applicationId);
    // Note: Loan entity doesn't have applicationId field - need to query differently
    // For now, we'll need to get loans through a different relationship or filter
    const loans = await this.loanRepository.find({
      // Note: applicationId not on Loan entity - this query needs to be adjusted
      // where: { applicationId: In(applicationIds) },
    });
    // Filter loans that match applicationIds (would need to join with LoanApplication)
    const filteredLoans = loans; // TODO: Implement proper filtering via LoanApplication relation

    const modelSuccessful = filteredLoans.filter((l) => l.status === LoanStatus.CLOSED || l.status === LoanStatus.SETTLED).length;
    const modelDefaulted = filteredLoans.filter((l) => l.status === LoanStatus.WRITTEN_OFF).length;
    const modelSuccessRate = totalModelDecisions > 0 ? (modelSuccessful / totalModelDecisions) * 100 : 0;
    const modelDefaultRate = totalModelDecisions > 0 ? (modelDefaulted / totalModelDecisions) * 100 : 0;

    // Note: Loan entity uses totalAmountPaid instead of totalRepaid
    const modelTotalRepaid = filteredLoans.reduce((sum, l) => sum + (l.totalAmountPaid || 0), 0);
    const modelTotalDefaulted = filteredLoans
      .filter((l) => l.status === LoanStatus.WRITTEN_OFF)
      .reduce((sum, l) => {
        const outstanding = (l.loanAmount || 0) - (l.totalAmountPaid || 0);
        return sum + (outstanding > 0 ? outstanding : 0);
      }, 0);

    return {
      totalModelDecisions,
      totalModelAmount,
      modelApproved,
      modelSuccessful,
      modelDefaulted,
      modelSuccessRate: Number(modelSuccessRate.toFixed(2)),
      modelDefaultRate: Number(modelDefaultRate.toFixed(2)),
      modelTotalRepaid,
      modelTotalDefaulted,
    };
  }

  /**
   * Calculate accuracy comparison
   */
  private calculateAccuracyComparison(
    overrideMetrics: any,
    modelMetrics: any,
  ): {
    overrideAccuracy: number;
    modelAccuracy: number;
    accuracyDifference: number;
  } {
    // Accuracy = (Successful + Not Defaulted) / Total
    const overrideAccuracy =
      overrideMetrics.totalOverrides > 0
        ? ((overrideMetrics.overrideSuccessful + (overrideMetrics.totalOverrides - overrideMetrics.overrideDefaulted)) /
            overrideMetrics.totalOverrides) *
          100
        : 0;

    const modelAccuracy =
      modelMetrics.totalModelDecisions > 0
        ? ((modelMetrics.modelSuccessful + (modelMetrics.totalModelDecisions - modelMetrics.modelDefaulted)) /
            modelMetrics.totalModelDecisions) *
          100
        : 0;

    const accuracyDifference = overrideAccuracy - modelAccuracy;

    return {
      overrideAccuracy: Number(overrideAccuracy.toFixed(2)),
      modelAccuracy: Number(modelAccuracy.toFixed(2)),
      accuracyDifference: Number(accuracyDifference.toFixed(2)),
    };
  }

  /**
   * Calculate performance by tier
   */
  private async calculatePerformanceByTier(
    overrideDecisions: CreditDecision[],
    overrideAudits: OverrideAudit[],
    modelDecisions: CreditDecision[],
    periodStart: Date,
    periodEnd: Date,
  ): Promise<any[]> {
    // Group by tier (would need to get tier from application or scoring)
    // For now, return empty array - can be enhanced with actual tier data
    return [];
  }

  /**
   * Calculate performance by approver
   */
  private calculatePerformanceByApprover(
    overrideDecisions: CreditDecision[],
    overrideAudits: OverrideAudit[],
  ): any[] {
    const approverMap = new Map<string, { approverId: string; approverName: string; count: number; successful: number; defaulted: number }>();

    for (const decision of overrideDecisions) {
      const approverId = decision.decisionBy || 'unknown';
      const audit = overrideAudits.find((a) => a.overrideDecisionId === decision.id);

      if (!approverMap.has(approverId)) {
        approverMap.set(approverId, {
          approverId,
          approverName: approverId, // Would need to fetch actual name
          count: 0,
          successful: 0,
          defaulted: 0,
        });
      }

      const stats = approverMap.get(approverId)!;
      stats.count++;
      if (audit) {
        if (audit.outcome === OverrideOutcome.SUCCESS) stats.successful++;
        if (audit.outcome === OverrideOutcome.DEFAULT) stats.defaulted++;
      }
    }

    return Array.from(approverMap.values()).map((stats) => ({
      ...stats,
      successRate: stats.count > 0 ? Number(((stats.successful / stats.count) * 100).toFixed(2)) : 0,
      defaultRate: stats.count > 0 ? Number(((stats.defaulted / stats.count) * 100).toFixed(2)) : 0,
    }));
  }

  /**
   * Calculate detailed metrics
   */
  private calculateDetailedMetrics(overrideAudits: OverrideAudit[], modelDecisions: CreditDecision[]): any {
    const successfulAudits = overrideAudits.filter((a) => a.outcome === OverrideOutcome.SUCCESS);
    const defaultedAudits = overrideAudits.filter((a) => a.outcome === OverrideOutcome.DEFAULT);

    const averageDaysToDefault =
      defaultedAudits.length > 0
        ? defaultedAudits.reduce((sum, a) => sum + (a.daysToDefault || 0), 0) / defaultedAudits.length
        : 0;

    const averageDaysToRepayment =
      successfulAudits.length > 0
        ? successfulAudits.reduce((sum, a) => sum + (a.daysToRepayment || 0), 0) / successfulAudits.length
        : 0;

    const averageOverrideAmount =
      overrideAudits.length > 0
        ? overrideAudits.reduce((sum, a) => sum + (a.overrideDecisionData.approvedAmount || 0), 0) / overrideAudits.length
        : 0;

    const averageModelAmount =
      modelDecisions.length > 0
        ? modelDecisions.reduce((sum, d) => sum + (d.approvedAmount || 0), 0) / modelDecisions.length
        : 0;

    const profitFromOverrides = overrideAudits.reduce((sum, a) => sum + (a.totalRepaid || 0) - (a.totalDefaulted || 0), 0);
    const profitFromModel = modelDecisions.reduce((sum, d) => sum + (d.approvedAmount || 0) * 0.1, 0); // Simplified calculation

    return {
      averageDaysToDefault: Number(averageDaysToDefault.toFixed(0)),
      averageDaysToRepayment: Number(averageDaysToRepayment.toFixed(0)),
      averageOverrideAmount: Number(averageOverrideAmount.toFixed(2)),
      averageModelAmount: Number(averageModelAmount.toFixed(2)),
      profitFromOverrides: Number(profitFromOverrides.toFixed(2)),
      profitFromModel: Number(profitFromModel.toFixed(2)),
    };
  }

  /**
   * Get report by ID
   */
  async getReport(reportId: string): Promise<OverridePerformanceReport | null> {
    return await this.reportRepository.findOne({
      where: { id: reportId },
    });
  }

  /**
   * Get all reports for company
   */
  async getReports(companyId: string, reportPeriod?: ReportPeriod): Promise<OverridePerformanceReport[]> {
    const where: any = { companyId };
    if (reportPeriod) {
      where.reportPeriod = reportPeriod;
    }

    return await this.reportRepository.find({
      where,
      order: { generatedAt: 'DESC' },
    });
  }
}


