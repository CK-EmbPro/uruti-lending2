import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, In, LessThanOrEqual, MoreThanOrEqual } from 'typeorm';
import { Loan } from '../loan/entities/loan.entity';
import { LoanRepayment } from '../loan-repayment/entities/loan-repayment.entity';
import { LoanDisbursement } from '../loan-disbursement/entities/loan-disbursement.entity';
import { LoanApplication } from '../loan-application/entities/loan-application.entity';
import { LoanStatus } from '../../common/enums/loan-status.enum';
import { ApplicationStatus } from '../loan-application/entities/loan-application.entity';
import { PortfolioReportDto } from './dto/portfolio-report.dto';
import { NpaReportDto } from './dto/npa-report.dto';
import { CollectionReportDto } from './dto/collection-report.dto';
import { PortfolioPerformanceDto } from './dto/portfolio-performance.dto';
import { GenerateRegulatoryReportDto, ReviewRegulatoryReportDto, SubmitRegulatoryReportDto } from './dto/regulatory-report.dto';
import { RollRateAnalysisDto } from './dto/roll-rate-analysis.dto';
import { FairLendingAnalysisDto, ReviewFairLendingAnalysisDto } from './dto/fair-lending-analysis.dto';
import { PortfolioMetrics } from './entities/portfolio-metrics.entity';
import { RegulatoryReport, RegulatoryReportType, RegulatoryReportStatus } from './entities/regulatory-report.entity';
import { RollRateAnalysis, AnalysisType } from './entities/roll-rate-analysis.entity';
import { FairLendingAnalysis, FairLendingAnalysisType } from './entities/fair-lending-analysis.entity';
import { DelinquencyRecord } from '../collections/entities/delinquency-record.entity';
import { CollectionStage } from '../../common/enums/collection-stage.enum';

