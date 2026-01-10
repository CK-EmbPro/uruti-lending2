import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Loan } from '../loan/entities/loan.entity';
import { LoanApplication } from '../loan-application/entities/loan-application.entity';
import { DelinquencyRecord } from '../collections/entities/delinquency-record.entity';
import { LoanStatus } from '../../common/enums/loan-status.enum';
import { ApplicationStatus } from '../loan-application/entities/loan-application.entity';
import { CollectionStage } from '../../common/enums/collection-stage.enum';
import { PortfolioPerformanceDto } from './dto/portfolio-performance.dto';
import { GenerateRegulatoryReportDto, ReviewRegulatoryReportDto, SubmitRegulatoryReportDto } from './dto/regulatory-report.dto';
import { RollRateAnalysisDto } from './dto/roll-rate-analysis.dto';
import { FairLendingAnalysisDto, ReviewFairLendingAnalysisDto } from './dto/fair-lending-analysis.dto';
import { PortfolioMetrics } from './entities/portfolio-metrics.entity';
import { RegulatoryReport, RegulatoryReportType, RegulatoryReportStatus } from './entities/regulatory-report.entity';
import { RollRateAnalysis, AnalysisType } from './entities/roll-rate-analysis.entity';
import { FairLendingAnalysis, FairLendingAnalysisType } from './entities/fair-lending-analysis.entity';

/**
 * Analytics Service for Reporting & Analytics Use Cases
 * UC-036: Portfolio Performance Dashboard
 * UC-037: Regulatory Report Generation
 * UC-038: Delinquency Roll Rate Analysis
 * UC-039: Fair Lending Analysis
 */
@Injectable()
export class ReportingAnalyticsService {
  private readonly logger = new Logger(ReportingAnalyticsService.name);

  constructor(
    @InjectRepository(Loan)
    private readonly loanRepository: Repository<Loan>,
    @InjectRepository(LoanApplication)
    private readonly applicationRepository: Repository<LoanApplication>,
    @InjectRepository(DelinquencyRecord)
    private readonly delinquencyRepository: Repository<DelinquencyRecord>,
    @InjectRepository(PortfolioMetrics)
    private readonly portfolioMetricsRepository: Repository<PortfolioMetrics>,
    @InjectRepository(RegulatoryReport)
    private readonly regulatoryReportRepository: Repository<RegulatoryReport>,
    @InjectRepository(RollRateAnalysis)
    private readonly rollRateAnalysisRepository: Repository<RollRateAnalysis>,
    @InjectRepository(FairLendingAnalysis)
    private readonly fairLendingAnalysisRepository: Repository<FairLendingAnalysis>,
  ) {}

