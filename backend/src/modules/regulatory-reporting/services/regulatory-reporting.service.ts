import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan, Between } from 'typeorm';
import { RegulatoryReport, ReportType, ReportStatus, Jurisdiction } from '../entities/regulatory-report.entity';
import { ReportSchedule } from '../entities/report-schedule.entity';
import { RegulatoryChange, ImpactLevel } from '../entities/regulatory-change.entity';
import {
  CreateRegulatoryReportDto,
  RegulatoryReport as RegulatoryReportDto,
  CreateReportScheduleDto,
  ComplianceCalendar,
  RegulatoryChange as RegulatoryChangeDto,
} from '../dto/regulatory-reporting.dto';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class RegulatoryReportingService {
  private readonly logger = new Logger(RegulatoryReportingService.name);
  private readonly reportDir = process.env.REGULATORY_REPORT_DIR || './regulatory-reports';

  constructor(
    @InjectRepository(RegulatoryReport)
    private readonly reportRepository: Repository<RegulatoryReport>,
    @InjectRepository(ReportSchedule)
    private readonly scheduleRepository: Repository<ReportSchedule>,
    @InjectRepository(RegulatoryChange)
    private readonly changeRepository: Repository<RegulatoryChange>,
  ) {
    // Ensure report directory exists
    if (!fs.existsSync(this.reportDir)) {
      fs.mkdirSync(this.reportDir, { recursive: true });
    }
  }

  /**
   * Create regulatory report
   */
  async createRegulatoryReport(
    dto: CreateRegulatoryReportDto,
    companyId: string,
  ): Promise<RegulatoryReportDto> {
    this.logger.log(`Creating regulatory report: ${dto.name} for company ${companyId}`);

    const report = this.reportRepository.create({
      companyId,
      name: dto.name,
      type: dto.type,
      jurisdiction: dto.jurisdiction,
      status: ReportStatus.GENERATING,
      startDate: dto.startDate ? new Date(dto.startDate) : undefined,
      endDate: dto.endDate ? new Date(dto.endDate) : undefined,
      dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
      regulatoryAuthority: dto.regulatoryAuthority,
      templateId: dto.templateId,
      parameters: dto.parameters,
    });

    const saved = await this.reportRepository.save(report);

    // Generate report asynchronously
    this.generateReport(saved).catch((error) => {
      this.logger.error(`Report generation failed: ${error.message}`, error.stack);
      saved.status = ReportStatus.FAILED;
      saved.errorMessage = error.message;
      this.reportRepository.save(saved);
    });

    return this.mapToDto(saved);
  }

  /**
   * Get regulatory reports
   */
  async getRegulatoryReports(
    companyId: string,
    type?: ReportType,
    status?: ReportStatus,
  ): Promise<RegulatoryReportDto[]> {
    const where: any = { companyId };
    if (type) {
      where.type = type;
    }
    if (status) {
      where.status = status;
    }

    const reports = await this.reportRepository.find({
      where,
      order: { dueDate: 'ASC', createdAt: 'DESC' },
    });

    return reports.map((r) => this.mapToDto(r));
  }

  /**
   * Approve report
   */
  async approveReport(
    reportId: string,
    companyId: string,
    approvedBy: string,
  ): Promise<void> {
    const report = await this.reportRepository.findOne({
      where: { id: reportId, companyId },
    });

    if (!report) {
      throw new Error(`Report ${reportId} not found`);
    }

    if (report.status !== ReportStatus.COMPLETED && report.status !== ReportStatus.REVIEWED) {
      throw new Error(`Report must be COMPLETED or REVIEWED to approve`);
    }

    report.status = ReportStatus.APPROVED;
    report.approvedBy = approvedBy;
    report.approvedAt = new Date();

    await this.reportRepository.save(report);

    this.logger.log(`Report ${reportId} approved by ${approvedBy}`);
  }

  /**
   * Submit report
   */
  async submitReport(
    reportId: string,
    companyId: string,
    submissionReference?: string,
  ): Promise<void> {
    const report = await this.reportRepository.findOne({
      where: { id: reportId, companyId },
    });

    if (!report) {
      throw new Error(`Report ${reportId} not found`);
    }

    if (report.status !== ReportStatus.APPROVED) {
      throw new Error(`Report must be APPROVED to submit`);
    }

    // In production, would submit to regulatory authority API
    // For now, just mark as submitted

    report.status = ReportStatus.SUBMITTED;
    report.submittedAt = new Date();
    report.submissionReference = submissionReference || `REF-${Date.now()}`;

    await this.reportRepository.save(report);

    this.logger.log(`Report ${reportId} submitted with reference ${report.submissionReference}`);
  }

  /**
   * Create report schedule
   */
  async createReportSchedule(
    dto: CreateReportScheduleDto,
    companyId: string,
  ): Promise<ReportSchedule> {
    const schedule = this.scheduleRepository.create({
      companyId,
      name: dto.name,
      type: dto.type,
      jurisdiction: dto.jurisdiction,
      cronExpression: dto.cronExpression,
      daysBeforeDue: dto.daysBeforeDue || 7,
      autoSubmit: dto.autoSubmit || false,
      notificationEmails: dto.notificationEmails || [],
      isActive: true,
    });

    return await this.scheduleRepository.save(schedule);
  }

  /**
   * Get compliance calendar
   */
  async getComplianceCalendar(companyId: string): Promise<ComplianceCalendar> {
    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    // Upcoming reports (due in next 30 days)
    const upcomingReports = await this.reportRepository.find({
      where: {
        companyId,
        dueDate: Between(now, thirtyDaysFromNow) as any,
        status: Between(ReportStatus.DRAFT, ReportStatus.APPROVED) as any,
      },
      order: { dueDate: 'ASC' },
      take: 20,
    });

    // Overdue reports
    const overdueReports = await this.reportRepository.find({
      where: {
        companyId,
        dueDate: LessThan(now) as any,
        status: Between(ReportStatus.DRAFT, ReportStatus.APPROVED) as any,
      },
      order: { dueDate: 'ASC' },
      take: 20,
    });

    // Recent submissions (last 30 days)
    const recentSubmissions = await this.reportRepository.find({
      where: {
        companyId,
        status: ReportStatus.SUBMITTED,
        submittedAt: Between(
          new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
          now,
        ) as any,
      },
      order: { submittedAt: 'DESC' },
      take: 20,
    });

    return {
      upcomingReports: upcomingReports.map((r) => ({
        id: r.id,
        name: r.name,
        type: r.type,
        dueDate: r.dueDate?.toISOString().split('T')[0] || '',
        daysUntilDue: r.dueDate
          ? Math.ceil((r.dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
          : 0,
        status: r.status,
      })),
      overdueReports: overdueReports.map((r) => ({
        id: r.id,
        name: r.name,
        type: r.type,
        dueDate: r.dueDate?.toISOString().split('T')[0] || '',
        daysOverdue: r.dueDate
          ? Math.ceil((now.getTime() - r.dueDate.getTime()) / (1000 * 60 * 60 * 24))
          : 0,
        status: r.status,
      })),
      recentSubmissions: recentSubmissions.map((r) => ({
        id: r.id,
        name: r.name,
        type: r.type,
        submittedAt: r.submittedAt?.toISOString() || '',
        status: r.status,
      })),
    };
  }

  /**
   * Create regulatory change
   */
  async createRegulatoryChange(
    jurisdiction: Jurisdiction,
    title: string,
    description: string,
    effectiveDate: Date,
    impactLevel: ImpactLevel,
    affectedReports: string[],
    companyId: string,
  ): Promise<RegulatoryChange> {
    const change = this.changeRepository.create({
      companyId,
      jurisdiction,
      title,
      description,
      effectiveDate,
      impactLevel,
      affectedReports,
    });

    return await this.changeRepository.save(change);
  }

  /**
   * Get regulatory changes
   */
  async getRegulatoryChanges(
    companyId: string,
    jurisdiction?: Jurisdiction,
  ): Promise<RegulatoryChangeDto[]> {
    const where: any = { companyId };
    if (jurisdiction) {
      where.jurisdiction = jurisdiction;
    }

    const changes = await this.changeRepository.find({
      where,
      order: { effectiveDate: 'DESC', createdAt: 'DESC' },
    });

    return changes.map((c) => ({
      id: c.id,
      jurisdiction: c.jurisdiction,
      title: c.title,
      description: c.description,
      effectiveDate: c.effectiveDate.toISOString().split('T')[0],
      impactLevel: c.impactLevel,
      affectedReports: c.affectedReports,
      createdAt: c.createdAt.toISOString(),
    }));
  }

  // Private helper methods

  private async generateReport(report: RegulatoryReport): Promise<void> {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const fileName = `report-${report.companyId}-${timestamp}.pdf`;
      const filePath = path.join(this.reportDir, fileName);

      // In production, would use actual report generation library
      // For now, create a placeholder file
      const reportData = {
        name: report.name,
        type: report.type,
        jurisdiction: report.jurisdiction,
        startDate: report.startDate?.toISOString(),
        endDate: report.endDate?.toISOString(),
        generatedAt: new Date().toISOString(),
        data: this.generateReportData(report),
      };

      fs.writeFileSync(filePath, JSON.stringify(reportData, null, 2));

      const stats = fs.statSync(filePath);

      report.status = ReportStatus.COMPLETED;
      report.filePath = filePath;
      report.fileSize = stats.size;
      report.reportData = reportData;

      await this.reportRepository.save(report);

      this.logger.log(`Regulatory report generated: ${report.name} (${filePath})`);
    } catch (error: any) {
      report.status = ReportStatus.FAILED;
      report.errorMessage = error.message;
      await this.reportRepository.save(report);
      throw error;
    }
  }

  private generateReportData(report: RegulatoryReport): Record<string, any> {
    // In production, would query actual data based on report type
    return {
      summary: {
        totalLoans: 150,
        totalAmount: 5000000,
        activeLoans: 120,
        defaultedLoans: 5,
      },
      compliance: {
        kycCompliance: 98.5,
        amlCompliance: 99.2,
        dataPrivacy: 100,
      },
      risk: {
        npaRatio: 3.3,
        provisionCoverage: 85,
        capitalAdequacy: 12.5,
      },
    };
  }

  private mapToDto(report: RegulatoryReport): RegulatoryReportDto {
    return {
      id: report.id,
      name: report.name,
      type: report.type,
      jurisdiction: report.jurisdiction,
      status: report.status,
      startDate: report.startDate?.toISOString().split('T')[0],
      endDate: report.endDate?.toISOString().split('T')[0],
      dueDate: report.dueDate?.toISOString().split('T')[0],
      filePath: report.filePath,
      fileSize: report.fileSize,
      createdAt: report.createdAt.toISOString(),
      submittedAt: report.submittedAt?.toISOString(),
    };
  }
}

