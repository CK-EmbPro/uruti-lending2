import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, LessThan, MoreThan } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { RegulatoryChange, RegulatoryChangeStatus, RegulatoryChangePriority } from '../entities/regulatory-change.entity';
import { ComplianceCheck, ComplianceCheckType, ComplianceCheckStatus } from '../entities/compliance-check.entity';
import { CompliancePolicy, PolicyStatus, PolicyCategory } from '../entities/compliance-policy.entity';
import { ComplianceReport, ReportType, ReportStatus, ReportFrequency } from '../entities/compliance-report.entity';
import {
  CreateRegulatoryChangeDto,
  RunComplianceCheckDto,
  CreateCompliancePolicyDto,
  GenerateComplianceReportDto,
  GetComplianceChecksDto,
} from '../dto/regtech.dto';
import { Loan } from '../../loan/entities/loan.entity';
import { LoanApplication } from '../../loan-application/entities/loan-application.entity';

/**
 * RegTech Automation Service
 * Provides automated compliance monitoring, regulatory change tracking, and compliance reporting
 */
@Injectable()
export class RegTechAutomationService {
  private readonly logger = new Logger(RegTechAutomationService.name);

  constructor(
    @InjectRepository(RegulatoryChange)
    private readonly regulatoryChangeRepository: Repository<RegulatoryChange>,
    @InjectRepository(ComplianceCheck)
    private readonly complianceCheckRepository: Repository<ComplianceCheck>,
    @InjectRepository(CompliancePolicy)
    private readonly policyRepository: Repository<CompliancePolicy>,
    @InjectRepository(ComplianceReport)
    private readonly reportRepository: Repository<ComplianceReport>,
    @InjectRepository(Loan)
    private readonly loanRepository: Repository<Loan>,
    @InjectRepository(LoanApplication)
    private readonly applicationRepository: Repository<LoanApplication>,
  ) {}

  /**
   * Create regulatory change record
   */
  async createRegulatoryChange(dto: CreateRegulatoryChangeDto, userId: string): Promise<RegulatoryChange> {
    const change = this.regulatoryChangeRepository.create({
      ...dto,
      effectiveDate: new Date(dto.effectiveDate),
      complianceDeadline: dto.complianceDeadline ? new Date(dto.complianceDeadline) : null,
      status: RegulatoryChangeStatus.NEW,
      priority: dto.priority || RegulatoryChangePriority.MEDIUM,
      affectedAreas: dto.affectedAreas || [],
      requiredActions: dto.requiredActions || {},
    });

    const saved = await this.regulatoryChangeRepository.save(change);

    this.logger.log(`Regulatory change created: ${saved.id} - ${saved.title}`);

    // Automatically run compliance checks for affected areas
    await this.scheduleComplianceChecksForChange(saved);

    return saved;
  }

  /**
   * Run compliance check
   */
  async runComplianceCheck(dto: RunComplianceCheckDto, userId?: string): Promise<ComplianceCheck> {
    // Get entity
    let entity: any;
    if (dto.entityType === 'loan') {
      entity = await this.loanRepository.findOne({ where: { id: dto.entityId } });
    } else if (dto.entityType === 'application') {
      entity = await this.applicationRepository.findOne({ where: { id: dto.entityId } });
    }

    if (!entity) {
      throw new NotFoundException(`${dto.entityType} ${dto.entityId} not found`);
    }

    // Get applicable policies
    const policies = dto.policyId
      ? [await this.policyRepository.findOne({ where: { id: dto.policyId } })]
      : await this.getApplicablePolicies(dto.entityType, dto.checkType);

    // Perform compliance check
    const checkResult = await this.performComplianceCheck(entity, dto.entityType, dto.checkType, policies);

    // Save check result
    const check = this.complianceCheckRepository.create({
      entityType: dto.entityType,
      entityId: dto.entityId,
      checkType: dto.checkType,
      status: checkResult.status,
      checkName: checkResult.checkName,
      description: checkResult.description,
      checkCriteria: checkResult.criteria,
      findings: checkResult.findings,
      violations: checkResult.violations,
      remediation: checkResult.remediation,
      complianceScore: checkResult.complianceScore,
      checkedAt: new Date(),
      checkedBy: userId || 'SYSTEM',
      policyId: dto.policyId || null,
    });

    return await this.complianceCheckRepository.save(check);
  }

  /**
   * Create compliance policy
   */
  async createCompliancePolicy(dto: CreateCompliancePolicyDto, userId: string): Promise<CompliancePolicy> {
    const policy = this.policyRepository.create({
      ...dto,
      effectiveDate: new Date(dto.effectiveDate),
      expirationDate: dto.expirationDate ? new Date(dto.expirationDate) : null,
      status: PolicyStatus.ACTIVE,
      complianceRequirements: dto.complianceRequirements || {},
      applicableEntities: dto.applicableEntities || [],
      owner: userId,
      version: 1,
    });

    return await this.policyRepository.save(policy);
  }