@Injectable()
export class ReportingService {
  constructor(
    @InjectRepository(Loan)
    private readonly loanRepository: Repository<Loan>,
    @InjectRepository(LoanRepayment)
    private readonly repaymentRepository: Repository<LoanRepayment>,
    @InjectRepository(LoanDisbursement)
    private readonly disbursementRepository: Repository<LoanDisbursement>,
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
   * Generate portfolio report
   * Shows loan portfolio summary with outstanding amounts
   */
  async getPortfolioReport(filters: PortfolioReportDto): Promise<{
    totalLoans: number;
    totalDisbursed: number;
    totalOutstanding: number;
    totalPrincipalOutstanding: number;
    totalInterestOutstanding: number;
    totalPenaltyOutstanding: number;
    activeLoans: number;
    closedLoans: number;
    npaLoans: number;
    byStatus: Record<string, number>;
    byProduct: Array<{
      productId: string;
      productName: string;
      count: number;
      disbursed: number;
      outstanding: number;
    }>;
  }> {
    const query = this.loanRepository.createQueryBuilder('loan');

    if (filters.companyId) {
      query.andWhere('loan.companyId = :companyId', { companyId: filters.companyId });
    }

    if (filters.loanProductId) {
      query.andWhere('loan.loanProductId = :loanProductId', {
        loanProductId: filters.loanProductId,
      });
    }

    if (filters.fromDate) {
      query.andWhere('loan.postingDate >= :fromDate', {
        fromDate: filters.fromDate,
      });
    }

    if (filters.toDate) {
      query.andWhere('loan.postingDate <= :toDate', { toDate: filters.toDate });
    }

    const loans = await query.getMany();

    // Calculate totals
    const totalLoans = loans.length;
    const totalDisbursed = loans.reduce(
      (sum, loan) => sum + Number(loan.disbursedAmount || 0),
      0,
    );

    const totalOutstanding = loans.reduce((sum, loan) => {
      const outstanding =
        Number(loan.disbursedAmount || 0) -
        Number(loan.totalPrincipalPaid || 0) +
        Number(loan.totalInterestPayable || 0) +
        Number(loan.totalPenaltyPaid || 0);
      return sum + Math.max(0, outstanding);
    }, 0);

    const totalPrincipalOutstanding = loans.reduce(
      (sum, loan) =>
        sum +
        Math.max(
          0,
          Number(loan.disbursedAmount || 0) - Number(loan.totalPrincipalPaid || 0),
        ),
      0,
    );

    const totalInterestOutstanding = loans.reduce(
      (sum, loan) => sum + Number(loan.totalInterestPayable || 0),
      0,
    );

    const totalPenaltyOutstanding = loans.reduce(
      (sum, loan) => sum + Number(loan.totalPenaltyPaid || 0),
      0,
    );

    const activeLoans = loans.filter(
      (loan) =>
        loan.status === LoanStatus.ACTIVE || loan.status === LoanStatus.DISBURSED,
    ).length;

    const closedLoans = loans.filter(
      (loan) =>
        loan.status === LoanStatus.CLOSED || loan.status === LoanStatus.SETTLED,
    ).length;

    const npaLoans = loans.filter((loan) => loan.isNpa).length;

    // Group by status
    const byStatus: Record<string, number> = {};
    for (const loan of loans) {
      byStatus[loan.status] = (byStatus[loan.status] || 0) + 1;
    }

    // Group by product
    const productMap = new Map<string, { productId: string; loans: Loan[] }>();
    for (const loan of loans) {
      const productId = loan.loanProductId;
      if (!productMap.has(productId)) {
        productMap.set(productId, { productId, loans: [] });
      }
      productMap.get(productId).loans.push(loan);
    }

    const byProduct = Array.from(productMap.values()).map(({ productId, loans }) => {
      const disbursed = loans.reduce(
        (sum, loan) => sum + Number(loan.disbursedAmount || 0),
        0,
      );
      const outstanding = loans.reduce((sum, loan) => {
        const out =
          Number(loan.disbursedAmount || 0) -
          Number(loan.totalPrincipalPaid || 0) +
          Number(loan.totalInterestPayable || 0);
        return sum + Math.max(0, out);
      }, 0);

      return {
        productId,
        productName: `Product ${productId}`, // TODO: Join with LoanProduct to get name
        count: loans.length,
        disbursed,
        outstanding,
      };
    });

    return {
      totalLoans,
      totalDisbursed,
      totalOutstanding,
      totalPrincipalOutstanding,
      totalInterestOutstanding,
      totalPenaltyOutstanding,
      activeLoans,
      closedLoans,
      npaLoans,
      byStatus,
      byProduct,
    };
  }

  /**
   * Generate NPA report
   * Shows Non-Performing Assets with classification details
   */
  async getNpaReport(filters: NpaReportDto): Promise<{
    totalNpaLoans: number;
    totalNpaAmount: number;
    byClassification: Array<{
      classificationCode: string;
      classificationName: string;
      count: number;
      amount: number;
      averageDpd: number;
    }>;
    npaLoans: Array<{
      loanId: string;
      loanNumber: string;
      applicantId: string;
      disbursedAmount: number;
      outstandingAmount: number;
      daysPastDue: number;
      classificationCode: string;
      classificationName: string;
      isNpa: boolean;
    }>;
  }> {
    const query = this.loanRepository.createQueryBuilder('loan');

    if (filters.companyId) {
      query.andWhere('loan.companyId = :companyId', { companyId: filters.companyId });
    }

    if (filters.npaOnly !== false) {
      query.andWhere('loan.isNpa = :isNpa', { isNpa: true });
    }

    if (filters.classificationCode) {
      query.andWhere('loan.classificationCode = :classificationCode', {
        classificationCode: filters.classificationCode,
      });
    }

    const loans = await query.getMany();

    const totalNpaLoans = loans.length;
    const totalNpaAmount = loans.reduce((sum, loan) => {
      const outstanding =
        Number(loan.disbursedAmount || 0) -
        Number(loan.totalPrincipalPaid || 0) +
        Number(loan.totalInterestPayable || 0);
      return sum + Math.max(0, outstanding);
    }, 0);

    // Group by classification
    const classificationMap = new Map<
      string,
      { code: string; name: string; loans: Loan[] }
    >();
    for (const loan of loans) {
      const code = loan.classificationCode || 'Standard';
      const name = loan.classificationName || 'Standard';
      if (!classificationMap.has(code)) {
        classificationMap.set(code, { code, name, loans: [] });
      }
      classificationMap.get(code).loans.push(loan);
    }

    const byClassification = Array.from(classificationMap.values()).map(
      ({ code, name, loans }) => {
        const amount = loans.reduce((sum, loan) => {
          const out =
            Number(loan.disbursedAmount || 0) -
            Number(loan.totalPrincipalPaid || 0) +
            Number(loan.totalInterestPayable || 0);
          return sum + Math.max(0, out);
        }, 0);

        const averageDpd =
          loans.reduce((sum, loan) => sum + Number(loan.daysPastDue || 0), 0) /
          loans.length;

        return {
          classificationCode: code,
          classificationName: name,
          count: loans.length,
          amount,
          averageDpd: Math.round(averageDpd * 100) / 100,
        };
      },
    );

    const npaLoans = loans.map((loan) => {
      const outstanding =
        Number(loan.disbursedAmount || 0) -
        Number(loan.totalPrincipalPaid || 0) +
        Number(loan.totalInterestPayable || 0);

      return {
        loanId: loan.id,
        loanNumber: loan.loanNumber,
        applicantId: loan.applicantId,
        disbursedAmount: Number(loan.disbursedAmount || 0),
        outstandingAmount: Math.max(0, outstanding),
        daysPastDue: Number(loan.daysPastDue || 0),
        classificationCode: loan.classificationCode || 'Standard',
        classificationName: loan.classificationName || 'Standard',
        isNpa: loan.isNpa,
      };
    });

    return {
      totalNpaLoans,
      totalNpaAmount,
      byClassification,
      npaLoans,
    };
  }

  /**
   * Generate collection report
   * Shows repayment collections for a period
   */
  async getCollectionReport(filters: CollectionReportDto): Promise<{
    totalCollections: number;
    totalPrincipalCollected: number;
    totalInterestCollected: number;
    totalPenaltyCollected: number;
    totalChargesCollected: number;
    collectionCount: number;
    byDate: Array<{
      date: string;
      count: number;
      amount: number;
    }>;
    byProduct: Array<{
      productId: string;
      productName: string;
      count: number;
      amount: number;
    }>;
  }> {
    const query = this.repaymentRepository.createQueryBuilder('repayment');

    query.where('repayment.postingDate >= :fromDate', {
      fromDate: filters.fromDate,
    });
    query.andWhere('repayment.postingDate <= :toDate', { toDate: filters.toDate });

    // Get loans for filtering
    if (filters.companyId || filters.loanProductId) {
      const loanQuery = this.loanRepository.createQueryBuilder('loan');
      if (filters.companyId) {
        loanQuery.andWhere('loan.companyId = :companyId', {
          companyId: filters.companyId,
        });
      }
      if (filters.loanProductId) {
        loanQuery.andWhere('loan.loanProductId = :loanProductId', {
          loanProductId: filters.loanProductId,
        });
      }
      const loanIds = (await loanQuery.select('loan.id').getRawMany()).map(
        (r) => r.loan_id,
      );
      if (loanIds.length > 0) {
        query.andWhere('repayment.loanId IN (:...loanIds)', { loanIds });
      } else {
        // No loans match, return empty result
        return {
          totalCollections: 0,
          totalPrincipalCollected: 0,
          totalInterestCollected: 0,
          totalPenaltyCollected: 0,
          totalChargesCollected: 0,
          collectionCount: 0,
          byDate: [],
          byProduct: [],
        };
      }
    }

    const repayments = await query.getMany();

    const totalCollections = repayments.reduce(
      (sum, r) => sum + Number(r.amountPaid || 0),
      0,
    );
    const totalPrincipalCollected = repayments.reduce(
      (sum, r) => sum + Number(r.principalPaid || 0),
      0,
    );
    const totalInterestCollected = repayments.reduce(
      (sum, r) => sum + Number(r.interestPaid || 0),
      0,
    );
    const totalPenaltyCollected = repayments.reduce(
      (sum, r) => sum + Number(r.penaltyPaid || 0),
      0,
    );
    const totalChargesCollected = repayments.reduce(
      (sum, r) => sum + Number(r.chargesPaid || 0),
      0,
    );
    const collectionCount = repayments.length;

    // Group by date
    const dateMap = new Map<string, { count: number; amount: number }>();
    for (const repayment of repayments) {
      const date = repayment.postingDate.toISOString().split('T')[0];
      if (!dateMap.has(date)) {
        dateMap.set(date, { count: 0, amount: 0 });
      }
      const entry = dateMap.get(date);
      entry.count++;
      entry.amount += Number(repayment.amountPaid || 0);
    }

    const byDate = Array.from(dateMap.entries())
      .map(([date, data]) => ({
        date,
        ...data,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Group by product
    const loanIds = [...new Set(repayments.map((r) => r.loanId))];
    const loans = await this.loanRepository.find({
      where: { id: In(loanIds) },
    });

    const loanProductMap = new Map(loans.map((l) => [l.id, l.loanProductId]));
    const productMap = new Map<
      string,
      { productId: string; count: number; amount: number }
    >();

    for (const repayment of repayments) {
      const productId = loanProductMap.get(repayment.loanId) || 'Unknown';
      if (!productMap.has(productId)) {
        productMap.set(productId, { productId, count: 0, amount: 0 });
      }
      const entry = productMap.get(productId);
      entry.count++;
      entry.amount += Number(repayment.amountPaid || 0);
    }

    const byProduct = Array.from(productMap.values()).map((entry) => ({
      ...entry,
      productName: `Product ${entry.productId}`, // TODO: Join with LoanProduct
    }));

    return {
      totalCollections,
      totalPrincipalCollected,
      totalInterestCollected,
      totalPenaltyCollected,
      totalChargesCollected,
      collectionCount,
      byDate,
      byProduct,
    };
  }

  /**
   * Generate disbursement report
   */
  async getDisbursementReport(filters: {
    fromDate?: string;
    toDate?: string;
    companyId?: string;
    loanProductId?: string;
  }): Promise<{
    totalDisbursements: number;
    totalAmount: number;
    disbursementCount: number;
    byDate: Array<{
      date: string;
      count: number;
      amount: number;
    }>;
    byProduct: Array<{
      productId: string;
      productName: string;
      count: number;
      amount: number;
    }>;
  }> {
    const query = this.disbursementRepository.createQueryBuilder('disbursement');

    if (filters.fromDate) {
      query.andWhere('disbursement.disbursementDate >= :fromDate', {
        fromDate: filters.fromDate,
      });
    }

    if (filters.toDate) {
      query.andWhere('disbursement.disbursementDate <= :toDate', {
        toDate: filters.toDate,
      });
    }

    // Get loans for filtering
    if (filters.companyId || filters.loanProductId) {
      const loanQuery = this.loanRepository.createQueryBuilder('loan');
      if (filters.companyId) {
        loanQuery.andWhere('loan.companyId = :companyId', {
          companyId: filters.companyId,
        });
      }
      if (filters.loanProductId) {
        loanQuery.andWhere('loan.loanProductId = :loanProductId', {
          loanProductId: filters.loanProductId,
        });
      }
      const loanIds = (await loanQuery.select('loan.id').getRawMany()).map(
        (r) => r.loan_id,
      );
      if (loanIds.length > 0) {
        query.andWhere('disbursement.loanId IN (:...loanIds)', { loanIds });
      } else {
        return {
          totalDisbursements: 0,
          totalAmount: 0,
          disbursementCount: 0,
          byDate: [],
          byProduct: [],
        };
      }
    }

    const disbursements = await query.getMany();

    const totalAmount = disbursements.reduce(
      (sum, d) => sum + Number(d.disbursedAmount || 0),
      0,
    );
    const disbursementCount = disbursements.length;

    // Group by date
    const dateMap = new Map<string, { count: number; amount: number }>();
    for (const disbursement of disbursements) {
      const date = disbursement.disbursementDate.toISOString().split('T')[0];
      if (!dateMap.has(date)) {
        dateMap.set(date, { count: 0, amount: 0 });
      }
      const entry = dateMap.get(date);
      entry.count++;
      entry.amount += Number(disbursement.disbursedAmount || 0);
    }

    const byDate = Array.from(dateMap.entries())
      .map(([date, data]) => ({
        date,
        ...data,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Group by product
    const loanIds = [...new Set(disbursements.map((d) => d.loanId))];
    const loans = await this.loanRepository.find({
      where: { id: In(loanIds) },
    });

    const loanProductMap = new Map(loans.map((l) => [l.id, l.loanProductId]));
    const productMap = new Map<
      string,
      { productId: string; count: number; amount: number }
    >();

    for (const disbursement of disbursements) {
      const productId = loanProductMap.get(disbursement.loanId) || 'Unknown';
      if (!productMap.has(productId)) {
        productMap.set(productId, { productId, count: 0, amount: 0 });
      }
      const entry = productMap.get(productId);
      entry.count++;
      entry.amount += Number(disbursement.disbursedAmount || 0);
    }

    const byProduct = Array.from(productMap.values()).map((entry) => ({
      ...entry,
      productName: `Product ${entry.productId}`,
    }));

    return {
      totalDisbursements: totalAmount,
      totalAmount,
      disbursementCount,
      byDate,
      byProduct,
    };
  }

  /**
   * Generate overdue report
   */
  async getOverdueReport(filters: {
    asOnDate?: string;
    companyId?: string;
    loanProductId?: string;
    minDaysPastDue?: number;
  }): Promise<{
    totalOverdueLoans: number;
    totalOverdueAmount: number;
    byDaysPastDue: Array<{
      range: string;
      count: number;
      amount: number;
    }>;
    overdueLoans: Array<{
      loanId: string;
      loanNumber: string;
      applicantId: string;
      daysPastDue: number;
      overdueAmount: number;
      lastPaymentDate: Date | null;
    }>;
  }> {
    const query = this.loanRepository.createQueryBuilder('loan');

    query.where('loan.daysPastDue > :minDays', {
      minDays: filters.minDaysPastDue || 0,
    });

    if (filters.companyId) {
      query.andWhere('loan.companyId = :companyId', { companyId: filters.companyId });
    }

    if (filters.loanProductId) {
      query.andWhere('loan.loanProductId = :loanProductId', {
        loanProductId: filters.loanProductId,
      });
    }

    const loans = await query.getMany();

    const totalOverdueLoans = loans.length;
    const totalOverdueAmount = loans.reduce((sum, loan) => {
      const outstanding =
        Number(loan.disbursedAmount || 0) -
        Number(loan.totalPrincipalPaid || 0) +
        Number(loan.totalInterestPayable || 0);
      return sum + Math.max(0, outstanding);
    }, 0);

    // Group by DPD ranges
    const ranges = [
      { min: 1, max: 30, label: '1-30 days' },
      { min: 31, max: 60, label: '31-60 days' },
      { min: 61, max: 90, label: '61-90 days' },
      { min: 91, max: 180, label: '91-180 days' },
      { min: 181, max: 365, label: '181-365 days' },
      { min: 366, max: Infinity, label: '366+ days' },
    ];

    const byDaysPastDue = ranges.map((range) => {
      const matchingLoans = loans.filter(
        (loan) =>
          loan.daysPastDue >= range.min && loan.daysPastDue <= range.max,
      );
      const amount = matchingLoans.reduce((sum, loan) => {
        const outstanding =
          Number(loan.disbursedAmount || 0) -
          Number(loan.totalPrincipalPaid || 0) +
          Number(loan.totalInterestPayable || 0);
        return sum + Math.max(0, outstanding);
      }, 0);

      return {
        range: range.label,
        count: matchingLoans.length,
        amount,
      };
    });

    // Get last payment dates
    const loanIds = loans.map((l) => l.id);
    const lastPayments = await this.repaymentRepository
      .createQueryBuilder('repayment')
      .select('repayment.loanId', 'loanId')
      .addSelect('MAX(repayment.postingDate)', 'lastPaymentDate')
      .where('repayment.loanId IN (:...loanIds)', { loanIds })
      .groupBy('repayment.loanId')
      .getRawMany();

    const lastPaymentMap = new Map(
      lastPayments.map((p) => [
        p.loanId,
        p.lastPaymentDate ? new Date(p.lastPaymentDate) : null,
      ]),
    );

    const overdueLoans = loans.map((loan) => {
      const outstanding =
        Number(loan.disbursedAmount || 0) -
        Number(loan.totalPrincipalPaid || 0) +
        Number(loan.totalInterestPayable || 0);

      return {
        loanId: loan.id,
        loanNumber: loan.loanNumber,
        applicantId: loan.applicantId,
        daysPastDue: Number(loan.daysPastDue || 0),
        overdueAmount: Math.max(0, outstanding),
        lastPaymentDate: lastPaymentMap.get(loan.id) || null,
      };
    });

    return {
      totalOverdueLoans,
      totalOverdueAmount,
      byDaysPastDue,
      overdueLoans: overdueLoans.sort((a, b) => b.daysPastDue - a.daysPastDue),
    };
  }
}

