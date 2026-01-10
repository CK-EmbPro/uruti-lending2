import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Loan } from '../../loan/entities/loan.entity';
import { LoanApplication } from '../../loan-application/entities/loan-application.entity';
import { LoanRepayment } from '../../loan-repayment/entities/loan-repayment.entity';
import {
  GetExecutiveKPIsDto,
  ExecutiveKPIsResult,
  CreateCustomReportDto,
  CustomReportResult,
  PredictiveMetricsDto,
  PredictiveMetricsResult,
  TimePeriod,
} from '../dto/executive-bi.dto';
import { LoanStatus } from '../../../common/enums/loan-status.enum';
import { ApplicationStatus } from '../../loan-application/entities/loan-application.entity';

@Injectable()
export class ExecutiveBIService {
  private readonly logger = new Logger(ExecutiveBIService.name);

  constructor(
    @InjectRepository(Loan)
    private readonly loanRepository: Repository<Loan>,
    @InjectRepository(LoanApplication)
    private readonly applicationRepository: Repository<LoanApplication>,
    @InjectRepository(LoanRepayment)
    private readonly repaymentRepository: Repository<LoanRepayment>,
  ) {}

  /**
   * Get executive KPIs
   */
  async getExecutiveKPIs(
    dto: GetExecutiveKPIsDto,
    companyId: string,
  ): Promise<ExecutiveKPIsResult> {
    this.logger.log(`Generating executive KPIs for company ${companyId}`);

    const startDate = dto.startDate ? new Date(dto.startDate) : new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
    const endDate = dto.endDate ? new Date(dto.endDate) : new Date();
    const period = dto.period || TimePeriod.MONTHLY;

    // Get all loans
    const loans = await this.loanRepository.find({
      where: { companyId },
      relations: ['repayments'],
    });

    const applications = await this.applicationRepository.find({
      where: { companyId },
    });

    // Calculate Revenue KPIs
    const revenue = this.calculateRevenueKPIs(loans, startDate, endDate, period);

    // Calculate Portfolio KPIs
    const portfolio = this.calculatePortfolioKPIs(loans, startDate, endDate, period);

    // Calculate Risk KPIs
    const risk = this.calculateRiskKPIs(loans, startDate, endDate, period);

    // Calculate Operational KPIs
    const operational = this.calculateOperationalKPIs(applications, loans, startDate, endDate, period);

    // Calculate Customer KPIs
    const customer = this.calculateCustomerKPIs(applications, loans, startDate, endDate, period);

    // Calculate overall health score
    const overallHealthScore = this.calculateOverallHealthScore(revenue, portfolio, risk, operational, customer);

    // Generate insights
    const insights = this.generateInsights(revenue, portfolio, risk, operational, customer);

    // Generate alerts
    const alerts = this.generateAlerts(revenue, portfolio, risk, operational, customer);

    return {
      revenue,
      portfolio,
      risk,
      operational,
      customer,
      overallHealthScore,
      insights,
      alerts,
    };
  }

  /**
   * Create custom report
   */
  async createCustomReport(
    dto: CreateCustomReportDto,
    companyId: string,
  ): Promise<CustomReportResult> {
    this.logger.log(`Creating custom report: ${dto.reportName}`);

    // Generate report data based on metrics and filters
    const reportData = await this.generateReportData(dto, companyId);

    // Create report result
    const report: CustomReportResult = {
      id: `report-${Date.now()}`,
      reportName: dto.reportName,
      data: reportData,
      generatedAt: new Date().toISOString(),
      exportUrl: `/reports/${Date.now()}/export`,
    };

    return report;
  }

  /**
   * Get predictive metrics
   */
  async getPredictiveMetrics(
    dto: PredictiveMetricsDto,
    companyId: string,
  ): Promise<PredictiveMetricsResult> {
    this.logger.log(`Generating predictive metrics for company ${companyId}`);

    const forecastMonths = dto.forecastMonths || 12;

    // Get historical data
    const loans = await this.loanRepository.find({
      where: { companyId },
    });

    const applications = await this.applicationRepository.find({
      where: { companyId },
    });

    // Generate forecasts
    const revenueForecast = this.forecastRevenue(loans, forecastMonths);
    const portfolioForecast = this.forecastPortfolio(loans, forecastMonths);
    const riskForecast = this.forecastRisk(loans, forecastMonths);
    const customerForecast = this.forecastCustomers(applications, forecastMonths);

    return {
      revenueForecast,
      portfolioForecast,
      riskForecast,
      customerForecast,
    };
  }

