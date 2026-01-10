import Decimal from 'decimal.js';

export class NumberUtils {
  /**
   * Round to precision
   */
  static round(value: number | Decimal, precision: number = 2): number {
    const decimal = value instanceof Decimal ? value : new Decimal(value);
    return decimal.toDecimalPlaces(precision, Decimal.ROUND_HALF_UP).toNumber();
  }

  /**
   * Ceil to precision
   */
  static ceil(value: number | Decimal, precision: number = 2): number {
    const decimal = value instanceof Decimal ? value : new Decimal(value);
    return decimal.toDecimalPlaces(precision, Decimal.ROUND_CEIL).toNumber();
  }

  /**
   * Floor to precision
   */
  static floor(value: number | Decimal, precision: number = 2): number {
    const decimal = value instanceof Decimal ? value : new Decimal(value);
    return decimal.toDecimalPlaces(precision, Decimal.ROUND_FLOOR).toNumber();
  }

  /**
   * Check if value is zero
   */
  static isZero(value: number | Decimal): boolean {
    const decimal = value instanceof Decimal ? value : new Decimal(value);
    return decimal.isZero();
  }

  /**
   * Check if value is positive
   */
  static isPositive(value: number | Decimal): boolean {
    const decimal = value instanceof Decimal ? value : new Decimal(value);
    return decimal.isPositive();
  }
}

