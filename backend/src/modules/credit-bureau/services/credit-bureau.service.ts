import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreditReport, CreditBureauProvider, CreditReportStatus } from '../entities/credit-report.entity';
import { CreditMonitoring } from '../entities/credit-monitoring.entity';
import { CreditAlert, AlertType, AlertSeverity } from '../entities/credit-alert.entity';
import {
  PullCreditReportDto,
  CreditReport as CreditReportDto,
  EnableCreditMonitoringDto,
  CreditMonitoringAlert,
} from '../dto/credit-bureau.dto';
// Customer entity doesn't exist - using applicantId instead

@Injectable()
export class CreditBureauService {
  private readonly logger = new Logger(CreditBureauService.name);

  constructor(
    @InjectRepository(CreditReport)
    private readonly reportRepository: Repository<CreditReport>,
    @InjectRepository(CreditMonitoring)
    private readonly monitoringRepository: Repository<CreditMonitoring>,
    @InjectRepository(CreditAlert)
    private readonly alertRepository: Repository<CreditAlert>,
    // Customer repository removed - using applicantId from applications/loans
  ) {}

  /**
   * Pull credit report from bureau
   */
  async pullCreditReport(
    dto: PullCreditReportDto,
    companyId: string,
  ): Promise<CreditReportDto> {
    this.logger.log(`Pulling credit report for customer ${dto.customerId} from ${dto.provider}`);

    // Customer entity doesn't exist - using applicantId
    // dto.customerId is actually applicantId
    const customer = { id: dto.customerId } as any; // Minimal customer object

    // Create report record
    const report = this.reportRepository.create({
      companyId,
      customerId: dto.customerId,
      applicationId: dto.applicationId,
      provider: dto.provider,
      status: CreditReportStatus.IN_PROGRESS,
    });

    const saved = await this.reportRepository.save(report);

    // Pull credit report asynchronously
    this.performCreditPull(saved, customer, dto, companyId).catch((error) => {
      this.logger.error(`Credit pull failed: ${error.message}`, error.stack);
      saved.status = CreditReportStatus.FAILED;
      saved.errorMessage = error.message;
      this.reportRepository.save(saved);
    });

    return this.mapToDto(saved);
  }

  /**
   * Get credit report
   */
  async getCreditReport(
    reportId: string,
    companyId: string,
  ): Promise<CreditReportDto> {
    const report = await this.reportRepository.findOne({
      where: { id: reportId, companyId },
    });

    if (!report) {
      throw new Error(`Credit report ${reportId} not found`);
    }

    return this.mapToDto(report);
  }

  /**
   * Get latest credit report for customer
   */
  async getLatestCreditReport(
    customerId: string,
    companyId: string,
  ): Promise<CreditReportDto | null> {
    const report = await this.reportRepository.findOne({
      where: { customerId, companyId, status: CreditReportStatus.COMPLETED },
      order: { pulledAt: 'DESC' },
    });

    if (!report) {
      return null;
    }

    // Check if expired
    if (report.expiresAt && report.expiresAt.getTime() < Date.now()) {
      report.status = CreditReportStatus.EXPIRED;
      await this.reportRepository.save(report);
      return null;
    }

    return this.mapToDto(report);
  }

  /**
   * Enable/disable credit monitoring
   */
  async enableCreditMonitoring(
    dto: EnableCreditMonitoringDto,
    companyId: string,
  ): Promise<void> {
    let monitoring = await this.monitoringRepository.findOne({
      where: { customerId: dto.customerId, companyId },
    });

    if (!monitoring) {
      monitoring = this.monitoringRepository.create({
        companyId,
        customerId: dto.customerId,
        isEnabled: dto.enabled,
        alertPreferences: dto.alertPreferences || {},
      });
    } else {
      monitoring.isEnabled = dto.enabled;
      if (dto.alertPreferences) {
        monitoring.alertPreferences = dto.alertPreferences;
      }
    }

    if (dto.enabled) {
      monitoring.nextCheckAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // Check daily
    }

    await this.monitoringRepository.save(monitoring);

    this.logger.log(`Credit monitoring ${dto.enabled ? 'enabled' : 'disabled'} for customer ${dto.customerId}`);
  }

