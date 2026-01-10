import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Decimal from 'decimal.js';
import { DateUtils } from '../../common/utils/date.utils';
import { NumberUtils } from '../../common/utils/number.utils';
import { RepaymentFrequency } from '../../common/enums/repayment-frequency.enum';

@Injectable()
export class CalculationService {
  private readonly currencyPrecision: number;

  constructor(private configService: ConfigService) {
    this.currencyPrecision = this.configService.get<number>('currency.precision') || 2;
  }

  /**
   * Calculate EMI (Equated Monthly Installment) using reducing balance method
   * Formula: EMI = [P × R × (1+R)^N] / [(1+R)^N - 1]
   */
  calculateEMI(
    principal: number,
    annualRate: number,
    periods: number,
    frequency: RepaymentFrequency | string,
  ): number {
    if (frequency === RepaymentFrequency.ONE_TIME) {
      periods = 1;
    }

    if (annualRate <= 0) {
      // No interest - simple division
      return NumberUtils.ceil(principal / periods, this.currencyPrecision);
    }

    const frequencyMultiplier = this.getFrequencyMultiplier(frequency);
    const periodicRate = new Decimal(annualRate).div(frequencyMultiplier * 100);
    const principalDecimal = new Decimal(principal);

    const onePlusRate = new Decimal(1).plus(periodicRate);
    const numerator = principalDecimal
      .times(periodicRate)
      .times(onePlusRate.pow(periods));
    const denominator = onePlusRate.pow(periods).minus(1);

    const emi = numerator.div(denominator);
    return NumberUtils.ceil(emi.toNumber(), this.currencyPrecision);
  }

  /**
   * Calculate interest amount
   * Formula: Interest = (Principal × Rate × Days) / (Days in Year × 100)
   */
  calculateInterest(
    principal: number,
    annualRate: number,
    days: number,
    dayCountConvention: string,
    postingDate: Date = new Date(),
  ): number {
    const daysInYear = DateUtils.getDaysInYear(dayCountConvention, postingDate);
    const principalDecimal = new Decimal(principal);
    const rateDecimal = new Decimal(annualRate);
    const daysDecimal = new Decimal(days);
    const daysInYearDecimal = new Decimal(daysInYear);

    const interest = principalDecimal
      .times(rateDecimal)
      .times(daysDecimal)
      .div(daysInYearDecimal.times(100));

    return NumberUtils.round(interest.toNumber(), this.currencyPrecision);
  }

  /**
   * Calculate penalty interest
   */
  calculatePenalty(
    outstandingAmount: number,
    penaltyRate: number,
    daysOverdue: number,
    dayCountConvention: string = 'Actual/365',
  ): number {
    if (daysOverdue <= 0) {
      return 0;
    }

    return this.calculateInterest(
      outstandingAmount,
      penaltyRate,
      daysOverdue,
      dayCountConvention,
    );
  }

  /**
   * Get frequency multiplier for interest calculation
   */
  private getFrequencyMultiplier(frequency: RepaymentFrequency | string): number {
    const multipliers: Record<string, number> = {
      [RepaymentFrequency.MONTHLY]: 12,
      [RepaymentFrequency.BI_WEEKLY]: 26,
      [RepaymentFrequency.WEEKLY]: 52,
      [RepaymentFrequency.DAILY]: 365,
      [RepaymentFrequency.QUARTERLY]: 4,
      [RepaymentFrequency.ONE_TIME]: 1,
    };

    return multipliers[frequency] || 12;
  }
}

