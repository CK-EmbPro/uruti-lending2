import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { ComplianceCheck, ComplianceCheckStatus } from '../../compliance/entities/compliance-check.entity';
import { KYCScreening, ScreeningStatus } from '../../compliance/entities/kyc-screening.entity';
import { AuditLog } from '../../compliance/entities/audit-log.entity';
import { DocumentRetention } from '../../compliance/entities/document-retention.entity';
import {
  ComplianceMonitoringDto,
  ComplianceMonitoringResult,
  ComplianceRiskLevel,
  ComplianceCheckType,
  ComplianceAlertDto,
} from '../dto/compliance-monitoring.dto';

@Injectable()
export class ComplianceMonitoringService {
  private readonly logger = new Logger(ComplianceMonitoringService.name);

  constructor(
    @InjectRepository(ComplianceCheck)
    private readonly complianceCheckRepository: Repository<ComplianceCheck>,
    @InjectRepository(KYCScreening)
    private readonly kycScreeningRepository: Repository<KYCScreening>,
    @InjectRepository(AuditLog)
    private readonly auditLogRepository: Repository<AuditLog>,
    @InjectRepository(DocumentRetention)
    private readonly documentRetentionRepository: Repository<DocumentRetention>,
  ) {}

  /**
   * Get comprehensive compliance monitoring dashboard
   */
  async getComplianceMonitoring(
    dto: ComplianceMonitoringDto,
    companyId: string,
  ): Promise<ComplianceMonitoringResult> {
    this.logger.log(`Generating compliance monitoring for company ${companyId}`);

    const startDate = dto.startDate ? new Date(dto.startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const endDate = dto.endDate ? new Date(dto.endDate) : new Date();

    // Get all compliance checks
    const where: any = {};
    if (dto.checkType) {
      where.checkType = dto.checkType;
    }
    // Note: ComplianceCheck entity may not have companyId directly
    // Filtering by company would need to be done via entity relationships

    const checks = await this.complianceCheckRepository.find({
      where,
      order: { createdAt: 'DESC' },
    });

    // Filter by date range
    const filteredChecks = checks.filter((check) => {
      const checkDate = new Date(check.createdAt);
      return checkDate >= startDate && checkDate <= endDate;
    });

    // Calculate overall metrics
    const totalChecks = filteredChecks.length;
    const passedChecks = filteredChecks.filter((c) => c.status === 'PASSED').length;
    const failedChecks = filteredChecks.filter((c) => c.status === 'FAILED').length;
    const pendingChecks = filteredChecks.filter((c) => c.status === 'PENDING').length;

    // Calculate overall score
    const overallScore = totalChecks > 0 ? Math.round((passedChecks / totalChecks) * 100) : 100;

    // Count issues by risk level (using compliance score as proxy)
    const criticalIssues = filteredChecks.filter((c) => c.status === 'FAILED' && (c.complianceScore || 0) < 40).length;
    const highRiskIssues = filteredChecks.filter((c) => c.status === 'FAILED' && (c.complianceScore || 0) >= 40 && (c.complianceScore || 0) < 60).length;

    // Determine overall risk level
    const overallRiskLevel = this.determineOverallRiskLevel(overallScore, criticalIssues, highRiskIssues);

    // Breakdown by type
    const breakdownByType = this.calculateBreakdownByType(filteredChecks);

    // Risk breakdown
    const riskBreakdown = this.calculateRiskBreakdown(filteredChecks);

    // Recent issues
    const recentIssues = this.getRecentIssues(filteredChecks);

    // Trend data (last 30 days)
    const trendData = await this.calculateTrendData(companyId, startDate, endDate);

    return {
      overallScore,
      overallRiskLevel,
      totalChecks,
      passedChecks,
      failedChecks,
      pendingChecks,
      criticalIssues,
      highRiskIssues,
      breakdownByType,
      riskBreakdown,
      recentIssues,
      trendData,
    };
  }

  /**
   * Get compliance alerts
   */
  async getComplianceAlerts(
    companyId: string,
    limit: number = 50,
  ): Promise<ComplianceAlertDto[]> {
    // Get failed compliance checks
    // Note: Filtering by companyId may need to be done via entity relationships
    const failedChecks = await this.complianceCheckRepository.find({
      where: {
        status: 'FAILED' as any,
      },
      order: { checkedAt: 'DESC' },
      take: limit,
    });

    // Get failed KYC screenings
    const failedKYC = await this.kycScreeningRepository.find({
      where: {
        matchSeverity: 'HIGH' as any,
      },
      order: { createdAt: 'DESC' },
      take: limit,
    });

    const alerts: ComplianceAlertDto[] = [];

    // Convert checks to alerts
    for (const check of failedChecks) {
      const riskLevel = this.determineRiskLevelFromScore(check.complianceScore || 0);
      alerts.push({
        id: check.id,
        type: this.mapCheckTypeToComplianceType(check.checkType),
        riskLevel,
        title: `Compliance Check Failed: ${check.checkType}`,
        description: check.description || `Compliance check failed for ${check.entityType}`,
        entityId: check.entityId,
        entityType: check.entityType,
        isAcknowledged: false,
        createdAt: check.checkedAt.toISOString(),
      });
    }

    // Convert KYC screenings to alerts
    for (const kyc of failedKYC) {
      alerts.push({
        id: kyc.id,
        type: ComplianceCheckType.KYC,
        riskLevel: this.mapSeverityToRiskLevel(kyc.matchSeverity),
        title: 'KYC Screening Match Detected',
        description: `KYC screening detected match: ${kyc.screeningType} - ${kyc.matchSeverity || 'Unknown'}`,
        entityId: kyc.applicationId,
        entityType: 'LoanApplication',
        isAcknowledged: kyc.status === ScreeningStatus.CLEARED || kyc.status === ScreeningStatus.FALSE_POSITIVE,
        createdAt: kyc.createdAt.toISOString(),
      });
    }

    // Sort by risk level and date
    alerts.sort((a, b) => {
      const riskOrder = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
      const riskDiff = riskOrder[a.riskLevel] - riskOrder[b.riskLevel];
      if (riskDiff !== 0) return riskDiff;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    return alerts.slice(0, limit);
  }

  /**
   * Calculate compliance score for entity
   */
  async calculateEntityComplianceScore(
    entityId: string,
    entityType: string,
    companyId: string,
  ): Promise<{
    score: number;
    riskLevel: ComplianceRiskLevel;
    checks: Array<{
      type: ComplianceCheckType;
      status: string;
      riskLevel: ComplianceRiskLevel;
      description: string;
    }>;
  }> {
    const checks = await this.complianceCheckRepository.find({
      where: {
        entityId,
        entityType,
      },
    });

    if (checks.length === 0) {
      return {
        score: 100,
        riskLevel: ComplianceRiskLevel.LOW,
        checks: [],
      };
    }

    const passed = checks.filter((c) => c.status === 'PASSED').length;
    const score = Math.round((passed / checks.length) * 100);

    const riskLevel = this.determineOverallRiskLevel(
      score,
      checks.filter((c) => (c.complianceScore || 100) < 50 && c.status === ComplianceCheckStatus.FAILED).length,
      checks.filter((c) => (c.complianceScore || 100) < 70 && c.status === ComplianceCheckStatus.FAILED).length,
    );

    return {
      score,
      riskLevel,
      checks: checks.map((c) => ({
        type: this.mapCheckTypeToComplianceType(c.checkType),
        status: c.status,
        riskLevel: this.determineRiskLevelFromScore(c.complianceScore || 100),
        description: c.description || '',
      })),
    };
  }

  /**
   * Calculate breakdown by type
   */
  private calculateBreakdownByType(checks: ComplianceCheck[]): Record<ComplianceCheckType, {
    total: number;
    passed: number;
    failed: number;
    score: number;
  }> {
    const breakdown: Record<string, { total: number; passed: number; failed: number }> = {};

    for (const check of checks) {
      const type = this.mapCheckTypeToComplianceType(check.checkType);
      if (!breakdown[type]) {
        breakdown[type] = { total: 0, passed: 0, failed: 0 };
      }
      breakdown[type].total++;
      if (check.status === 'PASSED') {
        breakdown[type].passed++;
      } else if (check.status === 'FAILED') {
        breakdown[type].failed++;
      }
    }

    const result: Record<ComplianceCheckType, {
      total: number;
      passed: number;
      failed: number;
      score: number;
    }> = {} as any;

    for (const type of Object.values(ComplianceCheckType)) {
      const data = breakdown[type] || { total: 0, passed: 0, failed: 0 };
      result[type] = {
        ...data,
        score: data.total > 0 ? Math.round((data.passed / data.total) * 100) : 100,
      };
    }

    return result;
  }

  /**
   * Calculate risk breakdown
   */
  private calculateRiskBreakdown(checks: ComplianceCheck[]): Record<ComplianceRiskLevel, number> {
    const breakdown: Record<ComplianceRiskLevel, number> = {
      [ComplianceRiskLevel.LOW]: 0,
      [ComplianceRiskLevel.MEDIUM]: 0,
      [ComplianceRiskLevel.HIGH]: 0,
      [ComplianceRiskLevel.CRITICAL]: 0,
    };

    for (const check of checks) {
      if (check.status === 'FAILED') {
        const riskLevel = this.determineRiskLevelFromScore(check.complianceScore || 0);
        breakdown[riskLevel]++;
      }
    }

    return breakdown;
  }

  /**
   * Get recent issues
   */
  private getRecentIssues(checks: ComplianceCheck[]): Array<{
    id: string;
    type: ComplianceCheckType;
    riskLevel: ComplianceRiskLevel;
    description: string;
    detectedAt: string;
    status: string;
  }> {
    return checks
      .filter((c) => c.status === 'FAILED')
      .slice(0, 10)
      .map((c) => ({
        id: c.id,
        type: this.mapCheckTypeToComplianceType(c.checkType),
        riskLevel: this.determineRiskLevelFromScore(c.complianceScore || 0),
        description: c.description || `Compliance check failed: ${c.checkType}`,
        detectedAt: c.checkedAt.toISOString(),
        status: c.status,
      }));
  }

  /**
   * Calculate trend data
   */
  private async calculateTrendData(
    companyId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<Array<{
    date: string;
    score: number;
    checks: number;
    passed: number;
    failed: number;
  }>> {
    const checks = await this.complianceCheckRepository.find({
      where: {
        checkedAt: Between(startDate, endDate) as any,
      },
    });

    // Group by date
    const byDate: Record<string, { checks: ComplianceCheck[] }> = {};

    for (const check of checks) {
      const date = check.createdAt.toISOString().split('T')[0];
      if (!byDate[date]) {
        byDate[date] = { checks: [] };
      }
      byDate[date].checks.push(check);
    }

    const trendData = Object.entries(byDate).map(([date, data]) => {
      const total = data.checks.length;
      const passed = data.checks.filter((c) => c.status === 'PASSED').length;
      const failed = data.checks.filter((c) => c.status === 'FAILED').length;
      const score = total > 0 ? Math.round((passed / total) * 100) : 100;

      return {
        date,
        score,
        checks: total,
        passed,
        failed,
      };
    });

    return trendData.sort((a, b) => a.date.localeCompare(b.date));
  }

  /**
   * Determine overall risk level
   */
  private determineOverallRiskLevel(
    score: number,
    criticalIssues: number,
    highRiskIssues: number,
  ): ComplianceRiskLevel {
    if (criticalIssues > 0 || score < 60) {
      return ComplianceRiskLevel.CRITICAL;
    } else if (highRiskIssues > 0 || score < 75) {
      return ComplianceRiskLevel.HIGH;
    } else if (score < 90) {
      return ComplianceRiskLevel.MEDIUM;
    } else {
      return ComplianceRiskLevel.LOW;
    }
  }

  /**
   * Map severity to risk level
   */
  private mapSeverityToRiskLevel(severity: string): ComplianceRiskLevel {
    if (severity === 'CRITICAL' || severity === 'HIGH') {
      return ComplianceRiskLevel.HIGH;
    } else if (severity === 'MEDIUM') {
      return ComplianceRiskLevel.MEDIUM;
    } else {
      return ComplianceRiskLevel.LOW;
    }
  }

  /**
   * Determine risk level from compliance score
   */
  private determineRiskLevelFromScore(score: number): ComplianceRiskLevel {
    if (score < 40) {
      return ComplianceRiskLevel.CRITICAL;
    } else if (score < 60) {
      return ComplianceRiskLevel.HIGH;
    } else if (score < 80) {
      return ComplianceRiskLevel.MEDIUM;
    } else {
      return ComplianceRiskLevel.LOW;
    }
  }

  /**
   * Map ComplianceCheckType to ComplianceCheckType enum
   */
  private mapCheckTypeToComplianceType(checkType: any): ComplianceCheckType {
    // Map internal check types to monitoring check types
    if (checkType === 'KYC_AML') {
      return ComplianceCheckType.KYC;
    } else if (checkType === 'DATA_PRIVACY') {
      return ComplianceCheckType.PRIVACY;
    } else if (checkType === 'DOCUMENT_COMPLIANCE') {
      return ComplianceCheckType.DOCUMENT;
    } else if (checkType === 'REGULATORY_COMPLIANCE') {
      return ComplianceCheckType.REGULATORY;
    } else if (checkType === 'REPORTING_COMPLIANCE') {
      return ComplianceCheckType.AUDIT;
    } else {
      return ComplianceCheckType.REGULATORY; // Default
    }
  }
}

