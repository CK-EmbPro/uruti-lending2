import { Injectable, Logger } from '@nestjs/common';
import { CalculationService } from '../../calculation/calculation.service';
import { RepaymentStructureType } from '../../../common/enums/repayment-schedule-type.enum';

export interface RepaymentStructureResult {
  structureType: RepaymentStructureType;
  totalInterest: number;
  totalAmount: number;
  totalCost: number;
  monthlyPayments: Array<{
    period: number;
    payment: number;
    principal: number;
    interest: number;
    balance: number;
  }>;
  minPayment: number;
  maxPayment: number;
  averagePayment: number;
}

export interface RepaymentStructureCalculationDto {
  loanAmount: number;
  interestRate: number;
  tenureMonths: number;
  repaymentFrequency?: 'Monthly' | 'Quarterly' | 'Semi-Annual' | 'Annual';
  processingFee?: number;
  processingFeeType?: 'percentage' | 'fixed';
  // Graduated payment specific
  graduationRate?: number; // Percentage increase per period (default: 5%)
  // Seasonal payment specific
  seasonalPattern?: {
    high: number[]; // Months with high payments (1-12)
    low: number[]; // Months with low payments (1-12)
    highMultiplier?: number; // Multiplier for high season (default: 1.5)
    lowMultiplier?: number; // Multiplier for low season (default: 0.7)
  };
}

/**
 * Service for calculating different repayment structures
 * Supports: Fixed, Graduated, Seasonal, Bullet payments
 */
@Injectable()
export class RepaymentStructureService {
  private readonly logger = new Logger(RepaymentStructureService.name);

  constructor(
    private readonly calculationService: CalculationService,
  ) {}

  /**
   * Calculate Fixed Payment structure (standard amortization)
   */
  calculateFixedStructure(dto: RepaymentStructureCalculationDto): RepaymentStructureResult {
    const { loanAmount, interestRate, tenureMonths, repaymentFrequency = 'Monthly' } = dto;

    // Calculate EMI (equal monthly installment)
    const emi = this.calculationService.calculateEMI(
      loanAmount,
      interestRate,
      tenureMonths,
      repaymentFrequency,
    );

    const monthlyPayments: RepaymentStructureResult['monthlyPayments'] = [];
    let remainingPrincipal = loanAmount;
    let totalInterest = 0;

    for (let period = 1; period <= tenureMonths; period++) {
      // Calculate interest for this period
      const days = this.getDaysForPeriod(period, repaymentFrequency);
      const interest = this.calculationService.calculateInterest(
        remainingPrincipal,
        interestRate,
        days,
        'Actual/365',
        new Date(),
      );

      // Calculate principal
      const principal = Math.min(emi - interest, remainingPrincipal);

      // Update totals
      remainingPrincipal -= principal;
      totalInterest += interest;

      monthlyPayments.push({
        period,
        payment: emi,
        principal,
        interest,
        balance: remainingPrincipal,
      });
    }

    const totalAmount = loanAmount + totalInterest;
    const processingFee = this.calculateProcessingFee(dto);
    const totalCost = totalAmount + processingFee;

    return {
      structureType: RepaymentStructureType.FIXED,
      totalInterest,
      totalAmount,
      totalCost,
      monthlyPayments,
      minPayment: emi,
      maxPayment: emi,
      averagePayment: emi,
    };
  }

  /**
   * Calculate Graduated Payment structure (increasing payments)
   */
  calculateGraduatedStructure(dto: RepaymentStructureCalculationDto): RepaymentStructureResult {
    const { loanAmount, interestRate, tenureMonths, repaymentFrequency = 'Monthly', graduationRate = 5 } = dto;

    // Calculate base payment (lower than fixed)
    // Use a lower initial payment that will increase over time
    const baseEMI = this.calculationService.calculateEMI(
      loanAmount,
      interestRate,
      tenureMonths * 1.2, // Use longer term to get lower base payment
      repaymentFrequency,
    );

    const monthlyPayments: RepaymentStructureResult['monthlyPayments'] = [];
    let remainingPrincipal = loanAmount;
    let totalInterest = 0;
    let currentPayment = baseEMI;

    for (let period = 1; period <= tenureMonths; period++) {
      // Calculate interest for this period
      const days = this.getDaysForPeriod(period, repaymentFrequency);
      const interest = this.calculationService.calculateInterest(
        remainingPrincipal,
        interestRate,
        days,
        'Actual/365',
        new Date(),
      );

      // Calculate principal (payment - interest)
      const principal = Math.min(currentPayment - interest, remainingPrincipal);

      // Update totals
      remainingPrincipal -= principal;
      totalInterest += interest;

      monthlyPayments.push({
        period,
        payment: currentPayment,
        principal,
        interest,
        balance: remainingPrincipal,
      });

      // Increase payment for next period (graduation)
      if (period < tenureMonths) {
        currentPayment = currentPayment * (1 + graduationRate / 100);
      }
    }

    // Adjust final payment to clear remaining balance
    if (remainingPrincipal > 0) {
      const lastPayment = monthlyPayments[monthlyPayments.length - 1];
      lastPayment.principal += remainingPrincipal;
      lastPayment.payment += remainingPrincipal;
    }

    const totalAmount = loanAmount + totalInterest;
    const processingFee = this.calculateProcessingFee(dto);
    const totalCost = totalAmount + processingFee;

    const payments = monthlyPayments.map(p => p.payment);
    return {
      structureType: RepaymentStructureType.GRADUATED,
      totalInterest,
      totalAmount,
      totalCost,
      monthlyPayments,
      minPayment: Math.min(...payments),
      maxPayment: Math.max(...payments),
      averagePayment: payments.reduce((a, b) => a + b, 0) / payments.length,
    };
  }

