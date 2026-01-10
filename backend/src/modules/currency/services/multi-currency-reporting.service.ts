import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThanOrEqual, Between, Not, IsNull } from 'typeorm';
import { Loan } from '../../loan/entities/loan.entity';
import { LoanDisbursement } from '../../loan-disbursement/entities/loan-disbursement.entity';
import { LoanRepayment } from '../../loan-repayment/entities/loan-repayment.entity';
import { Currency } from '../entities/currency.entity';
import { ExchangeRate } from '../entities/exchange-rate.entity';
import { CurrencyConversionService } from './currency-conversion.service';

export interface PortfolioByCurrency {
  currency: Currency;
  totalLoans: number;
  totalLoanAmount: number;
  totalLoanAmountBaseCurrency: number;
  totalDisbursed: number;
  totalDisbursedBaseCurrency: number;
  totalRepaid: number;
  totalRepaidBaseCurrency: number;
  outstandingAmount: number;
  outstandingAmountBaseCurrency: number;
  averageExchangeRate: number;
}

export interface FXExposureReport {
  currency: Currency;
  exposure: number;
  exposureBaseCurrency: number;
  currentRate: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  hedgedAmount: number;
  unhedgedAmount: number;
  unhedgedAmountBaseCurrency: number;
}

export interface ExchangeRateHistory {
  date: Date;
  fromCurrency: Currency;
  toCurrency: Currency;
  rate: number;
  change: number;
  changePercent: number;
}

/**
 * Multi-Currency Reporting Service
 * Provides reporting capabilities for multi-currency operations
 */
@Injectable()
export class MultiCurrencyReportingService {
  private readonly logger = new Logger(MultiCurrencyReportingService.name);

  constructor(
    @InjectRepository(Loan)
    private readonly loanRepository: Repository<Loan>,
    @InjectRepository(LoanDisbursement)
    private readonly disbursementRepository: Repository<LoanDisbursement>,
    @InjectRepository(LoanRepayment)
    private readonly repaymentRepository: Repository<LoanRepayment>,
    @InjectRepository(Currency)
    private readonly currencyRepository: Repository<Currency>,
    @InjectRepository(ExchangeRate)
    private readonly exchangeRateRepository: Repository<ExchangeRate>,
    private readonly currencyConversionService: CurrencyConversionService,
  ) {}