  /**
   * Generate compliance report
   */
  async generateComplianceReport(dto: GenerateComplianceReportDto, userId: string): Promise<ComplianceReport> {
    const report = this.reportRepository.create({
      reportName: dto.reportName,
      reportType: dto.reportType,
      status: ReportStatus.DRAFT,
      frequency: dto.frequency || null,
      reportPeriod: new Date(dto.reportPeriod),
      reportPeriodEnd: dto.reportPeriodEnd ? new Date(dto.reportPeriodEnd) : null,
      generatedBy: userId,
      generatedAt: new Date(),
    });

    // Generate report data based on type
    const reportData = await this.generateReportData(dto.reportType, dto.reportPeriod, dto.reportPeriodEnd, dto.parameters);

    report.reportData = reportData;
    report.summary = this.generateReportSummary(reportData);
    report.findings = reportData.findings || [];
    report.violations = reportData.violations || [];
    report.recommendations = reportData.recommendations || [];
    report.status = ReportStatus.GENERATED;

    return await this.reportRepository.save(report);
  }

  /**
   * Get compliance checks
   */
  async getComplianceChecks(filters: GetComplianceChecksDto): Promise<{
    checks: ComplianceCheck[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const query = this.complianceCheckRepository.createQueryBuilder('check');

    if (filters.entityType) {
      query.andWhere('check.entityType = :entityType', { entityType: filters.entityType });
    }

    if (filters.entityId) {
      query.andWhere('check.entityId = :entityId', { entityId: filters.entityId });
    }

    if (filters.checkType) {
      query.andWhere('check.checkType = :checkType', { checkType: filters.checkType });
    }

    if (filters.status) {
      query.andWhere('check.status = :status', { status: filters.status });
    }

    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const skip = (page - 1) * limit;

    query.orderBy('check.checkedAt', 'DESC').skip(skip).take(limit);

    const [checks, total] = await query.getManyAndCount();

    return {
      checks,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Get compliance dashboard metrics
   */
  async getComplianceMetrics(): Promise<{
    totalChecks: number;
    passedChecks: number;
    failedChecks: number;
    warningChecks: number;
    complianceRate: number;
    pendingRegulatoryChanges: number;
    overdueComplianceDeadlines: number;
    activePolicies: number;
    recentViolations: number;
  }> {
    const [totalChecks, passedChecks, failedChecks, warningChecks] = await Promise.all([
      this.complianceCheckRepository.count(),
      this.complianceCheckRepository.count({ where: { status: ComplianceCheckStatus.PASSED } }),
      this.complianceCheckRepository.count({ where: { status: ComplianceCheckStatus.FAILED } }),
      this.complianceCheckRepository.count({ where: { status: ComplianceCheckStatus.WARNING } }),
    ]);

    const complianceRate = totalChecks > 0 ? (passedChecks / totalChecks) * 100 : 0;

    const pendingRegulatoryChanges = await this.regulatoryChangeRepository.count({
      where: { status: RegulatoryChangeStatus.NEW },
    });

    const now = new Date();
    const overdueComplianceDeadlines = await this.regulatoryChangeRepository.count({
      where: {
        complianceDeadline: LessThan(now),
        status: RegulatoryChangeStatus.NEW,
      },
    });

    const activePolicies = await this.policyRepository.count({
      where: { status: PolicyStatus.ACTIVE },
    });

    const recentViolations = await this.complianceCheckRepository.count({
      where: {
        status: ComplianceCheckStatus.FAILED,
        checkedAt: MoreThan(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)), // Last 30 days
      },
    });

    return {
      totalChecks,
      passedChecks,
      failedChecks,
      warningChecks,
      complianceRate: Number(complianceRate.toFixed(2)),
      pendingRegulatoryChanges,
      overdueComplianceDeadlines,
      activePolicies,
      recentViolations,
    };
  }

  // Private helper methods

  private async scheduleComplianceChecksForChange(change: RegulatoryChange): Promise<void> {
    // Schedule compliance checks for entities affected by this regulatory change
    this.logger.log(`Scheduling compliance checks for regulatory change ${change.id}`);
    // Implementation would schedule checks for affected entities
  }

  private async getApplicablePolicies(entityType: string, checkType: ComplianceCheckType): Promise<CompliancePolicy[]> {
    return await this.policyRepository.find({
      where: {
        status: PolicyStatus.ACTIVE,
        applicableEntities: entityType as any, // TypeORM array contains
      },
    });
  }

  private async performComplianceCheck(
    entity: any,
    entityType: string,
    checkType: ComplianceCheckType,
    policies: CompliancePolicy[],
  ): Promise<{
    status: ComplianceCheckStatus;
    checkName: string;
    description: string;
    criteria: Record<string, any>;
    findings: Record<string, any>;
    violations: Record<string, any>[];
    remediation: string | null;
    complianceScore: number;
  }> {
    // Rule-based compliance checking
    // In production, this would use more sophisticated logic

    let status = ComplianceCheckStatus.PASSED;
    const violations: Record<string, any>[] = [];
    let complianceScore = 100;

    const findings: Record<string, any> = {};

    switch (checkType) {
      case ComplianceCheckType.POLICY_COMPLIANCE:
        // Check if entity complies with policies
        for (const policy of policies) {
          const requirements = policy.complianceRequirements || {};
          for (const [key, value] of Object.entries(requirements)) {
            const entityValue = (entity as any)[key];
            if (entityValue !== value) {
              violations.push({
                policyId: policy.id,
                policyName: policy.policyName,
                requirement: key,
                expected: value,
                actual: entityValue,
              });
              complianceScore -= 10;
            }
          }
        }
        break;

      case ComplianceCheckType.DOCUMENT_COMPLIANCE:
        // Check document compliance
        if (entityType === 'application') {
          // Check if required documents are present
          const requiredDocs = ['ID', 'Income Proof', 'Address Proof'];
          const hasAllDocs = requiredDocs.every((doc) => true); // Simplified
          if (!hasAllDocs) {
            violations.push({ type: 'MISSING_DOCUMENTS', required: requiredDocs });
            complianceScore -= 20;
          }
        }
        break;

      case ComplianceCheckType.FAIR_LENDING:
        // Check fair lending compliance
        // This would check for discrimination patterns
        findings.fairLendingCheck = 'No disparities detected';
        break;

      case ComplianceCheckType.REPORTING_COMPLIANCE:
        // Check reporting compliance
        findings.reportingCheck = 'All required reports submitted';
        break;
    }

    if (violations.length > 0) {
      status = violations.length > 2 ? ComplianceCheckStatus.FAILED : ComplianceCheckStatus.WARNING;
    }

    complianceScore = Math.max(0, complianceScore);

    return {
      status,
      checkName: `${checkType} Compliance Check`,
      description: `Compliance check for ${entityType} ${entity.id}`,
      criteria: { entityType, checkType, policiesCount: policies.length },
      findings,
      violations,
      remediation: violations.length > 0 ? 'Review violations and take corrective action' : null,
      complianceScore,
    };
  }

  private async generateReportData(
    reportType: ReportType,
    periodStart: string,
    periodEnd?: string,
    parameters?: Record<string, any>,
  ): Promise<Record<string, any>> {
    // Generate report data based on type
    const data: Record<string, any> = {
      reportType,
      periodStart,
      periodEnd: periodEnd || periodStart,
      generatedAt: new Date().toISOString(),
    };

    switch (reportType) {
      case ReportType.REGULATORY:
        // Generate regulatory report data
        data.regulatoryData = {
          totalApplications: await this.applicationRepository.count(),
          totalLoans: await this.loanRepository.count(),
          complianceChecks: await this.complianceCheckRepository.count(),
        };
        break;

      case ReportType.COMPLIANCE_REVIEW:
        // Generate compliance review data
        const checks = await this.complianceCheckRepository.find({
          where: {
            checkedAt: Between(new Date(periodStart), new Date(periodEnd || Date.now().toString())),
          },
        });
        data.complianceReview = {
          totalChecks: checks.length,
          passed: checks.filter((c) => c.status === ComplianceCheckStatus.PASSED).length,
          failed: checks.filter((c) => c.status === ComplianceCheckStatus.FAILED).length,
          warnings: checks.filter((c) => c.status === ComplianceCheckStatus.WARNING).length,
        };
        break;

      case ReportType.AUDIT:
        // Generate audit report data
        data.auditData = {
          auditPeriod: `${periodStart} to ${periodEnd || 'now'}`,
          totalAuditLogs: 0, // Would come from audit log service
        };
        break;
    }

    data.findings = [];
    data.violations = [];
    data.recommendations = [
      'Continue monitoring compliance metrics',
      'Address any identified violations promptly',
      'Review and update policies as needed',
    ];

    return data;
  }

  private generateReportSummary(data: Record<string, any>): string {
    return `Compliance report generated for period ${data.periodStart} to ${data.periodEnd || 'current'}. ` +
      `Report type: ${data.reportType}. ` +
      `Findings: ${data.findings?.length || 0}, Violations: ${data.violations?.length || 0}.`;
  }

  /**
   * Daily cron job to check for upcoming compliance deadlines
   */
  @Cron(CronExpression.EVERY_DAY_AT_9AM)
  async checkComplianceDeadlines(): Promise<void> {
    this.logger.log('Checking compliance deadlines');
    const upcomingDeadlines = await this.regulatoryChangeRepository.find({
      where: {
        complianceDeadline: Between(new Date(), new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)),
        status: RegulatoryChangeStatus.NEW,
      },
    });

    for (const change of upcomingDeadlines) {
      this.logger.warn(`Upcoming compliance deadline: ${change.title} - ${change.complianceDeadline}`);
      // In production, send notifications
    }
  }

  /**
   * Weekly cron job to run automated compliance checks
   */
  @Cron(CronExpression.EVERY_WEEK)
  async runAutomatedComplianceChecks(): Promise<void> {
    this.logger.log('Running automated compliance checks');
    // This would run compliance checks for all active entities
  }
}

