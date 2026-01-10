import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Loan } from '../../loan/entities/loan.entity';
import { LoanApplication } from '../../loan-application/entities/loan-application.entity';
import { LoanRepayment } from '../../loan-repayment/entities/loan-repayment.entity';
import { LoanDisbursement } from '../../loan-disbursement/entities/loan-disbursement.entity';
import { LoanStatus } from '../../../common/enums/loan-status.enum';
import { ApplicationStatus } from '../../loan-application/entities/loan-application.entity';
import { GetMetricsDto } from '../dto/dashboard.dto';

/**
 * Real-Time Analytics Service
 * Provides real-time metrics and KPIs for dashboard visualization
 */
@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);

  constructor(
    @InjectRepository(Loan)
    private readonly loanRepository: Repository<Loan>,
    @InjectRepository(LoanApplication)
    private readonly applicationRepository: Repository<LoanApplication>,
    @InjectRepository(LoanRepayment)
    private readonly repaymentRepository: Repository<LoanRepayment>,
    @InjectRepository(LoanDisbursement)
    private readonly disbursementRepository: Repository<LoanDisbursement>,
  ) {}

  /**
   * Get real-time metrics
   */
  async getMetrics(filters: GetMetricsDto): Promise<Record<string, any>> {
    const metrics: Record<string, any> = {};

    try {
      // Portfolio Health Metrics
      if (!filters.metricIds || filters.metricIds.includes('totalOutstandingLoans')) {
        try {
          metrics.totalOutstandingLoans = await this.getTotalOutstandingLoans(filters);
        } catch (error) {
          this.logger.error(`Error getting totalOutstandingLoans: ${error.message}`);
          metrics.totalOutstandingLoans = 0;
        }
      }

      if (!filters.metricIds || filters.metricIds.includes('totalDisbursed')) {
        try {
          metrics.totalDisbursed = await this.getTotalDisbursed(filters);
        } catch (error) {
          this.logger.error(`Error getting totalDisbursed: ${error.message}`);
          metrics.totalDisbursed = 0;
        }
      }

      if (!filters.metricIds || filters.metricIds.includes('delinquencyRate')) {
        try {
          metrics.delinquencyRate = await this.getDelinquencyRate(filters);
        } catch (error) {
          this.logger.error(`Error getting delinquencyRate: ${error.message}`);
          metrics.delinquencyRate = 0;
        }
      }

      if (!filters.metricIds || filters.metricIds.includes('npaRatio')) {
        try {
          metrics.npaRatio = await this.getNpaRatio(filters);
        } catch (error) {
          this.logger.error(`Error getting npaRatio: ${error.message}`);
          metrics.npaRatio = 0;
        }
      }

      if (!filters.metricIds || filters.metricIds.includes('collectionEfficiency')) {
        try {
          metrics.collectionEfficiency = await this.getCollectionEfficiency(filters);
        } catch (error) {
          this.logger.error(`Error getting collectionEfficiency: ${error.message}`);
          metrics.collectionEfficiency = 0;
        }
      }

    // Operational Metrics
    if (!filters.metricIds || filters.metricIds.includes('applicationsReceived')) {
      metrics.applicationsReceived = await this.getApplicationsReceived(filters);
    }

    if (!filters.metricIds || filters.metricIds.includes('applicationsApproved')) {
      metrics.applicationsApproved = await this.getApplicationsApproved(filters);
    }

    if (!filters.metricIds || filters.metricIds.includes('approvalRate')) {
      metrics.approvalRate = await this.getApprovalRate(filters);
    }

    if (!filters.metricIds || filters.metricIds.includes('averageProcessingTime')) {
      metrics.averageProcessingTime = await this.getAverageProcessingTime(filters);
    }

    if (!filters.metricIds || filters.metricIds.includes('disbursementVolume')) {
      metrics.disbursementVolume = await this.getDisbursementVolume(filters);
    }

    if (!filters.metricIds || filters.metricIds.includes('repaymentCollectionRate')) {
      metrics.repaymentCollectionRate = await this.getRepaymentCollectionRate(filters);
    }

    // Financial Metrics
    if (!filters.metricIds || filters.metricIds.includes('totalRevenue')) {
      metrics.totalRevenue = await this.getTotalRevenue(filters);
    }

    if (!filters.metricIds || filters.metricIds.includes('interestIncome')) {
      metrics.interestIncome = await this.getInterestIncome(filters);
    }

    if (!filters.metricIds || filters.metricIds.includes('feeIncome')) {
      metrics.feeIncome = await this.getFeeIncome(filters);
    }

    if (!filters.metricIds || filters.metricIds.includes('totalWriteOffs')) {
      metrics.totalWriteOffs = await this.getTotalWriteOffs(filters);
    }

    // Customer Metrics
    if (!filters.metricIds || filters.metricIds.includes('activeCustomers')) {
      metrics.activeCustomers = await this.getActiveCustomers(filters);
    }

    if (!filters.metricIds || filters.metricIds.includes('newCustomers')) {
      metrics.newCustomers = await this.getNewCustomers(filters);
    }

    if (!filters.metricIds || filters.metricIds.includes('averageLoanSize')) {
      metrics.averageLoanSize = await this.getAverageLoanSize(filters);
    }

      return metrics;
    } catch (error) {
      this.logger.error(`Error in getMetrics: ${error.message}`, error.stack);
      // Return empty metrics object on error
      return {};
    }
  }

  /**
   * Get time-series data for charts
   */
  async getTimeSeriesData(
    metricId: string,
    filters: GetMetricsDto,
    interval: 'day' | 'week' | 'month' = 'day',
  ): Promise<Array<{ date: string; value: number }>> {
    const now = new Date();
    const data: Array<{ date: string; value: number }> = [];
    
    // Determine number of points based on interval
    let points = 30; // Default 30 days
    let dateIncrement: (date: Date) => Date;
    
    switch (interval) {
      case 'day':
        points = 30;
        dateIncrement = (date) => {
          const newDate = new Date(date);
          newDate.setDate(newDate.getDate() + 1);
          return newDate;
        };
        break;
      case 'week':
        points = 12;
        dateIncrement = (date) => {
          const newDate = new Date(date);
          newDate.setDate(newDate.getDate() + 7);
          return newDate;
        };
        break;
      case 'month':
        points = 12;
        dateIncrement = (date) => {
          const newDate = new Date(date);
          newDate.setMonth(newDate.getMonth() + 1);
          return newDate;
        };
        break;
    }

    // Calculate start date
    const startDate = new Date(now);
    if (interval === 'day') {
      startDate.setDate(startDate.getDate() - points);
    } else if (interval === 'week') {
      startDate.setDate(startDate.getDate() - (points * 7));
    } else {
      startDate.setMonth(startDate.getMonth() - points);
    }

    // Generate time-series data based on metric type
    let currentDate = new Date(startDate);
    for (let i = 0; i < points; i++) {
      const dateStr = currentDate.toISOString().split('T')[0];
      
      // Create filters for this specific date
      const dateFilters: GetMetricsDto = {
        ...filters,
        fromDate: dateStr,
        toDate: dateStr,
      };

      let value = 0;
      
      // Calculate value based on metric ID
      switch (metricId) {
        case 'totalOutstandingLoans':
          value = await this.getTotalOutstandingLoans(dateFilters);
          break;
        case 'delinquencyRate':
          value = await this.getDelinquencyRate(dateFilters);
          break;
        case 'applicationsReceived':
          value = await this.getApplicationsReceived(dateFilters);
          break;
        case 'disbursementVolume':
          value = await this.getDisbursementVolume(dateFilters);
          break;
        case 'totalRevenue':
          value = await this.getTotalRevenue(dateFilters);
          break;
        default:
          // For other metrics, use a simplified calculation
          value = Math.random() * 1000; // Placeholder
      }

      data.push({ date: dateStr, value });
      currentDate = dateIncrement(currentDate);
    }

    return data;
  }

  // Portfolio Health Metrics
  private async getTotalOutstandingLoans(filters: GetMetricsDto): Promise<number> {
    const query = this.loanRepository
      .createQueryBuilder('loan')
      .select('COALESCE(SUM(loan.loanAmount - loan.totalPrincipalPaid), 0)', 'total')
      .where('loan.status IN (:...statuses)', {
        statuses: [LoanStatus.DISBURSED, LoanStatus.ACTIVE, LoanStatus.PARTIALLY_DISBURSED],
      });

    this.applyFilters(query, filters, 'loan');
    const result = await query.getRawOne();
    return parseFloat(result?.total || '0');
  }

  private async getTotalDisbursed(filters: GetMetricsDto): Promise<number> {
    try {
      const query = this.loanRepository
        .createQueryBuilder('loan')
        .select('COALESCE(SUM(CAST(loan.disbursedAmount AS DECIMAL)), 0)', 'total');

      this.applyFilters(query, filters, 'loan');
      const result = await query.getRawOne();
      return parseFloat(result?.total || '0');
    } catch (error) {
      this.logger.error(`Error in getTotalDisbursed: ${error.message}`, error.stack);
      return 0;
    }
  }

  private async getDelinquencyRate(filters: GetMetricsDto): Promise<number> {
    try {
      const totalLoans = await this.getTotalOutstandingLoans(filters);
      if (totalLoans === 0) return 0;

      const query = this.loanRepository
        .createQueryBuilder('loan')
        .select('COALESCE(SUM(CAST(loan.loanAmount AS DECIMAL) - CAST(loan.totalPrincipalPaid AS DECIMAL)), 0)', 'delinquent')
        .where('loan.status IN (:...statuses)', {
          statuses: [LoanStatus.DISBURSED, LoanStatus.ACTIVE],
        })
        .andWhere('loan.daysPastDue > 0');

      this.applyFilters(query, filters, 'loan');
      const result = await query.getRawOne();
      const delinquentAmount = parseFloat(result?.delinquent || '0');

      return totalLoans > 0 ? (delinquentAmount / totalLoans) * 100 : 0;
    } catch (error) {
      this.logger.error(`Error in getDelinquencyRate: ${error.message}`, error.stack);
      return 0;
    }
  }

  private async getNpaRatio(filters: GetMetricsDto): Promise<number> {
    try {
      const totalLoans = await this.getTotalOutstandingLoans(filters);
      if (totalLoans === 0) return 0;

      const query = this.loanRepository
        .createQueryBuilder('loan')
        .select('COALESCE(SUM(CAST(loan.loanAmount AS DECIMAL) - CAST(loan.totalPrincipalPaid AS DECIMAL)), 0)', 'npa')
        .where('loan.isNpa = true');

      this.applyFilters(query, filters, 'loan');
      const result = await query.getRawOne();
      const npaAmount = parseFloat(result?.npa || '0');

      return totalLoans > 0 ? (npaAmount / totalLoans) * 100 : 0;
    } catch (error) {
      this.logger.error(`Error in getNpaRatio: ${error.message}`, error.stack);
      return 0;
    }
  }

  private async getCollectionEfficiency(filters: GetMetricsDto): Promise<number> {
    // Collection efficiency = (Collections / Delinquent Amount) * 100
    const delinquentAmount = await this.getDelinquencyRate(filters);
    if (delinquentAmount === 0) return 100;

    // This would need collections data - simplified for now
    return 85; // Placeholder
  }

  // Operational Metrics
  private async getApplicationsReceived(filters: GetMetricsDto): Promise<number> {
    try {
      const query = this.applicationRepository.createQueryBuilder('app').select('COUNT(*)', 'count');

      this.applyFilters(query, filters, 'app');
      const result = await query.getRawOne();
      return parseInt(result?.count || '0', 10);
    } catch (error) {
      this.logger.error(`Error in getApplicationsReceived: ${error.message}`, error.stack);
      return 0;
    }
  }

  private async getApplicationsApproved(filters: GetMetricsDto): Promise<number> {
    try {
      const query = this.applicationRepository
        .createQueryBuilder('app')
        .select('COUNT(*)', 'count')
        .where('app.status = :status', { status: ApplicationStatus.APPROVED });

      this.applyFilters(query, filters, 'app');
      const result = await query.getRawOne();
      return parseInt(result?.count || '0', 10);
    } catch (error) {
      this.logger.error(`Error in getApplicationsApproved: ${error.message}`, error.stack);
      return 0;
    }
  }

  private async getApprovalRate(filters: GetMetricsDto): Promise<number> {
    const received = await this.getApplicationsReceived(filters);
    if (received === 0) return 0;

    const approved = await this.getApplicationsApproved(filters);
    return (approved / received) * 100;
  }

  private async getAverageProcessingTime(filters: GetMetricsDto): Promise<number> {
    try {
      // Average time from submission to approval/rejection
      const query = this.applicationRepository
        .createQueryBuilder('app')
        .select(
          'AVG(EXTRACT(EPOCH FROM (COALESCE(app.approvalDate, app.rejectionDate, app.updatedAt) - app.createdAt)) / 86400)',
          'avg',
        )
        .where('app.status IN (:...statuses)', {
          statuses: [ApplicationStatus.APPROVED, ApplicationStatus.REJECTED],
        });

      this.applyFilters(query, filters, 'app');
      const result = await query.getRawOne();
      return parseFloat(result?.avg || '0');
    } catch (error) {
      this.logger.error(`Error in getAverageProcessingTime: ${error.message}`, error.stack);
      return 0;
    }
  }

  private async getDisbursementVolume(filters: GetMetricsDto): Promise<number> {
    try {
      const query = this.disbursementRepository
        .createQueryBuilder('disbursement')
        .select('COALESCE(SUM(CAST(disbursement.disbursedAmount AS DECIMAL)), 0)', 'total');

      if (filters.fromDate) {
        query.andWhere('disbursement.disbursementDate >= :fromDate', {
          fromDate: filters.fromDate,
        });
      }
      if (filters.toDate) {
        query.andWhere('disbursement.disbursementDate <= :toDate', { toDate: filters.toDate });
      }

      const result = await query.getRawOne();
      return parseFloat(result?.total || '0');
    } catch (error) {
      this.logger.error(`Error in getDisbursementVolume: ${error.message}`, error.stack);
      return 0;
    }
  }

  private async getRepaymentCollectionRate(filters: GetMetricsDto): Promise<number> {
    try {
      // Collection rate = (Repayments / Expected Repayments) * 100
      const query = this.repaymentRepository
        .createQueryBuilder('repayment')
        .select('COALESCE(SUM(CAST(repayment.amountPaid AS DECIMAL)), 0)', 'collected');

      if (filters.fromDate) {
        query.andWhere('repayment.postingDate >= :fromDate', { fromDate: filters.fromDate });
      }
      if (filters.toDate) {
        query.andWhere('repayment.postingDate <= :toDate', { toDate: filters.toDate });
      }

      const result = await query.getRawOne();
      const collected = parseFloat(result?.collected || '0');

      // Simplified - would need expected repayments calculation
      return collected > 0 ? 95 : 0; // Placeholder
    } catch (error) {
      this.logger.error(`Error in getRepaymentCollectionRate: ${error.message}`, error.stack);
      return 0;
    }
  }

  // Financial Metrics
  private async getTotalRevenue(filters: GetMetricsDto): Promise<number> {
    const interest = await this.getInterestIncome(filters);
    const fees = await this.getFeeIncome(filters);
    return interest + fees;
  }

  private async getInterestIncome(filters: GetMetricsDto): Promise<number> {
    try {
      const query = this.loanRepository
        .createQueryBuilder('loan')
        .select('COALESCE(SUM(CAST(loan.totalInterestPaid AS DECIMAL)), 0)', 'total');

      this.applyFilters(query, filters, 'loan');
      const result = await query.getRawOne();
      return parseFloat(result?.total || '0');
    } catch (error) {
      this.logger.error(`Error in getInterestIncome: ${error.message}`, error.stack);
      return 0;
    }
  }

  private async getFeeIncome(filters: GetMetricsDto): Promise<number> {
    // Would need to query from charges/fees table
    // Simplified for now
    return 0;
  }

  private async getTotalWriteOffs(filters: GetMetricsDto): Promise<number> {
    try {
      const query = this.loanRepository
        .createQueryBuilder('loan')
        .select('COALESCE(SUM(CAST(loan.writtenOffAmount AS DECIMAL)), 0)', 'total')
        .where('loan.status = :status', { status: LoanStatus.WRITTEN_OFF });

      this.applyFilters(query, filters, 'loan');
      const result = await query.getRawOne();
      return parseFloat(result?.total || '0');
    } catch (error) {
      this.logger.error(`Error in getTotalWriteOffs: ${error.message}`, error.stack);
      return 0;
    }
  }

  // Customer Metrics
  private async getActiveCustomers(filters: GetMetricsDto): Promise<number> {
    try {
      const query = this.loanRepository
        .createQueryBuilder('loan')
        .select('COUNT(DISTINCT loan.applicantId)', 'count')
        .where('loan.status IN (:...statuses)', {
          statuses: [LoanStatus.DISBURSED, LoanStatus.ACTIVE, LoanStatus.PARTIALLY_DISBURSED],
        });

      this.applyFilters(query, filters, 'loan');
      const result = await query.getRawOne();
      return parseInt(result?.count || '0', 10);
    } catch (error) {
      this.logger.error(`Error in getActiveCustomers: ${error.message}`, error.stack);
      return 0;
    }
  }

  private async getNewCustomers(filters: GetMetricsDto): Promise<number> {
    try {
      const query = this.loanRepository
        .createQueryBuilder('loan')
        .select('COUNT(DISTINCT loan.applicantId)', 'count');

      if (filters.fromDate) {
        query.andWhere('loan.postingDate >= :fromDate', { fromDate: filters.fromDate });
      }
      if (filters.toDate) {
        query.andWhere('loan.postingDate <= :toDate', { toDate: filters.toDate });
      }

      const result = await query.getRawOne();
      return parseInt(result?.count || '0', 10);
    } catch (error) {
      this.logger.error(`Error in getNewCustomers: ${error.message}`, error.stack);
      return 0;
    }
  }

  private async getAverageLoanSize(filters: GetMetricsDto): Promise<number> {
    try {
      const query = this.loanRepository
        .createQueryBuilder('loan')
        .select('AVG(CAST(loan.loanAmount AS DECIMAL))', 'avg');

      this.applyFilters(query, filters, 'loan');
      const result = await query.getRawOne();
      return parseFloat(result?.avg || '0');
    } catch (error) {
      this.logger.error(`Error in getAverageLoanSize: ${error.message}`, error.stack);
      return 0;
    }
  }

  // Helper method to apply common filters
  private applyFilters(query: any, filters: GetMetricsDto, alias: string): void {
    if (filters.companyId) {
      query.andWhere(`${alias}.companyId = :companyId`, { companyId: filters.companyId });
    }

    if (filters.loanProductId) {
      if (alias === 'loan') {
        query.andWhere(`${alias}.loanProductId = :loanProductId`, {
          loanProductId: filters.loanProductId,
        });
      } else if (alias === 'app') {
        query.andWhere(`${alias}.loanProductId = :loanProductId`, {
          loanProductId: filters.loanProductId,
        });
      }
    }

    if (filters.fromDate) {
      if (alias === 'loan') {
        query.andWhere(`${alias}.postingDate >= :fromDate`, { fromDate: filters.fromDate });
      } else if (alias === 'app') {
        query.andWhere(`${alias}.applicationDate >= :fromDate`, { fromDate: filters.fromDate });
      }
    }

    if (filters.toDate) {
      if (alias === 'loan') {
        query.andWhere(`${alias}.postingDate <= :toDate`, { toDate: filters.toDate });
      } else if (alias === 'app') {
        query.andWhere(`${alias}.applicationDate <= :toDate`, { toDate: filters.toDate });
      }
    }
  }

  /**
   * Get comparative analysis (YoY, MoM, QoQ)
   */
  async getComparativeAnalysis(
    metricId: string,
    filters: GetMetricsDto,
    compareType: 'yoy' | 'mom' | 'qoq' = 'mom',
    interval: 'day' | 'week' | 'month' = 'day',
  ): Promise<{ current: any[]; previous: any[]; comparison: { change: number; percentChange: number } }> {
    const currentData = await this.getTimeSeriesData(metricId, filters, interval);
    
    // Calculate previous period dates
    const previousFilters = { ...filters };
    const now = new Date();
    let periodStart: Date;
    let periodEnd: Date;

    if (filters.fromDate && filters.toDate) {
      periodStart = new Date(filters.fromDate);
      periodEnd = new Date(filters.toDate);
    } else if (filters.fromDate) {
      periodStart = new Date(filters.fromDate);
      periodEnd = now;
    } else {
      // Default to last 30 days
      periodEnd = now;
      periodStart = new Date(now);
      periodStart.setDate(periodStart.getDate() - 30);
    }

    const periodLength = periodEnd.getTime() - periodStart.getTime();

    switch (compareType) {
      case 'yoy':
        previousFilters.fromDate = new Date(periodStart.getTime() - 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        previousFilters.toDate = new Date(periodEnd.getTime() - 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        break;
      case 'mom':
        previousFilters.fromDate = new Date(periodStart.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        previousFilters.toDate = new Date(periodEnd.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        break;
      case 'qoq':
        previousFilters.fromDate = new Date(periodStart.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        previousFilters.toDate = new Date(periodEnd.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        break;
    }

    const previousData = await this.getTimeSeriesData(metricId, previousFilters, interval);

    // Calculate comparison
    const currentTotal = currentData.reduce((sum, item) => sum + (item.value || 0), 0);
    const previousTotal = previousData.reduce((sum, item) => sum + (item.value || 0), 0);
    const change = currentTotal - previousTotal;
    const percentChange = previousTotal !== 0 ? (change / previousTotal) * 100 : 0;

    return {
      current: currentData,
      previous: previousData,
      comparison: {
        change,
        percentChange,
      },
    };
  }
}