  /**
   * Get portfolio summary by currency
   */
  async getPortfolioByCurrency(
    companyId?: string,
    status?: string[],
  ): Promise<PortfolioByCurrency[]> {
    const query = this.loanRepository
      .createQueryBuilder('loan')
      .leftJoinAndSelect('loan.currency', 'currency')
      .where('loan.currencyId IS NOT NULL');

    if (companyId) {
      query.andWhere('loan.companyId = :companyId', { companyId });
    }

    if (status && status.length > 0) {
      query.andWhere('loan.status IN (:...status)', { status });
    }

    const loans = await query.getMany();

    // Group by currency
    const currencyMap = new Map<string, PortfolioByCurrency>();

    for (const loan of loans) {
      if (!loan.currency) continue;

      const currencyCode = loan.currency.code;
      if (!currencyMap.has(currencyCode)) {
        currencyMap.set(currencyCode, {
          currency: loan.currency,
          totalLoans: 0,
          totalLoanAmount: 0,
          totalLoanAmountBaseCurrency: 0,
          totalDisbursed: 0,
          totalDisbursedBaseCurrency: 0,
          totalRepaid: 0,
          totalRepaidBaseCurrency: 0,
          outstandingAmount: 0,
          outstandingAmountBaseCurrency: 0,
          averageExchangeRate: 0,
        });
      }

      const portfolio = currencyMap.get(currencyCode)!;
      portfolio.totalLoans++;
      portfolio.totalLoanAmount += Number(loan.loanAmount);
      portfolio.totalLoanAmountBaseCurrency += Number(loan.loanAmountBaseCurrency || 0);
      portfolio.totalDisbursed += Number(loan.disbursedAmount);
    }

    // Get disbursements and repayments
    for (const [currencyCode, portfolio] of currencyMap.entries()) {
      const currency = portfolio.currency;

      // Get disbursements
      const disbursements = await this.disbursementRepository.find({
        where: { loan: { currencyId: currency.id } },
        relations: ['loan'],
      });

      for (const disbursement of disbursements) {
        portfolio.totalDisbursedBaseCurrency += Number(
          disbursement.disbursedAmountBaseCurrency || 0,
        );
      }

      // Get repayments
      const repayments = await this.repaymentRepository.find({
        where: { loan: { currencyId: currency.id } },
        relations: ['loan'],
      });

      for (const repayment of repayments) {
        portfolio.totalRepaid += Number(repayment.amountPaid);
        portfolio.totalRepaidBaseCurrency += Number(repayment.amountPaidBaseCurrency || 0);
      }

      // Calculate outstanding
      portfolio.outstandingAmount = portfolio.totalDisbursed - portfolio.totalRepaid;
      portfolio.outstandingAmountBaseCurrency =
        portfolio.totalDisbursedBaseCurrency - portfolio.totalRepaidBaseCurrency;

      // Calculate average exchange rate
      if (portfolio.totalLoanAmountBaseCurrency > 0 && portfolio.totalLoanAmount > 0) {
        portfolio.averageExchangeRate =
          portfolio.totalLoanAmountBaseCurrency / portfolio.totalLoanAmount;
      }
    }

    return Array.from(currencyMap.values());
  }

  /**
   * Get FX exposure report
   */
  async getFXExposureReport(companyId?: string): Promise<FXExposureReport[]> {
    const baseCurrency = await this.currencyConversionService.getBaseCurrency();
    const currencies = await this.currencyRepository.find({
      where: { status: 'ACTIVE' as any, isBaseCurrency: false },
    });

    const exposureReports: FXExposureReport[] = [];

    for (const currency of currencies) {
      const query = this.loanRepository
        .createQueryBuilder('loan')
        .where('loan.currencyId = :currencyId', { currencyId: currency.id })
        .andWhere('loan.status IN (:...status)', {
          status: ['DISBURSED', 'ACTIVE', 'PARTIALLY_DISBURSED'],
        });

      if (companyId) {
        query.andWhere('loan.companyId = :companyId', { companyId });
      }

      const loans = await query.getMany();

      let totalExposure = 0;
      let totalExposureBaseCurrency = 0;

      for (const loan of loans) {
        const outstanding = Number(loan.loanAmount) - Number(loan.disbursedAmount);
        totalExposure += outstanding;

        if (loan.loanAmountBaseCurrency) {
          const outstandingBase =
            Number(loan.loanAmountBaseCurrency) -
            (Number(loan.disbursedAmount) * Number(loan.exchangeRateAtDisbursement || 1));
          totalExposureBaseCurrency += outstandingBase;
        } else {
          // Calculate if not set
          const conversion = await this.currencyConversionService.convertAmount(
            outstanding,
            currency.id,
            baseCurrency.id,
          );
          totalExposureBaseCurrency += conversion.convertedAmount;
        }
      }

      // Get current exchange rate
      const currentRate = await this.currencyConversionService.getExchangeRate(
        currency.code,
        baseCurrency.code,
      );

      // Determine risk level
      let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' = 'LOW';
      if (totalExposureBaseCurrency > 100000) {
        riskLevel = 'HIGH';
      } else if (totalExposureBaseCurrency > 50000) {
        riskLevel = 'MEDIUM';
      }

      exposureReports.push({
        currency,
        exposure: totalExposure,
        exposureBaseCurrency: totalExposureBaseCurrency,
        currentRate,
        riskLevel,
        hedgedAmount: 0, // Would need to query hedging positions
        unhedgedAmount: totalExposure,
        unhedgedAmountBaseCurrency: totalExposureBaseCurrency,
      });
    }

    return exposureReports;
  }