  /**
   * UC-036: Portfolio Performance Dashboard
   * Generates comprehensive portfolio performance metrics with drill-down capabilities
   */
  async getPortfolioPerformance(filters: PortfolioPerformanceDto): Promise<{
    summary: {
      totalLoans: number;
      totalDisbursed: number;
      totalOutstanding: number;
      totalDelinquentLoans: number;
      totalDelinquentAmount: number;
      delinquencyRate: number;
      totalInterestEarned: number;
      totalFeesEarned: number;
      netProfitMargin: number;
    };
    byProduct: Array<{
      productId: string;
      productName: string;
      loans: number;
      disbursed: number;
      outstanding: number;
      delinquent: number;
      delinquencyRate: number;
    }>;
    byStatus: Record<string, number>;
    byDelinquencyStage: Array<{
      stage: string;
      count: number;
      amount: number;
    }>;
    trends?: Array<{
      date: string;
      totalOutstanding: number;
      delinquencyRate: number;
      profitMargin: number;
    }>;
  }> {
    try {
      const query = this.loanRepository.createQueryBuilder('loan');

    if (filters.companyId) {
      query.andWhere('loan.companyId = :companyId', { companyId: filters.companyId });
    }

    if (filters.loanProductId) {
      query.andWhere('loan.loanProductId = :loanProductId', { loanProductId: filters.loanProductId });
    }

    if (filters.fromDate) {
      const fromDate = new Date(filters.fromDate);
      if (!isNaN(fromDate.getTime())) {
        query.andWhere('loan.postingDate >= :fromDate', { fromDate: fromDate.toISOString().split('T')[0] });
      }
    }

    if (filters.toDate) {
      const toDate = new Date(filters.toDate);
      if (!isNaN(toDate.getTime())) {
        query.andWhere('loan.postingDate <= :toDate', { toDate: toDate.toISOString().split('T')[0] });
      }
    }

    let loans = await query.getMany();
    
    // Ensure we have an array (defensive programming)
    if (!Array.isArray(loans)) {
      this.logger.warn('Query returned non-array result, defaulting to empty array');
      loans = [];
    }

    // Calculate summary metrics
    const totalLoans = loans.length;
    const totalDisbursed = loans.reduce((sum, loan) => sum + Number(loan.disbursedAmount || 0), 0);
    const totalOutstanding = loans.reduce((sum, loan) => {
      const out = Number(loan.disbursedAmount || 0) - Number(loan.totalPrincipalPaid || 0) + Number(loan.totalInterestPayable || 0);
      return sum + Math.max(0, out);
    }, 0);

    const delinquentLoans = loans.filter((loan) => (loan.daysPastDue || 0) > 0);
    const totalDelinquentLoans = delinquentLoans.length;
    const totalDelinquentAmount = delinquentLoans.reduce((sum, loan) => {
      const out = Number(loan.disbursedAmount || 0) - Number(loan.totalPrincipalPaid || 0) + Number(loan.totalInterestPayable || 0);
      return sum + Math.max(0, out);
    }, 0);

    const delinquencyRate = totalLoans > 0 ? (totalDelinquentLoans / totalLoans) * 100 : 0;

    // Calculate profitability (simplified - would need actual transaction data)
    const totalInterestEarned = loans.reduce((sum, loan) => sum + Number(loan.totalInterestPaid || 0), 0);
    const totalFeesEarned = loans.reduce((sum, loan) => sum + Number(loan.totalPenaltyPaid || 0), 0);
    const totalWriteOffs = loans.filter((loan) => loan.status === LoanStatus.WRITTEN_OFF).reduce((sum, loan) => {
      const out = Number(loan.disbursedAmount || 0) - Number(loan.totalPrincipalPaid || 0);
      return sum + Math.max(0, out);
    }, 0);

    const netProfit = totalInterestEarned + totalFeesEarned - totalWriteOffs;
    const netProfitMargin = totalDisbursed > 0 ? (netProfit / totalDisbursed) * 100 : 0;

    // Group by product
    const productMap = new Map<string, { productId: string; loans: Loan[] }>();
    for (const loan of loans) {
      const productId = loan.loanProductId || 'unknown';
      if (!productMap.has(productId)) {
        productMap.set(productId, { productId, loans: [] });
      }
      const productGroup = productMap.get(productId);
      if (productGroup) {
        productGroup.loans.push(loan);
      }
    }

    const byProduct = Array.from(productMap.values()).map(({ productId, loans }) => {
      const disbursed = loans.reduce((sum, loan) => sum + Number(loan.disbursedAmount || 0), 0);
      const outstanding = loans.reduce((sum, loan) => {
        const out = Number(loan.disbursedAmount || 0) - Number(loan.totalPrincipalPaid || 0) + Number(loan.totalInterestPayable || 0);
        return sum + Math.max(0, out);
      }, 0);
      const delinquent = loans.filter((loan) => (loan.daysPastDue || 0) > 0).length;
      const delinquencyRate = loans.length > 0 ? (delinquent / loans.length) * 100 : 0;

      return {
        productId,
        productName: `Product ${productId}`, // TODO: Join with LoanProduct
        loans: loans.length,
        disbursed,
        outstanding,
        delinquent,
        delinquencyRate,
      };
    });

    // Group by status
    const byStatus: Record<string, number> = {};
    for (const loan of loans) {
      const status = loan.status || 'UNKNOWN';
      byStatus[status] = (byStatus[status] || 0) + 1;
    }

    // Group by delinquency stage
    const stageMap = new Map<CollectionStage, { stage: string; loans: Loan[] }>();
    for (const loan of delinquentLoans) {
      // Determine stage from DPD
      let stage: CollectionStage;
      const dpd = loan.daysPastDue || 0;
      if (dpd <= 30) {
        stage = CollectionStage.EARLY_DELINQUENCY;
      } else if (dpd <= 60) {
        stage = CollectionStage.MODERATE_DELINQUENCY;
      } else if (dpd <= 90) {
        stage = CollectionStage.SERIOUS_DELINQUENCY;
      } else if (dpd <= 120) {
        stage = CollectionStage.SEVERE_DELINQUENCY;
      } else {
        stage = CollectionStage.CHARGE_OFF_ELIGIBLE;
      }

      if (!stageMap.has(stage)) {
        stageMap.set(stage, { stage, loans: [] });
      }
      stageMap.get(stage).loans.push(loan);
    }

    const byDelinquencyStage = Array.from(stageMap.values()).map(({ stage, loans }) => {
      const amount = loans.reduce((sum, loan) => {
        const out = Number(loan.disbursedAmount || 0) - Number(loan.totalPrincipalPaid || 0) + Number(loan.totalInterestPayable || 0);
        return sum + Math.max(0, out);
      }, 0);

      return {
        stage,
        count: loans.length,
        amount,
      };
    });

    // Calculate trends if requested
    // Handle string-to-boolean conversion for includeTrends (query params come as strings)
    // Type assertion needed because Transform may not have run yet or type is still boolean
    const includeTrendsValue: boolean | string | undefined = filters.includeTrends as any;
    const includeTrends = includeTrendsValue === true || String(includeTrendsValue) === 'true' || String(includeTrendsValue) === '1';
    let trends: Array<{ date: string; totalOutstanding: number; delinquencyRate: number; profitMargin: number }> | undefined;
    if (includeTrends && filters.fromDate && filters.toDate) {
      // Simplified trend calculation - would need historical data
      trends = [];
      // This would typically query historical PortfolioMetrics records
    }

    // Save metrics snapshot (optional - don't fail if save fails)
    // Note: This is completely optional and won't block the response if it fails
    // The table might not exist if migrations haven't been run, which is fine
    try {
      // Check if repository is available (table might not exist)
      if (!this.portfolioMetricsRepository) {
        this.logger.debug('Portfolio metrics repository not available, skipping save');
        // Continue without saving - this is fine
      } else {
        let reportDate: Date;
        if (filters.toDate) {
          reportDate = new Date(filters.toDate);
          if (isNaN(reportDate.getTime())) {
            reportDate = new Date();
          }
        } else {
          reportDate = new Date();
        }
        
        // Validate UUIDs if provided (PostgreSQL requires valid UUID format)
        const isValidUUID = (str: string | undefined | null): boolean => {
          if (!str) return false;
          const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
          return uuidRegex.test(str);
        };
        
        const metrics = this.portfolioMetricsRepository.create({
          reportDate,
          companyId: filters.companyId && isValidUUID(filters.companyId) ? filters.companyId : null,
          loanProductId: filters.loanProductId && isValidUUID(filters.loanProductId) ? filters.loanProductId : null,
          totalLoans: Number(totalLoans) || 0,
          totalDisbursed: Number(totalDisbursed) || 0,
          totalOutstanding: Number(totalOutstanding) || 0,
          totalDelinquentLoans: Number(totalDelinquentLoans) || 0,
          totalDelinquentAmount: Number(totalDelinquentAmount) || 0,
          delinquencyRate: Number(delinquencyRate) || 0,
          totalInterestEarned: Number(totalInterestEarned) || 0,
          totalFeesEarned: Number(totalFeesEarned) || 0,
          totalWriteOffs: Number(totalWriteOffs) || 0,
          netProfitMargin: Number(netProfitMargin) || 0,
          byProduct: byProduct && Array.isArray(byProduct) ? byProduct : null,
          byStatus: byStatus && typeof byStatus === 'object' ? byStatus : null,
          byDelinquencyStage: byDelinquencyStage && Array.isArray(byDelinquencyStage) ? byDelinquencyStage : null,
        });
        await this.portfolioMetricsRepository.save(metrics);
        this.logger.debug('Portfolio metrics snapshot saved successfully');
      }
    } catch (error: any) {
      // Log error but don't fail the request - metrics saving is completely optional
      // Common reasons for failure:
      // - Table doesn't exist (migration not run)
      // - Database connection issues
      // - Data type mismatches
      // - Permission issues
      const errorMessage = error?.message || String(error);
      if (errorMessage.includes('does not exist') || errorMessage.includes('relation') || errorMessage.includes('table')) {
        this.logger.debug('Portfolio metrics table does not exist, skipping save (this is expected if migrations not run)');
      } else {
        this.logger.warn('Failed to save portfolio metrics snapshot (non-critical):', errorMessage);
        if (error?.stack) {
          this.logger.debug(error.stack);
        }
      }
    }

    return {
      summary: {
        totalLoans,
        totalDisbursed,
        totalOutstanding,
        totalDelinquentLoans,
        totalDelinquentAmount,
        delinquencyRate,
        totalInterestEarned,
        totalFeesEarned,
        netProfitMargin,
      },
      byProduct,
      byStatus,
      byDelinquencyStage,
      trends,
    };
    } catch (error) {
      this.logger.error('Error in getPortfolioPerformance:', error?.message || error);
      if (error?.stack) {
        this.logger.error(error.stack);
      }
      throw error;
    }
  }