  // Private helper methods

  private calculateRevenueKPIs(
    loans: Loan[],
    startDate: Date,
    endDate: Date,
    period: TimePeriod,
  ): any {
    const totalDisbursed = loans.reduce((sum, loan) => sum + (loan.disbursedAmount || loan.loanAmount || 0), 0);
    const totalCollected = loans.reduce((sum, loan) => sum + (loan.totalAmountPaid || 0), 0);
    const totalRevenue = totalCollected - totalDisbursed; // Simplified - would include interest

    // Calculate previous period for growth
    const previousPeriodStart = new Date(startDate);
    previousPeriodStart.setMonth(previousPeriodStart.getMonth() - this.getPeriodMonths(period));
    const previousPeriodEnd = new Date(startDate);

    const previousLoans = loans.filter((loan) => {
      const loanDate = loan.postingDate || loan.createdAt;
      return loanDate >= previousPeriodStart && loanDate < previousPeriodEnd;
    });

    const previousDisbursed = previousLoans.reduce((sum, loan) => sum + (loan.disbursedAmount || loan.loanAmount || 0), 0);
    const revenueGrowth = previousDisbursed > 0 ? ((totalDisbursed - previousDisbursed) / previousDisbursed) * 100 : 0;

    const activeLoans = loans.filter((loan) => loan.status === LoanStatus.ACTIVE);
    const expectedCollections = activeLoans.reduce((sum, loan) => sum + (loan.loanAmount || 0), 0);
    const collectionEfficiency = expectedCollections > 0 ? (totalCollected / expectedCollections) * 100 : 100;

    const averageLoanSize = loans.length > 0 ? totalDisbursed / loans.length : 0;

    // Generate trend data
    const revenueTrend = this.generateTrendData(loans, startDate, endDate, period, (loan) => loan.disbursedAmount || loan.loanAmount || 0);

    return {
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      revenueGrowth: Math.round(revenueGrowth * 100) / 100,
      averageLoanSize: Math.round(averageLoanSize * 100) / 100,
      totalDisbursed: Math.round(totalDisbursed * 100) / 100,
      totalCollected: Math.round(totalCollected * 100) / 100,
      collectionEfficiency: Math.round(collectionEfficiency * 100) / 100,
      revenueTrend,
    };
  }

  private calculatePortfolioKPIs(
    loans: Loan[],
    startDate: Date,
    endDate: Date,
    period: TimePeriod,
  ): any {
    const totalPortfolioValue = loans.reduce((sum, loan) => sum + (loan.loanAmount || 0), 0);
    const activeLoans = loans.filter((loan) => loan.status === LoanStatus.ACTIVE);
    const activeLoansCount = activeLoans.length;

    // Calculate growth
    const previousPeriodStart = new Date(startDate);
    previousPeriodStart.setMonth(previousPeriodStart.getMonth() - this.getPeriodMonths(period));
    const previousPeriodEnd = new Date(startDate);

    const previousLoans = loans.filter((loan) => {
      const loanDate = loan.postingDate || loan.createdAt;
      return loanDate >= previousPeriodStart && loanDate < previousPeriodEnd;
    });

    const previousPortfolioValue = previousLoans.reduce((sum, loan) => sum + (loan.loanAmount || 0), 0);
    const portfolioGrowth = previousPortfolioValue > 0 ? ((totalPortfolioValue - previousPortfolioValue) / previousPortfolioValue) * 100 : 0;

    const averageLoanSize = activeLoansCount > 0 ? totalPortfolioValue / activeLoansCount : 0;

    // Calculate PAR and NPA
    const riskLoans = activeLoans.filter((loan) => (loan.daysPastDue || 0) > 30);
    const npaLoans = activeLoans.filter((loan) => loan.isNpa || (loan.daysPastDue || 0) > 90);

    const totalOutstanding = activeLoans.reduce((sum, loan) => {
      return sum + ((loan.disbursedAmount || loan.loanAmount || 0) - (loan.totalAmountPaid || 0));
    }, 0);

    const parOutstanding = riskLoans.reduce((sum, loan) => {
      return sum + ((loan.disbursedAmount || loan.loanAmount || 0) - (loan.totalAmountPaid || 0));
    }, 0);

    const npaOutstanding = npaLoans.reduce((sum, loan) => {
      return sum + ((loan.disbursedAmount || loan.loanAmount || 0) - (loan.totalAmountPaid || 0));
    }, 0);

    const portfolioAtRisk = totalOutstanding > 0 ? (parOutstanding / totalOutstanding) * 100 : 0;
    const npaRatio = totalOutstanding > 0 ? (npaOutstanding / totalOutstanding) * 100 : 0;

    const portfolioTrend = this.generateTrendData(loans, startDate, endDate, period, (loan) => loan.loanAmount || 0);

    return {
      totalPortfolioValue: Math.round(totalPortfolioValue * 100) / 100,
      activeLoans: activeLoansCount,
      portfolioGrowth: Math.round(portfolioGrowth * 100) / 100,
      averageLoanSize: Math.round(averageLoanSize * 100) / 100,
      portfolioAtRisk: Math.round(portfolioAtRisk * 100) / 100,
      npaRatio: Math.round(npaRatio * 100) / 100,
      portfolioTrend,
    };
  }