  /**
   * Get exchange rate history
   */
  async getExchangeRateHistory(
    fromCurrencyId: string,
    toCurrencyId: string,
    days: number = 30,
  ): Promise<ExchangeRateHistory[]> {
    const fromCurrency = await this.currencyRepository.findOne({
      where: { id: fromCurrencyId },
    });
    const toCurrency = await this.currencyRepository.findOne({
      where: { id: toCurrencyId },
    });

    if (!fromCurrency || !toCurrency) {
      throw new Error('Currency not found');
    }

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const rates = await this.exchangeRateRepository.find({
      where: {
        fromCurrencyId: fromCurrency.id,
        toCurrencyId: toCurrency.id,
        rateDate: MoreThanOrEqual(startDate),
      },
      order: { rateDate: 'ASC' },
      relations: ['fromCurrency', 'toCurrency'],
    });

    const history: ExchangeRateHistory[] = [];
    let previousRate: number | null = null;

    for (const rate of rates) {
      const change = previousRate ? Number(rate.rate) - previousRate : 0;
      const changePercent = previousRate ? (change / previousRate) * 100 : 0;

      history.push({
        date: rate.rateDate,
        fromCurrency: rate.fromCurrency,
        toCurrency: rate.toCurrency,
        rate: Number(rate.rate),
        change,
        changePercent,
      });

      previousRate = Number(rate.rate);
    }

    return history;
  }

  /**
   * Get currency conversion summary
   */
  async getConversionSummary(
    startDate: Date,
    endDate: Date,
  ): Promise<{
    totalConversions: number;
    totalAmountConverted: number;
    totalAmountConvertedBaseCurrency: number;
    averageRate: number;
    conversionsByCurrency: Record<string, number>;
  }> {
    // Get all disbursements with currency conversion
    const disbursements = await this.disbursementRepository.find({
      where: {
        disbursementDate: Between(startDate, endDate),
        exchangeRate: Not(IsNull()),
      },
      relations: ['currency', 'loan'],
    });

    // Get all repayments with currency conversion
    const repayments = await this.repaymentRepository.find({
      where: {
        postingDate: Between(startDate, endDate),
        exchangeRate: Not(IsNull()),
      },
      relations: ['paymentCurrency', 'loan'],
    });

    let totalConversions = 0;
    let totalAmountConverted = 0;
    let totalAmountConvertedBaseCurrency = 0;
    const conversionsByCurrency: Record<string, number> = {};

    for (const disbursement of disbursements) {
      if (disbursement.currency && disbursement.exchangeRate) {
        totalConversions++;
        totalAmountConverted += Number(disbursement.disbursedAmount);
        totalAmountConvertedBaseCurrency += Number(
          disbursement.disbursedAmountBaseCurrency || 0,
        );

        const currencyCode = disbursement.currency.code;
        conversionsByCurrency[currencyCode] =
          (conversionsByCurrency[currencyCode] || 0) + 1;
      }
    }

    for (const repayment of repayments) {
      if (repayment.paymentCurrency && repayment.exchangeRate) {
        totalConversions++;
        totalAmountConverted += Number(repayment.amountPaid);
        totalAmountConvertedBaseCurrency += Number(repayment.amountPaidBaseCurrency || 0);

        const currencyCode = repayment.paymentCurrency.code;
        conversionsByCurrency[currencyCode] =
          (conversionsByCurrency[currencyCode] || 0) + 1;
      }
    }

    const averageRate =
      totalAmountConverted > 0
        ? totalAmountConvertedBaseCurrency / totalAmountConverted
        : 0;

    return {
      totalConversions,
      totalAmountConverted,
      totalAmountConvertedBaseCurrency,
      averageRate,
      conversionsByCurrency,
    };
  }
}