  /**
   * UC-037: Regulatory Report Generation
   * Generates regulatory reports (HMDA, CRA, Call Reports, Stress Tests)
   */
  async generateRegulatoryReport(dto: GenerateRegulatoryReportDto, userId: string, userName: string): Promise<RegulatoryReport> {
    const reportDate = new Date(dto.reportDate);
    const periodStart = dto.periodStartDate ? new Date(dto.periodStartDate) : null;
    const periodEnd = dto.periodEndDate ? new Date(dto.periodEndDate) : null;

    let reportData: any = {};

    // Generate report data based on type
    switch (dto.reportType) {
      case RegulatoryReportType.HMDA:
        reportData = await this.generateHmdaReport(periodStart, periodEnd, dto.companyId);
        break;
      case RegulatoryReportType.CRA:
        reportData = await this.generateCraReport(periodStart, periodEnd, dto.companyId);
        break;
      case RegulatoryReportType.CALL_REPORT:
        reportData = await this.generateCallReport(periodStart, periodEnd, dto.companyId);
        break;
      case RegulatoryReportType.STRESS_TEST:
        reportData = await this.generateStressTestReport(periodStart, periodEnd, dto.companyId);
        break;
    }

    // Validate report data
    const validation = this.validateRegulatoryReport(dto.reportType, reportData);
    const isValid = validation.errors.length === 0;

    const report = this.regulatoryReportRepository.create({
      reportType: dto.reportType,
      reportDate,
      periodStartDate: periodStart,
      periodEndDate: periodEnd,
      companyId: dto.companyId,
      reportData,
      isValid,
      validationErrors: validation.errors.join('; '),
      status: isValid ? RegulatoryReportStatus.GENERATED : RegulatoryReportStatus.DRAFT,
    });

    return await this.regulatoryReportRepository.save(report);
  }