  private calculateRiskKPIs(
    loans: Loan[],
    startDate: Date,
    endDate: Date,
    period: TimePeriod,
  ): any {
    const activeLoans = loans.filter((loan) => loan.status === LoanStatus.ACTIVE);

    let highRisk = 0;
    let mediumRisk = 0;
    let lowRisk = 0;
    let totalDPD = 0;
    let loansWithDPD = 0;
    let defaultedLoans = 0;

    for (const loan of activeLoans) {
      const dpd = loan.daysPastDue || 0;
      if (dpd > 0) {
        totalDPD += dpd;
        loansWithDPD++;
      }

      if (dpd > 90 || loan.isNpa) {
        highRisk++;
        defaultedLoans++;
      } else if (dpd > 30) {
        mediumRisk++;
      } else {
        lowRisk++;
      }
    }

    const averageDaysPastDue = loansWithDPD > 0 ? Math.round(totalDPD / loansWithDPD) : 0;
    const defaultRate = activeLoans.length > 0 ? (defaultedLoans / activeLoans.length) * 100 : 0;

    // Calculate overall risk score (0-100, lower is better)
    const riskScore = Math.max(0, Math.min(100, defaultRate * 2 + (averageDaysPastDue / 10)));

    const riskTrend = this.generateTrendData(loans, startDate, endDate, period, (loan) => {
      const dpd = loan.daysPastDue || 0;
      return dpd > 90 ? 100 : dpd > 30 ? 50 : 0;
    });

    return {
      overallRiskScore: Math.round(riskScore * 100) / 100,
      highRiskLoans: highRisk,
      mediumRiskLoans: mediumRisk,
      lowRiskLoans: lowRisk,
      averageDaysPastDue,
      defaultRate: Math.round(defaultRate * 100) / 100,
      riskTrend,
    };
  }

  private calculateOperationalKPIs(
    applications: LoanApplication[],
    loans: Loan[],
    startDate: Date,
    endDate: Date,
    period: TimePeriod,
  ): any {
    const approvedApplications = applications.filter((app) => app.status === ApplicationStatus.APPROVED);
    const rejectedApplications = applications.filter((app) => app.status === ApplicationStatus.REJECTED);
    const totalApplications = applications.length;

    const approvalRate = totalApplications > 0 ? (approvedApplications.length / totalApplications) * 100 : 0;
    const rejectionRate = totalApplications > 0 ? (rejectedApplications.length / totalApplications) * 100 : 0;

    // Calculate average processing time (simplified)
    let totalProcessingTime = 0;
    let processedCount = 0;

    for (const app of applications) {
      if (app.updatedAt && app.createdAt) {
        const processingTime = (app.updatedAt.getTime() - app.createdAt.getTime()) / (1000 * 60 * 60); // Hours
        totalProcessingTime += processingTime;
        processedCount++;
      }
    }

    const averageProcessingTime = processedCount > 0 ? totalProcessingTime / processedCount : 0;

    // Calculate operational efficiency (simplified)
    const operationalEfficiency = Math.max(0, Math.min(100, 100 - (averageProcessingTime / 24) * 10));

    const operationalTrend = this.generateTrendData(applications, startDate, endDate, period, () => 1);

    return {
      approvalRate: Math.round(approvalRate * 100) / 100,
      averageProcessingTime: Math.round(averageProcessingTime * 100) / 100,
      applicationVolume: totalApplications,
      rejectionRate: Math.round(rejectionRate * 100) / 100,
      operationalEfficiency: Math.round(operationalEfficiency * 100) / 100,
      operationalTrend: operationalTrend.map((t) => ({ period: t.period, value: t.value })),
    };
  }

