import { Injectable, Logger } from '@nestjs/common';
import { Loan } from '../../loan/entities/loan.entity';

export interface RebateCalculationResult {
  rebateAmount: number;
  rebatePercentage: number;
  monthsRemaining: number;
  daysRemaining: number;
  originalPayoffAmount: number;
  rebatedPayoffAmount: number;
  totalSavings: number;
}

/**
 * Service for calculating interest rebates for early settlement
 * Rebate formula: Based on time remaining in loan term
 */
@Injectable()
export class EarlySettlementRebateService {
  private readonly logger = new Logger(EarlySettlementRebateService.name);

  /**
   * Calculate interest rebate based on time remaining
   * Formula: Rebate = AccruedInterest * (MonthsRemaining / OriginalTenure) * RebateMultiplier
   * 
   * Rebate tiers:
   * - >12 months remaining: 50% rebate
   * - 6-12 months remaining: 30% rebate
   * - 3-6 months remaining: 15% rebate
   * - <3 months remaining: 5% rebate
   */
  calculateRebate(
    loan: Loan,
    payoffDate: Date,
    accruedInterest: number,
  ): RebateCalculationResult {
    const originalTenureMonths = loan.repaymentPeriods || 12;
    const loanStartDate = loan.disbursementDate || loan.postingDate;
    const loanEndDate = new Date(loanStartDate);
    loanEndDate.setMonth(loanEndDate.getMonth() + originalTenureMonths);

    // Calculate time remaining
    const daysRemaining = Math.max(0, Math.floor((loanEndDate.getTime() - payoffDate.getTime()) / (1000 * 60 * 60 * 24)));
    const monthsRemaining = Math.max(0, Math.floor(daysRemaining / 30));

    // Determine rebate percentage based on months remaining
    let rebatePercentage = 0;
    if (monthsRemaining > 12) {
      rebatePercentage = 50; // 50% rebate for >12 months remaining
    } else if (monthsRemaining >= 6) {
      rebatePercentage = 30; // 30% rebate for 6-12 months
    } else if (monthsRemaining >= 3) {
      rebatePercentage = 15; // 15% rebate for 3-6 months
    } else if (monthsRemaining > 0) {
      rebatePercentage = 5; // 5% rebate for <3 months
    }

    // Calculate rebate amount
    const rebateAmount = (accruedInterest * rebatePercentage) / 100;

    // Calculate original payoff (before rebate)
    const principalBalance = (loan.loanAmount || 0) - (loan.totalPrincipalPaid || 0);
    const originalPayoffAmount = principalBalance + accruedInterest;

    // Calculate rebated payoff (after rebate)
    const rebatedPayoffAmount = originalPayoffAmount - rebateAmount;

    // Calculate total savings (rebate + interest that would have been paid)
    // Simplified: savings = rebate + (estimated future interest)
    const dailyRate = (loan.rateOfInterest || 0) / 365 / 100;
    const estimatedFutureInterest = principalBalance * dailyRate * daysRemaining;
    const totalSavings = rebateAmount + estimatedFutureInterest;

    this.logger.debug(
      `Rebate calculated: ${rebateAmount.toFixed(2)} (${rebatePercentage}%) for ${monthsRemaining} months remaining`,
    );

    return {
      rebateAmount,
      rebatePercentage,
      monthsRemaining,
      daysRemaining,
      originalPayoffAmount,
      rebatedPayoffAmount,
      totalSavings,
    };
  }

  /**
   * Get rebate formula description
   */
  getRebateFormulaDescription(): string {
    return `
      Interest Rebate Formula:
      - >12 months remaining: 50% of accrued interest
      - 6-12 months remaining: 30% of accrued interest
      - 3-6 months remaining: 15% of accrued interest
      - <3 months remaining: 5% of accrued interest
      - 0 months remaining: No rebate
    `;
  }
}