  private async generateHmdaReport(periodStart: Date | null, periodEnd: Date | null, companyId?: string): Promise<any> {
    const query = this.applicationRepository.createQueryBuilder('app');
    query.where('app.status IN (:...statuses)', {
      statuses: [ApplicationStatus.APPROVED, ApplicationStatus.REJECTED],
    });

    if (companyId) {
      query.andWhere('app.companyId = :companyId', { companyId });
    }

    if (periodStart) {
      query.andWhere('app.applicationDate >= :periodStart', { periodStart });
    }

    if (periodEnd) {
      query.andWhere('app.applicationDate <= :periodEnd', { periodEnd });
    }

    const applications = await query.getMany();

    // HMDA requires demographic data (race, ethnicity, gender) which may not be in current schema
    // This is a simplified version - would need to extend LoanApplication entity
    return {
      totalApplications: applications.length,
      approved: applications.filter((app) => app.status === ApplicationStatus.APPROVED).length,
      denied: applications.filter((app) => app.status === ApplicationStatus.REJECTED).length,
      // Additional HMDA fields would go here
    };
  }

  private async generateCraReport(periodStart: Date | null, periodEnd: Date | null, companyId?: string): Promise<any> {
    // CRA (Community Reinvestment Act) report
    const query = this.loanRepository.createQueryBuilder('loan');

    if (companyId) {
      query.andWhere('loan.companyId = :companyId', { companyId });
    }

    if (periodStart) {
      query.andWhere('loan.postingDate >= :periodStart', { periodStart });
    }

    if (periodEnd) {
      query.andWhere('loan.postingDate <= :periodEnd', { periodEnd });
    }

    const loans = await query.getMany();

    return {
      totalLoans: loans.length,
      totalDisbursed: loans.reduce((sum, loan) => sum + Number(loan.disbursedAmount || 0), 0),
      // CRA requires geographic and demographic breakdowns
    };
  }