  private calculateCustomerKPIs(
    applications: LoanApplication[],
    loans: Loan[],
    startDate: Date,
    endDate: Date,
    period: TimePeriod,
  ): any {
    // Get unique customers
    const customerIds = new Set<string>();
    applications.forEach((app) => {
      if (app.applicantId) customerIds.add(app.applicantId);
    });
    loans.forEach((loan) => {
      if (loan.applicantId) customerIds.add(loan.applicantId);
    });

    const totalCustomers = customerIds.size;

    // Calculate new customers in period
    const periodApplications = applications.filter((app) => {
      const appDate = app.createdAt;
      return appDate >= startDate && appDate <= endDate;
    });

    const newCustomerIds = new Set<string>();
    periodApplications.forEach((app) => {
      if (app.applicantId) newCustomerIds.add(app.applicantId);
    });
    const newCustomers = newCustomerIds.size;

    // Calculate retention (simplified - customers with multiple loans)
    const customerLoanCounts = new Map<string, number>();
    loans.forEach((loan) => {
      if (loan.applicantId) {
        customerLoanCounts.set(loan.applicantId, (customerLoanCounts.get(loan.applicantId) || 0) + 1);
      }
    });

    const repeatCustomers = Array.from(customerLoanCounts.values()).filter((count) => count > 1).length;
    const customerRetentionRate = totalCustomers > 0 ? (repeatCustomers / totalCustomers) * 100 : 0;

    // Calculate average customer value
    const totalPortfolioValue = loans.reduce((sum, loan) => sum + (loan.loanAmount || 0), 0);
    const averageCustomerValue = totalCustomers > 0 ? totalPortfolioValue / totalCustomers : 0;

    // Customer satisfaction (simplified - would come from surveys)
    const customerSatisfactionScore = 75; // Placeholder

    const customerTrend = this.generateTrendData(applications, startDate, endDate, period, () => 1);

    return {
      totalCustomers,
      newCustomers,
      customerRetentionRate: Math.round(customerRetentionRate * 100) / 100,
      averageCustomerValue: Math.round(averageCustomerValue * 100) / 100,
      customerSatisfactionScore,
      customerTrend: customerTrend.map((t) => ({ period: t.period, value: t.value })),
    };
  }

  private calculateOverallHealthScore(
    revenue: any,
    portfolio: any,
    risk: any,
    operational: any,
    customer: any,
  ): number {
    // Weighted average of all KPIs
    const weights = {
      revenue: 0.25,
      portfolio: 0.25,
      risk: 0.20,
      operational: 0.15,
      customer: 0.15,
    };

    // Normalize each KPI to 0-100 scale
    const revenueScore = Math.min(100, Math.max(0, revenue.collectionEfficiency));
    const portfolioScore = Math.min(100, Math.max(0, 100 - portfolio.portfolioAtRisk - portfolio.npaRatio * 2));
    const riskScore = Math.min(100, Math.max(0, 100 - risk.overallRiskScore));
    const operationalScore = operational.operationalEfficiency;
    const customerScore = customer.customerSatisfactionScore;

    const overallScore =
      revenueScore * weights.revenue +
      portfolioScore * weights.portfolio +
      riskScore * weights.risk +
      operationalScore * weights.operational +
      customerScore * weights.customer;

    return Math.round(overallScore * 100) / 100;
  }

  private generateInsights(
    revenue: any,
    portfolio: any,
    risk: any,
    operational: any,
    customer: any,
  ): string[] {
    const insights: string[] = [];

    if (revenue.revenueGrowth > 10) {
      insights.push(`Strong revenue growth of ${revenue.revenueGrowth.toFixed(1)}% indicates healthy business expansion.`);
    }

    if (portfolio.portfolioGrowth > 15) {
      insights.push(`Portfolio growing at ${portfolio.portfolioGrowth.toFixed(1)}% - excellent market penetration.`);
    }

    if (risk.overallRiskScore < 20) {
      insights.push('Low risk profile - portfolio is well-managed with minimal defaults.');
    }

    if (operational.approvalRate > 70) {
      insights.push(`High approval rate of ${operational.approvalRate.toFixed(1)}% suggests good customer quality.`);
    }

    if (customer.customerRetentionRate > 60) {
      insights.push(`Strong customer retention at ${customer.customerRetentionRate.toFixed(1)}% indicates satisfied customers.`);
    }

    if (insights.length === 0) {
      insights.push('All KPIs are within normal ranges. Continue monitoring for trends.');
    }

    return insights;
  }

