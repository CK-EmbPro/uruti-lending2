import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, In } from 'typeorm';
import { Loan } from '../../loan/entities/loan.entity';
import { LoanRepayment } from '../../loan-repayment/entities/loan-repayment.entity';
import { LoanProduct } from '../../loan-product/entities/loan-product.entity';
import { PortfolioAnalyticsDto, PortfolioAnalyticsResult, PortfolioPeriod } from '../dto/portfolio-analytics.dto';
import { LoanStatus } from '../../../common/enums/loan-status.enum';

@Injectable()
export class PortfolioAnalyticsService {
  private readonly logger = new Logger(PortfolioAnalyticsService.name);

  constructor(
    @InjectRepository(Loan)
    private readonly loanRepository: Repository<Loan>,
    @InjectRepository(LoanRepayment)
    private readonly repaymentRepository: Repository<LoanRepayment>,
    @InjectRepository(LoanProduct)
    private readonly loanProductRepository: Repository<LoanProduct>,
  ) {}

  /**
   * Get comprehensive portfolio analytics
   */
  async getPortfolioAnalytics(
    dto: PortfolioAnalyticsDto,
    companyId: string,
  ): Promise<PortfolioAnalyticsResult> {
    this.logger.log(`Generating portfolio analytics for company ${companyId}`);

    // Build query filters
    const where: any = { companyId };
    if (dto.loanProductId) {
      where.loanProductId = dto.loanProductId;
    }
    if (dto.status) {
      where.status = dto.status;
    }

    // Get all loans
    const loans = await this.loanRepository.find({
      where,
      relations: ['loanProduct'],
    });

    // Calculate totals
    const totalPortfolioValue = loans.reduce((sum, loan) => sum + (loan.loanAmount || 0), 0);
    const totalDisbursed = loans.reduce((sum, loan) => sum + (loan.disbursedAmount || 0), 0);
    const totalCollected = loans.reduce((sum, loan) => sum + (loan.totalAmountPaid || 0), 0);
    const totalOutstanding = totalDisbursed - totalCollected;

    // Active loans
    const activeLoans = loans.filter((loan) => loan.status === LoanStatus.ACTIVE);
    const activeLoansCount = activeLoans.length;
    const averageLoanSize = activeLoansCount > 0 ? totalDisbursed / activeLoansCount : 0;

    // Portfolio at Risk (loans with DPD > 30 days)
    const riskLoans: Loan[] = [];
    for (const loan of activeLoans) {
      const dpd = await this.calculateDaysPastDue(loan);
      if (dpd > 30) {
        riskLoans.push(loan);
      }
    }
    const portfolioAtRisk = totalOutstanding > 0
      ? (riskLoans.reduce((sum, loan) => {
          const outstanding = (loan.disbursedAmount || 0) - (loan.totalAmountPaid || 0);
          return sum + outstanding;
        }, 0) / totalOutstanding) * 100
      : 0;

    // NPA Ratio (loans with DPD > 90 days)
    const npaLoans: Loan[] = [];
    for (const loan of activeLoans) {
      const dpd = await this.calculateDaysPastDue(loan);
      if (dpd > 90) {
        npaLoans.push(loan);
      }
    }
    const npaRatio = totalOutstanding > 0
      ? (npaLoans.reduce((sum, loan) => {
          const outstanding = (loan.disbursedAmount || 0) - (loan.totalAmountPaid || 0);
          return sum + outstanding;
        }, 0) / totalOutstanding) * 100
      : 0;

    // Collection efficiency
    const expectedCollections = this.calculateExpectedCollections(activeLoans);
    const collectionEfficiency = expectedCollections > 0 ? (totalCollected / expectedCollections) * 100 : 100;

    // Time-series data
    const timeSeries = this.generateTimeSeries(loans, dto.startDate, dto.endDate, dto.period || PortfolioPeriod.MONTHLY);

    // Product breakdown
    const productBreakdown = this.generateProductBreakdown(loans);

    // Status breakdown
    const statusBreakdown = this.generateStatusBreakdown(loans);

    // Risk metrics
    const riskMetrics = await this.calculateRiskMetrics(activeLoans);

    return {
      totalPortfolioValue,
      totalOutstanding,
      totalDisbursed,
      totalCollected,
      activeLoansCount,
      averageLoanSize: Math.round(averageLoanSize * 100) / 100,
      portfolioAtRisk: Math.round(portfolioAtRisk * 100) / 100,
      npaRatio: Math.round(npaRatio * 100) / 100,
      collectionEfficiency: Math.round(collectionEfficiency * 100) / 100,
      timeSeries,
      productBreakdown,
      statusBreakdown,
      riskMetrics,
    };
  }