  private async generateCallReport(periodStart: Date | null, periodEnd: Date | null, companyId?: string): Promise<any> {
    // Call Report (Quarterly Bank Report)
    const query = this.loanRepository.createQueryBuilder('loan');

    if (companyId) {
      query.andWhere('loan.companyId = :companyId', { companyId });
    }

    const loans = await query.getMany();

    const totalOutstanding = loans.reduce((sum, loan) => {
      const out = Number(loan.disbursedAmount || 0) - Number(loan.totalPrincipalPaid || 0) + Number(loan.totalInterestPayable || 0);
      return sum + Math.max(0, out);
    }, 0);

    const npaLoans = loans.filter((loan) => loan.isNpa);
    const npaAmount = npaLoans.reduce((sum, loan) => {
      const out = Number(loan.disbursedAmount || 0) - Number(loan.totalPrincipalPaid || 0) + Number(loan.totalInterestPayable || 0);
      return sum + Math.max(0, out);
    }, 0);

    return {
      totalLoans: loans.length,
      totalOutstanding,
      npaLoans: npaLoans.length,
      npaAmount,
      npaRatio: totalOutstanding > 0 ? (npaAmount / totalOutstanding) * 100 : 0,
    };
  }

  private async generateStressTestReport(periodStart: Date | null, periodEnd: Date | null, companyId?: string): Promise<any> {
    // Stress Test Report
    const query = this.loanRepository.createQueryBuilder('loan');

    if (companyId) {
      query.andWhere('loan.companyId = :companyId', { companyId });
    }

    const loans = await query.getMany();

    // Simulate stress scenarios
    const scenarios = [
      { name: 'Baseline', defaultRate: 0.02, lossRate: 0.01 },
      { name: 'Adverse', defaultRate: 0.05, lossRate: 0.03 },
      { name: 'Severely Adverse', defaultRate: 0.10, lossRate: 0.07 },
    ];

    const results = scenarios.map((scenario) => {
      const totalOutstanding = loans.reduce((sum, loan) => {
        const out = Number(loan.disbursedAmount || 0) - Number(loan.totalPrincipalPaid || 0) + Number(loan.totalInterestPayable || 0);
        return sum + Math.max(0, out);
      }, 0);

      const projectedDefaults = totalOutstanding * scenario.defaultRate;
      const projectedLosses = totalOutstanding * scenario.lossRate;

      return {
        scenario: scenario.name,
        totalOutstanding,
        projectedDefaults,
        projectedLosses,
        capitalAdequacy: totalOutstanding > 0 ? ((totalOutstanding - projectedLosses) / totalOutstanding) * 100 : 100,
      };
    });

    return {
      scenarios: results,
      asOfDate: periodEnd || new Date(),
    };
  }

