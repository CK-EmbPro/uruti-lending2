import { addMonths, addDays as addDaysFn, differenceInDays, isLeapYear } from 'date-fns';

export class DateUtils {
  /**
   * Get days in year based on day count convention
   */
  static getDaysInYear(
    convention: string,
    date: Date = new Date(),
  ): number {
    switch (convention) {
      case 'Actual/365':
        return 365;
      case 'Actual/360':
        return 360;
      case 'Actual/Actual':
        return isLeapYear(date) ? 366 : 365;
      case '30/360':
        return 360;
      default:
        return 365;
    }
  }

  /**
   * Add single month (handles month-end dates)
   */
  static addSingleMonth(date: Date): Date {
    const result = addMonths(date, 1);
    // If original date was last day of month, return last day of next month
    if (date.getDate() !== result.getDate()) {
      return new Date(result.getFullYear(), result.getMonth() + 1, 0);
    }
    return result;
  }

  /**
   * Get next payment date based on frequency and schedule type
   */
  static getNextPaymentDate(
    currentDate: Date,
    frequency: string,
    scheduleType?: string,
    cycleDay?: number,
    repaymentDateOn?: string,
  ): Date {
    switch (frequency) {
      case 'Monthly':
        // Handle different schedule types for monthly
        if (scheduleType === 'Monthly as per cycle date' && cycleDay) {
          return this.getNextCycleDate(currentDate, cycleDay);
        } else if (scheduleType === 'Pro-rated calendar months') {
          return this.getNextProRatedDate(currentDate, repaymentDateOn);
        } else {
          // Monthly as per repayment start date
          return this.addSingleMonth(currentDate);
        }
      case 'Bi-Weekly':
        return addDaysFn(currentDate, 14);
      case 'Weekly':
        return addDaysFn(currentDate, 7);
      case 'Daily':
        return addDaysFn(currentDate, 1);
      case 'Quarterly':
        return addMonths(currentDate, 3);
      default:
        return this.addSingleMonth(currentDate);
    }
  }

  /**
   * Get next payment date for cycle date schedule type
   * Sets the day of month to the specified cycle day
   */
  static getNextCycleDate(currentDate: Date, cycleDay: number): Date {
    const nextMonth = addMonths(currentDate, 1);
    // Get last day of next month to handle cases where cycle day doesn't exist
    const lastDayOfMonth = new Date(
      nextMonth.getFullYear(),
      nextMonth.getMonth() + 1,
      0,
    ).getDate();
    const day = Math.min(cycleDay, lastDayOfMonth);
    return new Date(nextMonth.getFullYear(), nextMonth.getMonth(), day);
  }

  /**
   * Get next payment date for pro-rated calendar months
   */
  static getNextProRatedDate(
    currentDate: Date,
    repaymentDateOn?: string,
  ): Date {
    const nextMonth = addMonths(currentDate, 1);
    if (repaymentDateOn === 'Start of the next month') {
      return new Date(nextMonth.getFullYear(), nextMonth.getMonth(), 1);
    } else {
      // End of the current month (default)
      return new Date(
        nextMonth.getFullYear(),
        nextMonth.getMonth() + 1,
        0,
      );
    }
  }

  /**
   * Get first day of month
   */
  static getFirstDayOfMonth(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth(), 1);
  }

  /**
   * Get last day of month
   */
  static getLastDayOfMonth(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0);
  }

  /**
   * Calculate days between two dates
   */
  static daysBetween(startDate: Date, endDate: Date): number {
    return differenceInDays(endDate, startDate);
  }

  /**
   * Add days to a date
   */
  static addDays(date: Date, days: number): Date {
    return addDaysFn(date, days);
  }

  /**
   * Calculate difference in days between two dates
   */
  static daysDifference(startDate: Date, endDate: Date): number {
    return differenceInDays(endDate, startDate);
  }
}

