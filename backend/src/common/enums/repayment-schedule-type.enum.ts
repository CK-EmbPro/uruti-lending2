export enum RepaymentScheduleType {
  MONTHLY_AS_PER_START_DATE = 'Monthly as per repayment start date',
  PRO_RATED_CALENDAR_MONTHS = 'Pro-rated calendar months',
  MONTHLY_AS_PER_CYCLE_DATE = 'Monthly as per cycle date',
  LINE_OF_CREDIT = 'Line of Credit',
  // Variable Repayment Structures
  FIXED = 'Fixed Payment',
  GRADUATED = 'Graduated Payment',
  SEASONAL = 'Seasonal Payment',
  BULLET = 'Bullet Payment',
}

/**
 * Repayment Structure Types for borrower selection
 * These are user-friendly options shown during application
 */
export enum RepaymentStructureType {
  FIXED = 'FIXED',
  GRADUATED = 'GRADUATED',
  SEASONAL = 'SEASONAL',
  BULLET = 'BULLET',
}

