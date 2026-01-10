import { Injectable } from '@nestjs/common';
import { Loan } from '../entities/loan.entity';
import { LoanProduct } from '../../loan-product/entities/loan-product.entity';
import { DateUtils } from '../../../common/utils/date.utils';

export enum BpiRecoveryMethod {
  AMORTIZED_OVER_TENURE = 'Amortized Over Tenure',
  ADD_TO_FIRST_EMI = 'Add to First EMI',
  UPFRONT_DEDUCTION = 'Upfront Deduction',
}

/**
 * Service for calculating Broken Period Interest (BPI)
 * BPI is interest calculated for the period between disbursement date and first repayment date
 * when the first repayment date is different from the expected date
 */
@Injectable()
export class BpiCalculationService {
  /**
   * Calculate broken period interest
   * Formula: (Principal × Rate × Days) / (365 × 100)
   */
  calculateBrokenPeriodInterest(
    principalAmount: number,
    rateOfInterest: number,
    brokenPeriodDays: number,
  ): number {
    if (brokenPeriodDays <= 0) {
      return 0;
    }

    return (
      (principalAmount * rateOfInterest * brokenPeriodDays) / (365 * 100)
    );
  }

  /**
   * Calculate broken period days
   * Difference between expected first repayment date and actual repayment start date
   */
  calculateBrokenPeriodDays(
    disbursementDate: Date,
    repaymentStartDate: Date,
    minDaysBetween: number,
    repaymentFrequency: string,
  ): number {
    // Calculate expected first repayment date
    const expectedDate = DateUtils.addDays(disbursementDate, minDaysBetween);

    // For monthly frequency, adjust to the same day of month
    if (repaymentFrequency === 'Monthly') {
      const expectedDay = expectedDate.getDate();
      const actualDay = repaymentStartDate.getDate();

      // If actual date is different from expected, calculate difference
      if (actualDay !== expectedDay) {
        return DateUtils.daysDifference(expectedDate, repaymentStartDate);
      }
    }

    // Calculate difference in days
    const daysDiff = DateUtils.daysDifference(expectedDate, repaymentStartDate);

    // Only return positive days (if repayment start is after expected)
    return daysDiff > 0 ? daysDiff : 0;
  }

  /**
   * Apply BPI to repayment schedule based on recovery method
   */
  applyBpiToSchedule(
    loan: Loan,
    loanProduct: LoanProduct,
    brokenPeriodInterest: number,
    brokenPeriodDays: number,
    repaymentPeriods: number,
  ): {
    firstEmiAdjustment: number;
    amortizedBpi: number;
    upfrontDeduction: number;
  } {
    const recoveryMethod = loanProduct.bpiRecoveryMethod;

    if (!recoveryMethod || brokenPeriodInterest <= 0) {
      return {
        firstEmiAdjustment: 0,
        amortizedBpi: 0,
        upfrontDeduction: 0,
      };
    }

    switch (recoveryMethod) {
      case BpiRecoveryMethod.AMORTIZED_OVER_TENURE:
        // Amortize BPI over all repayment periods
        return {
          firstEmiAdjustment: 0,
          amortizedBpi: brokenPeriodInterest / repaymentPeriods,
          upfrontDeduction: 0,
        };

      case BpiRecoveryMethod.ADD_TO_FIRST_EMI:
        // Add full BPI to first EMI
        return {
          firstEmiAdjustment: brokenPeriodInterest,
          amortizedBpi: 0,
          upfrontDeduction: 0,
        };

      case BpiRecoveryMethod.UPFRONT_DEDUCTION:
        // Deduct BPI upfront from disbursement
        return {
          firstEmiAdjustment: 0,
          amortizedBpi: 0,
          upfrontDeduction: brokenPeriodInterest,
        };

      default:
        return {
          firstEmiAdjustment: 0,
          amortizedBpi: 0,
          upfrontDeduction: 0,
        };
    }
  }

  /**
   * Calculate BPI for a loan
   */
  calculateLoanBpi(
    loan: Loan,
    loanProduct: LoanProduct,
    repaymentStartDate: Date,
  ): {
    brokenPeriodDays: number;
    brokenPeriodInterest: number;
    bpiApplication: {
      firstEmiAdjustment: number;
      amortizedBpi: number;
      upfrontDeduction: number;
    };
  } {
    if (!loan.disbursementDate || !repaymentStartDate) {
      return {
        brokenPeriodDays: 0,
        brokenPeriodInterest: 0,
        bpiApplication: {
          firstEmiAdjustment: 0,
          amortizedBpi: 0,
          upfrontDeduction: 0,
        },
      };
    }

    // Calculate broken period days
    const brokenPeriodDays = this.calculateBrokenPeriodDays(
      loan.disbursementDate,
      repaymentStartDate,
      loanProduct.minDaysBwDisbursementFirstRepayment || 0,
      loan.repaymentFrequency || 'Monthly',
    );

    if (brokenPeriodDays <= 0) {
      return {
        brokenPeriodDays: 0,
        brokenPeriodInterest: 0,
        bpiApplication: {
          firstEmiAdjustment: 0,
          amortizedBpi: 0,
          upfrontDeduction: 0,
        },
      };
    }

    // Calculate BPI amount
    const brokenPeriodInterest = this.calculateBrokenPeriodInterest(
      loan.disbursedAmount || loan.loanAmount,
      loan.rateOfInterest,
      brokenPeriodDays,
    );

    // Apply BPI based on recovery method
    const bpiApplication = this.applyBpiToSchedule(
      loan,
      loanProduct,
      brokenPeriodInterest,
      brokenPeriodDays,
      loan.repaymentPeriods || 0,
    );

    return {
      brokenPeriodDays,
      brokenPeriodInterest,
      bpiApplication,
    };
  }
}