  private validateRegulatoryReport(reportType: RegulatoryReportType, reportData: any): { errors: string[] } {
    const errors: string[] = [];

    // Basic validation
    if (!reportData) {
      errors.push('Report data is missing');
      return { errors };
    }

    switch (reportType) {
      case RegulatoryReportType.HMDA:
        if (!reportData.totalApplications) {
          errors.push('HMDA report missing total applications');
        }
        break;
      case RegulatoryReportType.CRA:
        if (!reportData.totalLoans) {
          errors.push('CRA report missing total loans');
        }
        break;
      case RegulatoryReportType.CALL_REPORT:
        if (!reportData.totalOutstanding) {
          errors.push('Call report missing total outstanding');
        }
        break;
      case RegulatoryReportType.STRESS_TEST:
        if (!reportData.scenarios || reportData.scenarios.length === 0) {
          errors.push('Stress test report missing scenarios');
        }
        break;
    }

    return { errors };
  }

  async reviewRegulatoryReport(id: string, dto: ReviewRegulatoryReportDto, userId: string, userName: string): Promise<RegulatoryReport> {
    const report = await this.regulatoryReportRepository.findOne({ where: { id } });
    if (!report) {
      throw new Error('Regulatory report not found');
    }

    report.status = dto.reviewed ? RegulatoryReportStatus.REVIEWED : report.status;
    report.reviewedBy = userId;
    report.reviewedAt = new Date();
    report.remarks = dto.remarks;

    return await this.regulatoryReportRepository.save(report);
  }

  async submitRegulatoryReport(id: string, dto: SubmitRegulatoryReportDto, userId: string, userName: string): Promise<RegulatoryReport> {
    const report = await this.regulatoryReportRepository.findOne({ where: { id } });
    if (!report) {
      throw new Error('Regulatory report not found');
    }

    if (!report.isValid) {
      throw new Error('Cannot submit invalid report');
    }

    report.status = RegulatoryReportStatus.SUBMITTED;
    report.submittedBy = userId;
    report.submittedAt = new Date();
    report.regulatorName = dto.regulatorName;
    report.submissionReference = dto.submissionReference;
    report.remarks = dto.remarks;

    return await this.regulatoryReportRepository.save(report);
  }