  /**
   * Get credit alerts
   */
  async getCreditAlerts(
    customerId: string,
    companyId: string,
    unreadOnly: boolean = false,
  ): Promise<CreditMonitoringAlert[]> {
    const where: any = { customerId, companyId };
    if (unreadOnly) {
      where.isRead = false;
    }

    const alerts = await this.alertRepository.find({
      where,
      order: { createdAt: 'DESC' },
      take: 50,
    });

    return alerts.map((a) => ({
      id: a.id,
      customerId: a.customerId,
      alertType: a.alertType,
      message: a.message,
      severity: a.severity,
      createdAt: a.createdAt.toISOString(),
    }));
  }

  /**
   * Mark alert as read
   */
  async markAlertAsRead(alertId: string, companyId: string): Promise<void> {
    const alert = await this.alertRepository.findOne({
      where: { id: alertId, companyId },
    });

    if (alert) {
      alert.isRead = true;
      await this.alertRepository.save(alert);
    }
  }

  // Private helper methods

  private async performCreditPull(
    report: CreditReport,
    customer: any, // Customer entity doesn't exist
    dto: PullCreditReportDto,
    companyId: string,
  ): Promise<void> {
    try {
      // In production, this would call actual credit bureau APIs
      // For now, we'll simulate the pull with realistic data

      let creditData: any;

      switch (report.provider) {
        case CreditBureauProvider.EXPERIAN:
          creditData = await this.pullFromExperian(customer, dto);
          break;
        case CreditBureauProvider.EQUIFAX:
          creditData = await this.pullFromEquifax(customer, dto);
          break;
        case CreditBureauProvider.TRANSUNION:
          creditData = await this.pullFromTransUnion(customer, dto);
          break;
        case CreditBureauProvider.MULTI_BUREAU:
          // Pull from all three and merge
          const [experian, equifax, transunion] = await Promise.all([
            this.pullFromExperian(customer, dto),
            this.pullFromEquifax(customer, dto),
            this.pullFromTransUnion(customer, dto),
          ]);
          creditData = this.mergeBureauReports([experian, equifax, transunion]);
          break;
      }

      // Parse and store credit data
      report.status = CreditReportStatus.COMPLETED;
      report.creditScore = creditData.creditScore;
      report.scoreRange = creditData.scoreRange || { min: 300, max: 850 };
      report.creditFactors = creditData.creditFactors;
      report.accountsSummary = creditData.accountsSummary;
      report.paymentHistory = creditData.paymentHistory;
      report.inquiries = creditData.inquiries || [];
      report.publicRecords = creditData.publicRecords || [];
      report.rawReportData = creditData.rawData;
      report.pulledAt = new Date();
      report.expiresAt = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000); // 90 days validity

      await this.reportRepository.save(report);

      // Check for monitoring alerts
      await this.checkMonitoringAlerts(report, companyId);

      this.logger.log(`Credit report pulled successfully: ${report.id}`);
    } catch (error: any) {
      report.status = CreditReportStatus.FAILED;
      report.errorMessage = error.message;
      await this.reportRepository.save(report);
      throw error;
    }
  }

  private async pullFromExperian(customer: any, dto: PullCreditReportDto): Promise<any> {
    // In production, would call Experian API
    // Example: await this.experianClient.getCreditReport({ ssn: dto.ssn, dob: dto.dateOfBirth })
    
    // Simulated data
    return {
      creditScore: 750,
      scoreRange: { min: 300, max: 850 },
      creditFactors: {
        paymentHistory: 95,
        creditUtilization: 30,
        creditAge: 72,
        creditMix: 80,
        newCredit: 65,
      },
      accountsSummary: {
        totalAccounts: 8,
        openAccounts: 5,
        closedAccounts: 3,
        totalDebt: 25000,
        availableCredit: 50000,
        creditUtilization: 33.3,
      },
      paymentHistory: {
        onTimePayments: 48,
        latePayments30: 2,
        latePayments60: 0,
        latePayments90: 0,
        collections: 0,
        bankruptcies: 0,
      },
      inquiries: [
        { date: '2024-01-10', creditor: 'Bank ABC', type: 'HARD' },
      ],
      publicRecords: [],
      rawData: { provider: 'EXPERIAN', pulledAt: new Date().toISOString() },
    };
  }

  private async pullFromEquifax(customer: any, dto: PullCreditReportDto): Promise<any> {
    // In production, would call Equifax API
    return {
      creditScore: 745,
      scoreRange: { min: 280, max: 850 },
      creditFactors: {
        paymentHistory: 94,
        creditUtilization: 32,
        creditAge: 70,
        creditMix: 78,
        newCredit: 63,
      },
      accountsSummary: {
        totalAccounts: 8,
        openAccounts: 5,
        closedAccounts: 3,
        totalDebt: 25000,
        availableCredit: 50000,
        creditUtilization: 33.3,
      },
      paymentHistory: {
        onTimePayments: 48,
        latePayments30: 2,
        latePayments60: 0,
        latePayments90: 0,
        collections: 0,
        bankruptcies: 0,
      },
      inquiries: [
        { date: '2024-01-10', creditor: 'Bank ABC', type: 'HARD' },
      ],
      publicRecords: [],
      rawData: { provider: 'EQUIFAX', pulledAt: new Date().toISOString() },
    };
  }

  private async pullFromTransUnion(customer: any, dto: PullCreditReportDto): Promise<any> {
    // In production, would call TransUnion API
    return {
      creditScore: 752,
      scoreRange: { min: 300, max: 850 },
      creditFactors: {
        paymentHistory: 96,
        creditUtilization: 29,
        creditAge: 74,
        creditMix: 82,
        newCredit: 67,
      },
      accountsSummary: {
        totalAccounts: 8,
        openAccounts: 5,
        closedAccounts: 3,
        totalDebt: 25000,
        availableCredit: 50000,
        creditUtilization: 33.3,
      },
      paymentHistory: {
        onTimePayments: 48,
        latePayments30: 2,
        latePayments60: 0,
        latePayments90: 0,
        collections: 0,
        bankruptcies: 0,
      },
      inquiries: [
        { date: '2024-01-10', creditor: 'Bank ABC', type: 'HARD' },
      ],
      publicRecords: [],
      rawData: { provider: 'TRANSUNION', pulledAt: new Date().toISOString() },
    };
  }

  private mergeBureauReports(reports: any[]): any {
    // Merge multiple bureau reports, taking average scores and combining data
    const avgScore = Math.round(
      reports.reduce((sum, r) => sum + r.creditScore, 0) / reports.length,
    );

    const mergedFactors = {
      paymentHistory: Math.round(
        reports.reduce((sum, r) => sum + r.creditFactors.paymentHistory, 0) / reports.length,
      ),
      creditUtilization: Math.round(
        reports.reduce((sum, r) => sum + r.creditFactors.creditUtilization, 0) / reports.length,
      ),
      creditAge: Math.round(
        reports.reduce((sum, r) => sum + r.creditFactors.creditAge, 0) / reports.length,
      ),
      creditMix: Math.round(
        reports.reduce((sum, r) => sum + r.creditFactors.creditMix, 0) / reports.length,
      ),
      newCredit: Math.round(
        reports.reduce((sum, r) => sum + r.creditFactors.newCredit, 0) / reports.length,
      ),
    };

    // Combine unique inquiries
    const allInquiries = reports.flatMap((r) => r.inquiries || []);
    const uniqueInquiries = Array.from(
      new Map(allInquiries.map((i) => [`${i.date}-${i.creditor}`, i])).values(),
    );

    // Combine public records
    const allPublicRecords = reports.flatMap((r) => r.publicRecords || []);
    const uniquePublicRecords = Array.from(
      new Map(allPublicRecords.map((r) => [`${r.type}-${r.date}`, r])).values(),
    );

    return {
      creditScore: avgScore,
      scoreRange: { min: 300, max: 850 },
      creditFactors: mergedFactors,
      accountsSummary: reports[0].accountsSummary, // Use first report's summary
      paymentHistory: reports[0].paymentHistory, // Use first report's history
      inquiries: uniqueInquiries,
      publicRecords: uniquePublicRecords,
      rawData: {
        providers: reports.map((r) => r.rawData.provider),
        mergedAt: new Date().toISOString(),
      },
    };
  }

  private async checkMonitoringAlerts(
    report: CreditReport,
    companyId: string,
  ): Promise<void> {
    const monitoring = await this.monitoringRepository.findOne({
      where: { customerId: report.customerId, companyId, isEnabled: true },
    });

    if (!monitoring) {
      return;
    }

    // Check for score changes
    if (monitoring.lastScore !== null && report.creditScore) {
      const scoreChange = report.creditScore - monitoring.lastScore;
      const threshold = monitoring.alertPreferences?.scoreChangeThreshold || 10;

      if (Math.abs(scoreChange) >= threshold) {
        await this.createAlert(
          report.customerId,
          companyId,
          AlertType.SCORE_CHANGE,
          `Credit score ${scoreChange > 0 ? 'increased' : 'decreased'} by ${Math.abs(scoreChange)} points`,
          scoreChange < 0 ? AlertSeverity.MEDIUM : AlertSeverity.LOW,
          { previousScore: monitoring.lastScore, newScore: report.creditScore, change: scoreChange },
        );
      }
    }

    // Check for new inquiries
    if (monitoring.alertPreferences?.newInquiry && report.inquiries.length > 0) {
      const recentInquiries = report.inquiries.filter(
        (i) => new Date(i.date).getTime() > (monitoring.lastCheckedAt?.getTime() || 0),
      );

      for (const inquiry of recentInquiries) {
        await this.createAlert(
          report.customerId,
          companyId,
          AlertType.NEW_INQUIRY,
          `New credit inquiry from ${inquiry.creditor}`,
          AlertSeverity.MEDIUM,
          { inquiry },
        );
      }
    }

    // Check for public records
    if (monitoring.alertPreferences?.publicRecord && report.publicRecords.length > 0) {
      for (const record of report.publicRecords) {
        await this.createAlert(
          report.customerId,
          companyId,
          AlertType.PUBLIC_RECORD,
          `New public record: ${record.type}`,
          AlertSeverity.HIGH,
          { record },
        );
      }
    }

    // Update monitoring
    monitoring.lastScore = report.creditScore;
    monitoring.lastCheckedAt = new Date();
    monitoring.nextCheckAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await this.monitoringRepository.save(monitoring);
  }

  private async createAlert(
    customerId: string,
    companyId: string,
    alertType: AlertType,
    message: string,
    severity: AlertSeverity,
    metadata?: Record<string, any>,
  ): Promise<void> {
    const alert = this.alertRepository.create({
      companyId,
      customerId,
      alertType,
      message,
      severity,
      metadata,
    });

    await this.alertRepository.save(alert);

    // In production, would send notification (email, SMS, push)
    this.logger.log(`Credit alert created: ${message}`);
  }

  private mapToDto(report: CreditReport): CreditReportDto {
    return {
      id: report.id,
      customerId: report.customerId,
      applicationId: report.applicationId,
      provider: report.provider,
      status: report.status,
      creditScore: report.creditScore || 0,
      scoreRange: report.scoreRange || { min: 300, max: 850 },
      creditFactors: report.creditFactors || {
        paymentHistory: 0,
        creditUtilization: 0,
        creditAge: 0,
        creditMix: 0,
        newCredit: 0,
      },
      accountsSummary: report.accountsSummary || {
        totalAccounts: 0,
        openAccounts: 0,
        closedAccounts: 0,
        totalDebt: 0,
        availableCredit: 0,
        creditUtilization: 0,
      },
      paymentHistory: report.paymentHistory || {
        onTimePayments: 0,
        latePayments30: 0,
        latePayments60: 0,
        latePayments90: 0,
        collections: 0,
        bankruptcies: 0,
      },
      inquiries: report.inquiries || [],
      publicRecords: report.publicRecords || [],
      rawReportData: report.rawReportData || {},
      pulledAt: report.pulledAt?.toISOString() || '',
      expiresAt: report.expiresAt?.toISOString() || '',
    };
  }
}