  /**
   * Calculate days past due for a loan
   */
  private async calculateDaysPastDue(loan: Loan): Promise<number> {
    // Simplified calculation - in production, use repayment schedule
    if (!loan.repaymentStartDate) {
      return 0;
    }

    const today = new Date();
    // Get last repayment date from repayments table
    const lastRepayment = await this.repaymentRepository.findOne({
      where: { loanId: loan.id },
      order: { postingDate: 'DESC' },
    });
    const lastPaymentDate = lastRepayment
      ? new Date(lastRepayment.postingDate)
      : loan.repaymentStartDate || loan.postingDate;

    const daysPastDue = Math.floor((today.getTime() - lastPaymentDate.getTime()) / (1000 * 60 * 60 * 24));
    return Math.max(0, daysPastDue);
  }

  /**
   * Calculate expected collections
   */
  private calculateExpectedCollections(loans: Loan[]): number {
    // Simplified - sum of all loan amounts (would use repayment schedule in production)
    return loans.reduce((sum, loan) => sum + (loan.loanAmount || 0), 0);
  }

  /**
   * Generate time-series data
   */
  private generateTimeSeries(
    loans: Loan[],
    startDate?: string,
    endDate?: string,
    period: PortfolioPeriod = PortfolioPeriod.MONTHLY,
  ): Array<{
    period: string;
    disbursed: number;
    collected: number;
    outstanding: number;
    newLoans: number;
    closedLoans: number;
  }> {
    const start = startDate ? new Date(startDate) : new Date(new Date().getFullYear(), 0, 1);
    const end = endDate ? new Date(endDate) : new Date();

    const series: Map<string, {
      disbursed: number;
      collected: number;
      outstanding: number;
      newLoans: number;
      closedLoans: number;
    }> = new Map();

    // Initialize periods
    const current = new Date(start);
    while (current <= end) {
      const periodKey = this.getPeriodKey(current, period);
      if (!series.has(periodKey)) {
        series.set(periodKey, {
          disbursed: 0,
          collected: 0,
          outstanding: 0,
          newLoans: 0,
          closedLoans: 0,
        });
      }

      // Move to next period
      if (period === PortfolioPeriod.DAILY) {
        current.setDate(current.getDate() + 1);
      } else if (period === PortfolioPeriod.WEEKLY) {
        current.setDate(current.getDate() + 7);
      } else if (period === PortfolioPeriod.MONTHLY) {
        current.setMonth(current.getMonth() + 1);
      } else if (period === PortfolioPeriod.QUARTERLY) {
        current.setMonth(current.getMonth() + 3);
      } else {
        current.setFullYear(current.getFullYear() + 1);
      }
    }

    // Aggregate loan data
    for (const loan of loans) {
      const disbursementDate = loan.disbursementDate || loan.postingDate;
      const periodKey = this.getPeriodKey(disbursementDate, period);

      if (series.has(periodKey)) {
        const data = series.get(periodKey)!;
        data.disbursed += loan.disbursedAmount || loan.loanAmount || 0;
        data.collected += loan.totalAmountPaid || 0;
        data.outstanding += (loan.disbursedAmount || loan.loanAmount || 0) - (loan.totalAmountPaid || 0);
        data.newLoans += 1;
      }

      if (loan.status === LoanStatus.CLOSED || loan.status === LoanStatus.SETTLED) {
        const closureDate = loan.closureDate || loan.updatedAt;
        const closurePeriod = this.getPeriodKey(closureDate, period);
        if (series.has(closurePeriod)) {
          series.get(closurePeriod)!.closedLoans += 1;
        }
      }
    }

    return Array.from(series.entries()).map(([period, data]) => ({
      period,
      ...data,
    }));
  }