  /**
   * UC-038: Delinquency Roll Rate Analysis
   * Calculates movement between delinquency buckets and forecasts future losses
   */
  async generateRollRateAnalysis(dto: RollRateAnalysisDto): Promise<RollRateAnalysis> {
    const analysisDate = dto.analysisDate ? new Date(dto.analysisDate) : new Date();
    const periodStart = dto.periodStartDate ? new Date(dto.periodStartDate) : null;
    const periodEnd = dto.periodEndDate ? new Date(dto.periodEndDate) : null;

    // Get delinquency records for the period
    const query = this.delinquencyRepository.createQueryBuilder('dr');

    if (dto.companyId) {
      query.leftJoin('dr.loan', 'loan').andWhere('loan.companyId = :companyId', { companyId: dto.companyId });
    }

    if (periodStart) {
      query.andWhere('dr.recordDate >= :periodStart', { periodStart });
    }

    if (periodEnd) {
      query.andWhere('dr.recordDate <= :periodEnd', { periodEnd });
    }

    const records = await query.getMany();

    // Group records by loan and date to track movement
    const loanRecords = new Map<string, DelinquencyRecord[]>();
    for (const record of records) {
      if (!loanRecords.has(record.loanId)) {
        loanRecords.set(record.loanId, []);
      }
      loanRecords.get(record.loanId).push(record);
    }

    // Build roll rate matrix
    const rollRateMatrix: Record<string, Record<string, number>> = {};
    const buckets = ['0-30', '31-60', '61-90', '91-180', '181-365', '365+'];

    // Initialize matrix
    for (const from of buckets) {
      rollRateMatrix[from] = {};
      for (const to of buckets) {
        rollRateMatrix[from][to] = 0;
      }
    }

    // Calculate movements
    for (const [loanId, loanRecordList] of loanRecords.entries()) {
      const sorted = loanRecordList.sort((a, b) => a.recordDate.getTime() - b.recordDate.getTime());

      for (let i = 0; i < sorted.length - 1; i++) {
        const from = this.getBucketFromDpd(sorted[i].daysPastDue);
        const to = this.getBucketFromDpd(sorted[i + 1].daysPastDue);
        rollRateMatrix[from][to] = (rollRateMatrix[from][to] || 0) + 1;
      }
    }

    // Calculate roll rates (percentages)
    const rollRates: Record<string, Record<string, number>> = {};
    for (const from of buckets) {
      rollRates[from] = {};
      const totalFrom = Object.values(rollRateMatrix[from]).reduce((sum, count) => sum + count, 0);
      for (const to of buckets) {
        rollRates[from][to] = totalFrom > 0 ? (rollRateMatrix[from][to] / totalFrom) * 100 : 0;
      }
    }

    // Calculate key movement percentages
    const currentTo30Days = rollRates['0-30']?.['31-60'] || 0;
    const days30To60Days = rollRates['31-60']?.['61-90'] || 0;
    const days60To90Days = rollRates['61-90']?.['91-180'] || 0;
    const days90To180Days = rollRates['91-180']?.['181-365'] || 0;
    const days180To365Days = rollRates['181-365']?.['365+'] || 0;
    const days365Plus = rollRates['365+']?.['365+'] || 0; // Charge-off rate

    // Forecast losses
    const currentDelinquent = records.filter((r) => r.daysPastDue > 0);
    const totalOutstanding = currentDelinquent.reduce((sum, r) => sum + Number(r.outstandingBalance || 0), 0);
    const lossRate = days365Plus; // Use 365+ roll rate as loss rate
    const forecastedLosses = totalOutstanding * (lossRate / 100);

    // Generate trends
    const trends = this.calculateRollRateTrends(records, periodStart, periodEnd);

    // Vintage/Cohort analysis if requested
    let vintageData: any = null;
    let cohortData: any = null;
    if (dto.includeVintage) {
      vintageData = this.calculateVintageAnalysis(records);
    }
    if (dto.includeCohort) {
      cohortData = this.calculateCohortAnalysis(records);
    }

    const analysis = this.rollRateAnalysisRepository.create({
      analysisType: dto.analysisType || AnalysisType.ROLL_RATE,
      analysisDate,
      periodStartDate: periodStart,
      periodEndDate: periodEnd,
      companyId: dto.companyId,
      loanProductId: dto.loanProductId,
      rollRateMatrix,
      currentTo30Days,
      days30To60Days,
      days60To90Days,
      days90To180Days,
      days180To365Days,
      days365Plus,
      forecastedLosses,
      lossRate,
      trends,
      vintageData,
      cohortData,
    });

    return await this.rollRateAnalysisRepository.save(analysis);
  }

  private getBucketFromDpd(dpd: number): string {
    if (dpd <= 30) return '0-30';
    if (dpd <= 60) return '31-60';
    if (dpd <= 90) return '61-90';
    if (dpd <= 180) return '91-180';
    if (dpd <= 365) return '181-365';
    return '365+';
  }

  private calculateRollRateTrends(records: DelinquencyRecord[], periodStart: Date | null, periodEnd: Date | null): any {
    // Simplified trend calculation
    return {
      averageDpd: records.length > 0 ? records.reduce((sum, r) => sum + r.daysPastDue, 0) / records.length : 0,
      trendDirection: 'stable', // Would calculate from historical data
    };
  }

  private calculateVintageAnalysis(records: DelinquencyRecord[]): any {
    // Group by loan origination date (vintage)
    // Simplified - would need loan origination dates
    return {
      vintages: [],
    };
  }

  private calculateCohortAnalysis(records: DelinquencyRecord[]): any {
    // Group by application/approval date (cohort)
    // Simplified - would need application dates
    return {
      cohorts: [],
    };
  }

