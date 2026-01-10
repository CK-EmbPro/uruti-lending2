import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Loan } from '../../loan/entities/loan.entity';
import { EarlySettlementDailyCalculation } from '../entities/early-settlement-daily-calculation.entity';
import { PayoffQuoteService } from './payoff-quote.service';
import { EarlySettlementRebateService } from './early-settlement-rebate.service';

export interface DailyPayoffCalculation {
  date: Date;
  principalBalance: number;
  accruedInterest: number;
  interestRebate: number;
  totalPayoffAmount: number;
  originalPayoffAmount: number;
  savingsAmount: number;
  monthsRemaining: number;
  rebatePercentage: number;
  dailyChange: number;
}

/**
 * Service for calculating daily payoff amounts with rebates
 * UC: Daily Calculation - Payoff amount calculated daily with rebate
 */
@Injectable()
export class EarlySettlementDailyCalculationService {
  private readonly logger = new Logger(EarlySettlementDailyCalculationService.name);

  constructor(
    @InjectRepository(EarlySettlementDailyCalculation)
    private readonly dailyCalculationRepository: Repository<EarlySettlementDailyCalculation>,
    @InjectRepository(Loan)
    private readonly loanRepository: Repository<Loan>,
    private readonly payoffQuoteService: PayoffQuoteService,
    private readonly rebateService: EarlySettlementRebateService,
  ) {}

  /**
   * Calculate payoff amount for a specific date
   */
  async calculatePayoffForDate(
    loanId: string,
    calculationDate: Date,
  ): Promise<DailyPayoffCalculation> {
    const loan = await this.loanRepository.findOne({
      where: { id: loanId },
      relations: ['loanProduct'],
    });

    if (!loan) {
      throw new Error(`Loan with ID ${loanId} not found`);
    }

    // Calculate principal balance
    const principalBalance = (loan.loanAmount || 0) - (loan.totalPrincipalPaid || 0);

    // Calculate accrued interest up to calculation date
    const accruedInterest = this.calculateAccruedInterest(loan, calculationDate);

    // Calculate rebate
    const rebateResult = this.rebateService.calculateRebate(loan, calculationDate, accruedInterest);

    // Calculate savings vs. continuing with loan
    const savingsAmount = this.calculateSavings(loan, calculationDate, rebateResult);

    // Get previous day's calculation for daily change
    const previousCalculation = await this.getPreviousDayCalculation(loanId, calculationDate);
    const dailyChange = previousCalculation
      ? rebateResult.rebatedPayoffAmount - previousCalculation.totalPayoffAmount
      : 0;

    return {
      date: calculationDate,
      principalBalance,
      accruedInterest,
      interestRebate: rebateResult.rebateAmount,
      totalPayoffAmount: rebateResult.rebatedPayoffAmount,
      originalPayoffAmount: rebateResult.originalPayoffAmount,
      savingsAmount,
      monthsRemaining: rebateResult.monthsRemaining,
      rebatePercentage: rebateResult.rebatePercentage,
      dailyChange,
    };
  }

  /**
   * Calculate and store daily payoff amounts for a date range
   */
  async calculateDailyPayoffsForRange(
    loanId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<EarlySettlementDailyCalculation[]> {
    const calculations: EarlySettlementDailyCalculation[] = [];
    const currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      const calculation = await this.calculatePayoffForDate(loanId, new Date(currentDate));

      // Save to database
      const saved = await this.saveDailyCalculation(loanId, calculation);

      calculations.push(saved);
      currentDate.setDate(currentDate.getDate() + 1);
    }

    this.logger.log(
      `Calculated ${calculations.length} daily payoff amounts for loan ${loanId}`,
    );

    return calculations;
  }

  /**
   * Get daily calculations for a loan
   */
  async getDailyCalculations(
    loanId: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<EarlySettlementDailyCalculation[]> {
    const query = this.dailyCalculationRepository
      .createQueryBuilder('calc')
      .where('calc.loanId = :loanId', { loanId })
      .orderBy('calc.calculationDate', 'ASC');

    if (startDate) {
      query.andWhere('calc.calculationDate >= :startDate', { startDate });
    }

    if (endDate) {
      query.andWhere('calc.calculationDate <= :endDate', { endDate });
    }

    return await query.getMany();
  }

  /**
   * Get latest daily calculation for a loan
   */
  async getLatestCalculation(
    loanId: string,
  ): Promise<EarlySettlementDailyCalculation | null> {
    return await this.dailyCalculationRepository.findOne({
      where: { loanId },
      order: { calculationDate: 'DESC' },
    });
  }

  /**
   * Calculate accrued interest
   */
  private calculateAccruedInterest(loan: Loan, payoffDate: Date): number {
    const lastPaymentDate = loan.disbursementDate || loan.postingDate;
    const days = Math.max(
      0,
      Math.floor((payoffDate.getTime() - new Date(lastPaymentDate).getTime()) / (1000 * 60 * 60 * 24)),
    );
    const dailyRate = (loan.rateOfInterest || 0) / 365 / 100;
    const outstandingBalance = (loan.loanAmount || 0) - (loan.totalPrincipalPaid || 0);
    return outstandingBalance * dailyRate * days;
  }

  /**
   * Calculate savings vs. continuing with loan
   */
  private calculateSavings(
    loan: Loan,
    payoffDate: Date,
    rebateResult: any,
  ): number {
    // Savings = Rebate + Future interest that would be paid
    // Simplified calculation
    const principalBalance = (loan.loanAmount || 0) - (loan.totalPrincipalPaid || 0);
    const dailyRate = (loan.rateOfInterest || 0) / 365 / 100;
    const estimatedFutureInterest = principalBalance * dailyRate * rebateResult.daysRemaining;
    return rebateResult.rebateAmount + estimatedFutureInterest;
  }

  /**
   * Get previous day's calculation
   */
  private async getPreviousDayCalculation(
    loanId: string,
    currentDate: Date,
  ): Promise<EarlySettlementDailyCalculation | null> {
    const previousDate = new Date(currentDate);
    previousDate.setDate(previousDate.getDate() - 1);

    return await this.dailyCalculationRepository.findOne({
      where: {
        loanId,
        calculationDate: previousDate,
      },
    });
  }

  /**
   * Save daily calculation to database
   */
  private async saveDailyCalculation(
    loanId: string,
    calculation: DailyPayoffCalculation,
  ): Promise<EarlySettlementDailyCalculation> {
    const loan = await this.loanRepository.findOne({ where: { id: loanId } });
    if (!loan) {
      throw new Error(`Loan with ID ${loanId} not found`);
    }

    const entity = this.dailyCalculationRepository.create({
      loanId,
      companyId: loan.companyId,
      calculationDate: calculation.date,
      principalBalance: calculation.principalBalance,
      accruedInterest: calculation.accruedInterest,
      interestRebate: calculation.interestRebate,
      totalPayoffAmount: calculation.totalPayoffAmount,
      originalPayoffAmount: calculation.originalPayoffAmount,
      savingsAmount: calculation.savingsAmount,
      monthsRemaining: calculation.monthsRemaining,
      rebatePercentage: calculation.rebatePercentage,
      dailyChange: calculation.dailyChange,
    });

    return await this.dailyCalculationRepository.save(entity);
  }
}