  /**
   * Get period key for grouping
   */
  private getPeriodKey(date: Date, period: PortfolioPeriod): string {
    const d = new Date(date);
    if (period === PortfolioPeriod.DAILY) {
      return d.toISOString().split('T')[0];
    } else if (period === PortfolioPeriod.WEEKLY) {
      const week = Math.ceil(d.getDate() / 7);
      return `${d.getFullYear()}-W${week}`;
    } else if (period === PortfolioPeriod.MONTHLY) {
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    } else if (period === PortfolioPeriod.QUARTERLY) {
      const quarter = Math.floor(d.getMonth() / 3) + 1;
      return `${d.getFullYear()}-Q${quarter}`;
    } else {
      return String(d.getFullYear());
    }
  }

  /**
   * Generate product breakdown
   */
  private generateProductBreakdown(loans: Loan[]): Array<{
    productId: string;
    productName: string;
    loanCount: number;
    totalDisbursed: number;
    totalOutstanding: number;
    averageSize: number;
  }> {
    const breakdown: Map<string, {
      productId: string;
      productName: string;
      loanCount: number;
      totalDisbursed: number;
      totalOutstanding: number;
    }> = new Map();

    for (const loan of loans) {
      const productId = loan.loanProductId;
      const productName = loan.loanProduct?.productName || 'Unknown';

      if (!breakdown.has(productId)) {
        breakdown.set(productId, {
          productId,
          productName,
          loanCount: 0,
          totalDisbursed: 0,
          totalOutstanding: 0,
        });
      }

      const data = breakdown.get(productId)!;
      data.loanCount += 1;
      data.totalDisbursed += loan.disbursedAmount || loan.loanAmount || 0;
      data.totalOutstanding +=
        (loan.disbursedAmount || loan.loanAmount || 0) - (loan.totalAmountPaid || 0);
    }

    return Array.from(breakdown.values()).map((data) => ({
      ...data,
      averageSize: data.loanCount > 0 ? data.totalDisbursed / data.loanCount : 0,
    }));
  }

  /**
   * Generate status breakdown
   */
  private generateStatusBreakdown(loans: Loan[]): Array<{
    status: string;
    count: number;
    totalAmount: number;
  }> {
    const breakdown: Map<string, { count: number; totalAmount: number }> = new Map();

    for (const loan of loans) {
      const status = loan.status;
      if (!breakdown.has(status)) {
        breakdown.set(status, { count: 0, totalAmount: 0 });
      }

      const data = breakdown.get(status)!;
      data.count += 1;
      data.totalAmount += loan.loanAmount || 0;
    }

    return Array.from(breakdown.entries()).map(([status, data]) => ({
      status,
      ...data,
    }));
  }

  /**
   * Calculate risk metrics
   */
  private async calculateRiskMetrics(loans: Loan[]): Promise<{
    highRiskLoans: number;
    mediumRiskLoans: number;
    lowRiskLoans: number;
    averageDaysPastDue: number;
  }> {
    let highRisk = 0;
    let mediumRisk = 0;
    let lowRisk = 0;
    let totalDPD = 0;
    let loansWithDPD = 0;

    for (const loan of loans) {
      const dpd = await this.calculateDaysPastDue(loan);
      if (dpd > 0) {
        totalDPD += dpd;
        loansWithDPD += 1;
      }

      if (dpd > 90) {
        highRisk += 1;
      } else if (dpd > 30) {
        mediumRisk += 1;
      } else {
        lowRisk += 1;
      }
    }

    return {
      highRiskLoans: highRisk,
      mediumRiskLoans: mediumRisk,
      lowRiskLoans: lowRisk,
      averageDaysPastDue: loansWithDPD > 0 ? Math.round(totalDPD / loansWithDPD) : 0,
    };
  }
}