  /**
   * UC-039: Fair Lending Analysis
   * Compares approval rates by protected class and identifies disparities
   */
  async generateFairLendingAnalysis(dto: FairLendingAnalysisDto): Promise<FairLendingAnalysis> {
    const analysisDate = dto.analysisDate ? new Date(dto.analysisDate) : new Date();
    const periodStart = dto.periodStartDate ? new Date(dto.periodStartDate) : null;
    const periodEnd = dto.periodEndDate ? new Date(dto.periodEndDate) : null;

    const query = this.applicationRepository.createQueryBuilder('app');

    if (dto.companyId) {
      query.andWhere('app.companyId = :companyId', { companyId: dto.companyId });
    }

    if (dto.loanProductId) {
      query.andWhere('app.loanProductId = :loanProductId', { loanProductId: dto.loanProductId });
    }

    if (periodStart) {
      query.andWhere('app.applicationDate >= :periodStart', { periodStart });
    }

    if (periodEnd) {
      query.andWhere('app.applicationDate <= :periodEnd', { periodEnd });
    }

    const applications = await query.getMany();

    // Calculate overall approval rate
    const totalApplications = applications.length;
    const approved = applications.filter((app) => app.status === ApplicationStatus.APPROVED).length;
    const overallApprovalRate = totalApplications > 0 ? (approved / totalApplications) * 100 : 0;

    // Note: Protected class data (race, gender, ethnicity) would need to be added to LoanApplication entity
    // For now, we'll use applicantType as a proxy
    const protectedClassData: any = {};
    const approvalRatesByClass: any = {};

    // Group by applicant type (simplified - would use actual protected classes)
    const byApplicantType = new Map<string, { applications: LoanApplication[]; approved: number }>();
    for (const app of applications) {
      const type = app.applicantType || 'Unknown';
      if (!byApplicantType.has(type)) {
        byApplicantType.set(type, { applications: [], approved: 0 });
      }
      byApplicantType.get(type).applications.push(app);
      if (app.status === ApplicationStatus.APPROVED) {
        byApplicantType.get(type).approved++;
      }
    }

    for (const [type, data] of byApplicantType.entries()) {
      const approvalRate = data.applications.length > 0 ? (data.approved / data.applications.length) * 100 : 0;
      protectedClassData[type] = {
        applications: data.applications.length,
        approved: data.approved,
        denied: data.applications.length - data.approved,
        approvalRate,
      };
      approvalRatesByClass[type] = approvalRate;
    }

    // Detect disparities
    const significantDisparities: any[] = [];
    let maxDisparityRatio = 1;
    let maxDisparityClass = '';

    const rates = Object.values(approvalRatesByClass) as number[];
    if (rates.length > 0) {
      const maxRate = Math.max(...rates);
      const minRate = Math.min(...rates);

      if (maxRate > 0 && minRate > 0) {
        maxDisparityRatio = maxRate / minRate;
        maxDisparityClass = Object.keys(approvalRatesByClass).find(
          (key) => approvalRatesByClass[key] === maxRate,
        ) || '';

        // Flag if disparity exceeds threshold (e.g., 20% difference)
        if (maxDisparityRatio > 1.2) {
          significantDisparities.push({
            class: maxDisparityClass,
            ratio: maxDisparityRatio,
            message: `Approval rate disparity detected: ${maxDisparityRatio.toFixed(2)}x difference`,
          });
        }
      }
    }

    // Pricing disparities (would need loan interest rate data)
    const pricingDisparities: any = {};

    const analysis = this.fairLendingAnalysisRepository.create({
      analysisType: dto.analysisType || FairLendingAnalysisType.APPROVAL_RATE,
      analysisDate,
      periodStartDate: periodStart,
      periodEndDate: periodEnd,
      companyId: dto.companyId,
      loanProductId: dto.loanProductId,
      protectedClassData,
      overallApprovalRate,
      approvalRatesByClass,
      pricingDisparities,
      significantDisparities,
      maxDisparityRatio,
      maxDisparityClass,
    });

    return await this.fairLendingAnalysisRepository.save(analysis);
  }

  async reviewFairLendingAnalysis(id: string, dto: ReviewFairLendingAnalysisDto, userId: string, userName: string): Promise<FairLendingAnalysis> {
    const analysis = await this.fairLendingAnalysisRepository.findOne({ where: { id } });
    if (!analysis) {
      throw new Error('Fair lending analysis not found');
    }

    analysis.reviewed = dto.reviewed !== false;
    analysis.reviewedBy = userId;
    analysis.reviewedAt = new Date();
    analysis.correctiveActionRequired = dto.correctiveActionRequired || false;
    analysis.correctiveActionPlan = dto.correctiveActionPlan;
    analysis.remarks = dto.remarks;

    return await this.fairLendingAnalysisRepository.save(analysis);
  }
}