  /**
   * Calculate Seasonal Payment structure (variable by season)
   */
  calculateSeasonalStructure(dto: RepaymentStructureCalculationDto): RepaymentStructureResult {
    const { loanAmount, interestRate, tenureMonths, repaymentFrequency = 'Monthly', seasonalPattern } = dto;

    // Default seasonal pattern if not provided
    const pattern = seasonalPattern || {
      high: [11, 12, 1, 2], // Nov, Dec, Jan, Feb (holiday season)
      low: [6, 7, 8], // Jun, Jul, Aug (summer)
      highMultiplier: 1.5,
      lowMultiplier: 0.7,
    };

    // Calculate base EMI
    const baseEMI = this.calculationService.calculateEMI(
      loanAmount,
      interestRate,
      tenureMonths,
      repaymentFrequency,
    );

    const monthlyPayments: RepaymentStructureResult['monthlyPayments'] = [];
    let remainingPrincipal = loanAmount;
    let totalInterest = 0;

    for (let period = 1; period <= tenureMonths; period++) {
      // Determine month (1-12) for seasonal adjustment
      const month = ((period - 1) % 12) + 1;

      // Determine payment multiplier based on season
      let multiplier = 1.0; // Normal season
      if (pattern.high.includes(month)) {
        multiplier = pattern.highMultiplier || 1.5;
      } else if (pattern.low.includes(month)) {
        multiplier = pattern.lowMultiplier || 0.7;
      }

      // Calculate payment for this period
      const payment = baseEMI * multiplier;

      // Calculate interest for this period
      const days = this.getDaysForPeriod(period, repaymentFrequency);
      const interest = this.calculationService.calculateInterest(
        remainingPrincipal,
        interestRate,
        days,
        'Actual/365',
        new Date(),
      );

      // Calculate principal
      const principal = Math.min(payment - interest, remainingPrincipal);

      // Update totals
      remainingPrincipal -= principal;
      totalInterest += interest;

      monthlyPayments.push({
        period,
        payment,
        principal,
        interest,
        balance: remainingPrincipal,
      });
    }

    // Adjust final payment to clear remaining balance
    if (remainingPrincipal > 0) {
      const lastPayment = monthlyPayments[monthlyPayments.length - 1];
      lastPayment.principal += remainingPrincipal;
      lastPayment.payment += remainingPrincipal;
    }

    const totalAmount = loanAmount + totalInterest;
    const processingFee = this.calculateProcessingFee(dto);
    const totalCost = totalAmount + processingFee;

    const payments = monthlyPayments.map(p => p.payment);
    return {
      structureType: RepaymentStructureType.SEASONAL,
      totalInterest,
      totalAmount,
      totalCost,
      monthlyPayments,
      minPayment: Math.min(...payments),
      maxPayment: Math.max(...payments),
      averagePayment: payments.reduce((a, b) => a + b, 0) / payments.length,
    };
  }

  /**
   * Calculate Bullet Payment structure (interest-only, principal at end)
   */
  calculateBulletStructure(dto: RepaymentStructureCalculationDto): RepaymentStructureResult {
    const { loanAmount, interestRate, tenureMonths, repaymentFrequency = 'Monthly' } = dto;

    const monthlyPayments: RepaymentStructureResult['monthlyPayments'] = [];
    let remainingPrincipal = loanAmount;
    let totalInterest = 0;

    for (let period = 1; period <= tenureMonths; period++) {
      // Calculate interest for this period (interest-only payment)
      const days = this.getDaysForPeriod(period, repaymentFrequency);
      const interest = this.calculationService.calculateInterest(
        loanAmount, // Interest calculated on full principal
        interestRate,
        days,
        'Actual/365',
        new Date(),
      );

      // Principal payment is 0 except for last period
      const principal = period === tenureMonths ? loanAmount : 0;
      const payment = interest + principal;

      // Update totals
      if (period === tenureMonths) {
        remainingPrincipal = 0;
      }
      totalInterest += interest;

      monthlyPayments.push({
        period,
        payment,
        principal,
        interest,
        balance: remainingPrincipal,
      });
    }

    const totalAmount = loanAmount + totalInterest;
    const processingFee = this.calculateProcessingFee(dto);
    const totalCost = totalAmount + processingFee;

    const payments = monthlyPayments.map(p => p.payment);
    return {
      structureType: RepaymentStructureType.BULLET,
      totalInterest,
      totalAmount,
      totalCost,
      monthlyPayments,
      minPayment: Math.min(...payments),
      maxPayment: Math.max(...payments),
      averagePayment: payments.reduce((a, b) => a + b, 0) / payments.length,
    };
  }

  /**
   * Calculate all structures for comparison
   */
  calculateAllStructures(dto: RepaymentStructureCalculationDto): {
    fixed: RepaymentStructureResult;
    graduated: RepaymentStructureResult;
    seasonal: RepaymentStructureResult;
    bullet: RepaymentStructureResult;
  } {
    return {
      fixed: this.calculateFixedStructure(dto),
      graduated: this.calculateGraduatedStructure(dto),
      seasonal: this.calculateSeasonalStructure(dto),
      bullet: this.calculateBulletStructure(dto),
    };
  }

  // Helper methods

  private getDaysForPeriod(period: number, frequency: string): number {
    switch (frequency) {
      case 'Monthly':
        return 30; // Approximate
      case 'Quarterly':
        return 90;
      case 'Semi-Annual':
        return 180;
      case 'Annual':
        return 365;
      default:
        return 30;
    }
  }

  private calculateProcessingFee(dto: RepaymentStructureCalculationDto): number {
    const { loanAmount, processingFee = 0, processingFeeType = 'percentage' } = dto;
    if (processingFeeType === 'percentage') {
      return (loanAmount * processingFee) / 100;
    }
    return processingFee;
  }
}