  private generateAlerts(
    revenue: any,
    portfolio: any,
    risk: any,
    operational: any,
    customer: any,
  ): string[] {
    const alerts: string[] = [];

    if (portfolio.portfolioAtRisk > 10) {
      alerts.push(`⚠️ High Portfolio at Risk: ${portfolio.portfolioAtRisk.toFixed(1)}% - Review collection strategies.`);
    }

    if (portfolio.npaRatio > 5) {
      alerts.push(`🚨 NPA Ratio above threshold: ${portfolio.npaRatio.toFixed(1)}% - Immediate action required.`);
    }

    if (risk.overallRiskScore > 50) {
      alerts.push(`⚠️ Elevated risk score: ${risk.overallRiskScore.toFixed(1)} - Strengthen risk management.`);
    }

    if (operational.averageProcessingTime > 48) {
      alerts.push(`⚠️ Slow processing time: ${operational.averageProcessingTime.toFixed(1)} hours - Optimize workflows.`);
    }

    if (revenue.collectionEfficiency < 80) {
      alerts.push(`⚠️ Low collection efficiency: ${revenue.collectionEfficiency.toFixed(1)}% - Improve collection processes.`);
    }

    return alerts;
  }

  private generateTrendData(
    entities: any[],
    startDate: Date,
    endDate: Date,
    period: TimePeriod,
    valueExtractor: (entity: any) => number,
  ): Array<{ period: string; value: number }> {
    // Simplified trend generation
    const trend: Array<{ period: string; value: number }> = [];
    const current = new Date(startDate);

    while (current <= endDate) {
      const periodKey = this.getPeriodKey(current, period);
      const periodEntities = entities.filter((entity) => {
        const entityDate = entity.createdAt || entity.postingDate;
        return this.isInPeriod(entityDate, current, period);
      });

      const value = periodEntities.reduce((sum, entity) => sum + valueExtractor(entity), 0);
      trend.push({ period: periodKey, value: Math.round(value * 100) / 100 });

      this.advancePeriod(current, period);
    }

    return trend;
  }

  private getPeriodKey(date: Date, period: TimePeriod): string {
    if (period === TimePeriod.DAILY) {
      return date.toISOString().split('T')[0];
    } else if (period === TimePeriod.WEEKLY) {
      const week = Math.ceil(date.getDate() / 7);
      return `${date.getFullYear()}-W${week}`;
    } else if (period === TimePeriod.MONTHLY) {
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    } else if (period === TimePeriod.QUARTERLY) {
      const quarter = Math.floor(date.getMonth() / 3) + 1;
      return `${date.getFullYear()}-Q${quarter}`;
    } else {
      return String(date.getFullYear());
    }
  }

  private isInPeriod(entityDate: Date, periodStart: Date, period: TimePeriod): boolean {
    const periodEnd = new Date(periodStart);
    this.advancePeriod(periodEnd, period);
    return entityDate >= periodStart && entityDate < periodEnd;
  }

  private advancePeriod(date: Date, period: TimePeriod): void {
    if (period === TimePeriod.DAILY) {
      date.setDate(date.getDate() + 1);
    } else if (period === TimePeriod.WEEKLY) {
      date.setDate(date.getDate() + 7);
    } else if (period === TimePeriod.MONTHLY) {
      date.setMonth(date.getMonth() + 1);
    } else if (period === TimePeriod.QUARTERLY) {
      date.setMonth(date.getMonth() + 3);
    } else {
      date.setFullYear(date.getFullYear() + 1);
    }
  }

  private getPeriodMonths(period: TimePeriod): number {
    switch (period) {
      case TimePeriod.DAILY:
        return 0;
      case TimePeriod.WEEKLY:
        return 0;
      case TimePeriod.MONTHLY:
        return 1;
      case TimePeriod.QUARTERLY:
        return 3;
      case TimePeriod.YEARLY:
        return 12;
      default:
        return 1;
    }
  }

  private async generateReportData(dto: CreateCustomReportDto, companyId: string): Promise<Record<string, any>> {
    // Generate report data based on metrics and filters
    const data: Record<string, any> = {
      reportName: dto.reportName,
      reportType: dto.reportType,
      generatedAt: new Date().toISOString(),
      metrics: {},
    };

    // Generate data for each metric
    for (const metric of dto.metrics) {
      // Simplified - in production, would query actual data based on metric
      data.metrics[metric] = {
        value: Math.random() * 1000,
        trend: 'UP',
      };
    }

    return data;
  }

  private forecastRevenue(loans: Loan[], months: number): any {
    // Simplified forecasting using linear trend
    const historicalRevenue = loans.reduce((sum, loan) => sum + (loan.totalAmountPaid || 0), 0);
    const averageMonthlyRevenue = historicalRevenue / 12; // Assuming 12 months of data

    const forecastData = [];
    for (let i = 1; i <= months; i++) {
      const month = new Date();
      month.setMonth(month.getMonth() + i);
      forecastData.push({
        month: month.toISOString().split('T')[0].substring(0, 7),
        predicted: averageMonthlyRevenue * (1 + 0.02 * i), // 2% growth per month
        confidence: Math.max(70, 100 - i * 2), // Decreasing confidence
      });
    }

    const predictedRevenue = forecastData.reduce((sum, d) => sum + d.predicted, 0);
    const growthRate = 2.0; // 2% monthly growth

    return {
      predictedRevenue: Math.round(predictedRevenue * 100) / 100,
      confidenceInterval: {
        lower: Math.round(predictedRevenue * 0.9 * 100) / 100,
        upper: Math.round(predictedRevenue * 1.1 * 100) / 100,
      },
      growthRate,
      forecastData,
    };
  }

  private forecastPortfolio(loans: Loan[], months: number): any {
    const currentPortfolio = loans.reduce((sum, loan) => sum + (loan.loanAmount || 0), 0);
    const activeLoans = loans.filter((loan) => loan.status === LoanStatus.ACTIVE).length;

    const forecastData = [];
    for (let i = 1; i <= months; i++) {
      const month = new Date();
      month.setMonth(month.getMonth() + i);
      forecastData.push({
        month: month.toISOString().split('T')[0].substring(0, 7),
        predicted: currentPortfolio * (1 + 0.03 * i), // 3% growth
        confidence: Math.max(70, 100 - i * 2),
      });
    }

    const predictedPortfolioValue = forecastData[forecastData.length - 1].predicted;
    const predictedActiveLoans = Math.round(activeLoans * (1 + 0.03 * months));

    return {
      predictedPortfolioValue: Math.round(predictedPortfolioValue * 100) / 100,
      predictedActiveLoans,
      growthRate: 3.0,
      forecastData,
    };
  }

  private forecastRisk(loans: Loan[], months: number): any {
    const activeLoans = loans.filter((loan) => loan.status === LoanStatus.ACTIVE);
    const npaLoans = activeLoans.filter((loan) => loan.isNpa || (loan.daysPastDue || 0) > 90);
    const currentNPA = activeLoans.length > 0 ? (npaLoans.length / activeLoans.length) * 100 : 0;

    const forecastData = [];
    for (let i = 1; i <= months; i++) {
      const month = new Date();
      month.setMonth(month.getMonth() + i);
      forecastData.push({
        month: month.toISOString().split('T')[0].substring(0, 7),
        predicted: currentNPA * (1 + 0.01 * i), // Slight increase
        confidence: Math.max(60, 100 - i * 3),
      });
    }

    const predictedNPA = forecastData[forecastData.length - 1].predicted;
    const predictedDefaultRate = predictedNPA * 0.8; // Default rate typically lower than NPA

    return {
      predictedNPA: Math.round(predictedNPA * 100) / 100,
      predictedDefaultRate: Math.round(predictedDefaultRate * 100) / 100,
      riskTrend: predictedNPA > currentNPA ? 'INCREASING' : predictedNPA < currentNPA ? 'DECREASING' : 'STABLE',
      forecastData,
    };
  }

  private forecastCustomers(applications: LoanApplication[], months: number): any {
    const uniqueCustomers = new Set(applications.map((app) => app.applicantId).filter(Boolean));
    const currentCustomers = uniqueCustomers.size;
    const averageMonthlyNew = currentCustomers / 12; // Assuming 12 months

    const forecastData = [];
    for (let i = 1; i <= months; i++) {
      const month = new Date();
      month.setMonth(month.getMonth() + i);
      forecastData.push({
        month: month.toISOString().split('T')[0].substring(0, 7),
        predicted: averageMonthlyNew * i * 1.05, // 5% growth
        confidence: Math.max(70, 100 - i * 2),
      });
    }

    const predictedNewCustomers = Math.round(averageMonthlyNew * months * 1.05);
    const predictedRetentionRate = 85; // Assumed retention rate

    return {
      predictedNewCustomers,
      predictedRetentionRate,
      growthRate: 5.0,
      forecastData,
    };
  }
}

