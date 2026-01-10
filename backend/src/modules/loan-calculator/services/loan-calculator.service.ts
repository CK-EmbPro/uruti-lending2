import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LoanProduct } from '../../loan-product/entities/loan-product.entity';
import { CalculationService } from '../../calculation/calculation.service';
import {
  LoanCalculatorDto,
  AmortizationScheduleDto,
  LoanEligibilityDto,
  LoanComparisonDto,
  EarlyRepaymentCalculatorDto,
  RateEstimatorDto,
} from '../dto/loan-calculator.dto';
import { LoanRefinancingDto } from '../dto/loan-refinancing.dto';
import Decimal from 'decimal.js';

export interface AmortizationEntry {
  paymentNumber: number;
  paymentDate: string;
  emi: number;
  principal: number;
  interest: number;
  outstandingBalance: number;
  cumulativeInterest: number;
  cumulativePrincipal: number;
}

export interface LoanCalculationResult {
  loanAmount: number;
  interestRate: number;
  tenureMonths: number;
  emi: number;
  totalInterest: number;
  totalAmount: number;
  processingFee: number;
  totalCost: number;
  effectiveRate: number; // APR
  amortizationSchedule?: AmortizationEntry[];
}

export interface EligibilityResult {
  isEligible: boolean;
  eligibleAmount: number;
  recommendedTenure: number;
  estimatedEMI: number;
  debtToIncomeRatio: number;
  eligibilityScore: number; // 0-100
  reasons: string[];
  recommendations: string[];
  suggestedProducts?: Array<{
    productId: string;
    productName: string;
    interestRate: number;
    emi: number;
  }>;
}

export interface ComparisonResult {
  loanAmount: number;
  tenureMonths: number;
  products: Array<{
    productName: string;
    interestRate: number;
    emi: number;
    totalInterest: number;
    totalAmount: number;
    processingFee: number;
    totalCost: number;
    effectiveRate: number;
    savings?: number; // Compared to highest cost option
  }>;
  bestOption: {
    productName: string;
    totalSavings: number;
    reason: string;
  };
}

export interface EarlyRepaymentResult {
  originalLoanAmount: number;
  originalTenureMonths: number;
  monthsPaid: number;
  earlyRepaymentAmount: number;
  prepaymentCharges: number;
  totalPrepaymentCost: number;
  newOutstandingBalance: number;
  newTenureMonths: number;
  newEMI: number;
  interestSaved: number;
  timeSavedMonths: number;
  totalSavings: number;
  breakEvenMonths: number; // Months to recover prepayment charges
}

export interface RateEstimateResult {
  loanAmount: number;
  tenureMonths: number;
  estimatedRateRange: {
    min: number;
    max: number;
    likely: number;
  };
  factors: Array<{
    factor: string;
    impact: 'positive' | 'negative' | 'neutral';
    description: string;
  }>;
  recommendations: string[];
}

export interface LoanRefinancingResult {
  currentLoan: {
    loanAmount: number;
    interestRate: number;
    remainingTenureMonths: number;
    emi: number;
    totalInterestRemaining: number;
    totalAmountRemaining: number;
  };
  newLoan: {
    loanAmount: number;
    interestRate: number;
    tenureMonths: number;
    emi: number;
    totalInterest: number;
    totalAmount: number;
    refinancingFees: number;
    prepaymentCharges: number;
    totalCost: number;
  };
  savings: {
    monthlySavings: number;
    totalInterestSaved: number;
    totalSavings: number; // After fees and charges
    breakEvenMonths: number;
    timeSavedMonths: number;
  };
  recommendation: {
    shouldRefinance: boolean;
    reason: string;
    factors: Array<{
      factor: string;
      impact: 'positive' | 'negative' | 'neutral';
      description: string;
    }>;
  };
}

@Injectable()
export class LoanCalculatorService {
  private readonly logger = new Logger(LoanCalculatorService.name);

  constructor(
    @InjectRepository(LoanProduct)
    private readonly loanProductRepository: Repository<LoanProduct>,
    private readonly calculationService: CalculationService,
  ) {}

  /**
   * Calculate comprehensive loan details including EMI, total interest, and amortization schedule
   */
  async calculateLoan(dto: LoanCalculatorDto): Promise<LoanCalculationResult> {
    const { loanAmount, interestRate, tenureMonths, repaymentFrequency = 'Monthly', processingFee = 0, processingFeeType = 'percentage' } = dto;

    // Calculate EMI
    const emi = this.calculationService.calculateEMI(
      loanAmount,
      interestRate,
      tenureMonths,
      repaymentFrequency,
    );

    // Calculate total amount
    const totalAmount = new Decimal(emi).times(tenureMonths).toNumber();
    const totalInterest = totalAmount - loanAmount;

    // Calculate processing fee
    const calculatedProcessingFee =
      processingFeeType === 'percentage'
        ? (loanAmount * processingFee) / 100
        : processingFee;

    const totalCost = totalAmount + calculatedProcessingFee;

    // Calculate effective rate (APR)
    const effectiveRate = this.calculateEffectiveRate(
      loanAmount,
      totalCost,
      tenureMonths,
    );

    return {
      loanAmount,
      interestRate,
      tenureMonths,
      emi,
      totalInterest,
      totalAmount,
      processingFee: calculatedProcessingFee,
      totalCost,
      effectiveRate,
    };
  }

  /**
   * Calculate loan with detailed amortization schedule
   */
  async calculateLoanWithSchedule(
    dto: AmortizationScheduleDto,
  ): Promise<LoanCalculationResult> {
    const result = await this.calculateLoan(dto);
    const schedule = this.generateAmortizationSchedule(
      dto.loanAmount,
      dto.interestRate,
      dto.tenureMonths,
      dto.repaymentFrequency || 'Monthly',
      dto.startDate,
    );

    return {
      ...result,
      amortizationSchedule: schedule,
    };
  }

  /**
   * Check loan eligibility based on income, expenses, and credit profile
   */
  async checkEligibility(
    dto: LoanEligibilityDto,
    companyId?: string,
  ): Promise<EligibilityResult> {
    const {
      monthlyIncome,
      monthlyExpenses,
      existingLoanEMIs = 0,
      requestedAmount,
      creditScore,
      employmentType = 'Salaried',
      employmentYears = 0,
    } = dto;

    // Calculate disposable income
    const disposableIncome = monthlyIncome - monthlyExpenses - existingLoanEMIs;

    // Calculate debt-to-income ratio
    const totalDebtService = existingLoanEMIs;
    const debtToIncomeRatio = monthlyIncome > 0 ? totalDebtService / monthlyIncome : 1;

    // Calculate eligibility score (0-100)
    let eligibilityScore = 50; // Base score
    const reasons: string[] = [];
    const recommendations: string[] = [];

    // Factor 1: Disposable Income (40% weight)
    const disposableIncomeRatio = monthlyIncome > 0 ? disposableIncome / monthlyIncome : 0;
    if (disposableIncomeRatio >= 0.5) {
      eligibilityScore += 20;
      reasons.push('Strong disposable income');
    } else if (disposableIncomeRatio >= 0.3) {
      eligibilityScore += 10;
      reasons.push('Moderate disposable income');
    } else {
      eligibilityScore -= 10;
      reasons.push('Low disposable income');
      recommendations.push('Consider reducing expenses or increasing income');
    }

    // Factor 2: Debt-to-Income Ratio (30% weight)
    if (debtToIncomeRatio <= 0.3) {
      eligibilityScore += 15;
      reasons.push('Low debt-to-income ratio');
    } else if (debtToIncomeRatio <= 0.4) {
      eligibilityScore += 5;
      reasons.push('Moderate debt-to-income ratio');
    } else {
      eligibilityScore -= 15;
      reasons.push('High debt-to-income ratio');
      recommendations.push('Pay down existing debts before applying');
    }

    // Factor 3: Credit Score (20% weight)
    if (creditScore) {
      if (creditScore >= 750) {
        eligibilityScore += 10;
        reasons.push('Excellent credit score');
      } else if (creditScore >= 700) {
        eligibilityScore += 5;
        reasons.push('Good credit score');
      } else if (creditScore >= 650) {
        eligibilityScore += 0;
        reasons.push('Fair credit score');
      } else {
        eligibilityScore -= 10;
        reasons.push('Poor credit score');
        recommendations.push('Improve credit score before applying');
      }
    }

    // Factor 4: Employment Stability (10% weight)
    if (employmentType === 'Salaried' && employmentYears >= 2) {
      eligibilityScore += 5;
      reasons.push('Stable employment');
    } else if (employmentType === 'Self-Employed' && employmentYears >= 3) {
      eligibilityScore += 5;
      reasons.push('Established business');
    } else {
      eligibilityScore -= 5;
      reasons.push('Limited employment history');
      recommendations.push('Build employment history');
    }

    // Clamp score between 0 and 100
    eligibilityScore = Math.max(0, Math.min(100, eligibilityScore));

    // Calculate eligible amount (typically 40-60x monthly disposable income)
    const multiplier = eligibilityScore >= 70 ? 60 : eligibilityScore >= 50 ? 50 : 40;
    const eligibleAmount = Math.min(
      disposableIncome * multiplier,
      requestedAmount * 1.2, // Can approve up to 20% more than requested
    );

    const isEligible = eligibilityScore >= 50 && eligibleAmount >= requestedAmount * 0.8;

    // Estimate EMI for eligible amount (using average rate of 12%)
    const estimatedEMI = this.calculationService.calculateEMI(
      eligibleAmount,
      12,
      24, // Default 24 months
      'Monthly',
    );

    // Get suggested loan products
    let suggestedProducts: Array<{
      productId: string;
      productName: string;
      interestRate: number;
      emi: number;
    }> = [];

    if (companyId) {
      const products = await this.loanProductRepository.find({
        where: {
          companyId,
          disabled: false,
        },
        order: { rateOfInterest: 'ASC' },
        take: 3,
      });

      suggestedProducts = products.map((product) => ({
        productId: product.id,
        productName: product.productName,
        interestRate: Number(product.rateOfInterest),
        emi: this.calculationService.calculateEMI(
          eligibleAmount,
          Number(product.rateOfInterest),
          24,
          'Monthly',
        ),
      }));
    }

    // Recommended tenure based on eligibility
    const recommendedTenure = eligibilityScore >= 70 ? 36 : eligibilityScore >= 50 ? 24 : 12;

    if (!isEligible) {
      recommendations.push(
        `Requested amount may be too high. Consider ${Math.floor(eligibleAmount)} instead.`,
      );
    }

    return {
      isEligible,
      eligibleAmount: Math.floor(eligibleAmount),
      recommendedTenure,
      estimatedEMI: Math.ceil(estimatedEMI),
      debtToIncomeRatio: Math.round(debtToIncomeRatio * 100) / 100,
      eligibilityScore: Math.round(eligibilityScore),
      reasons,
      recommendations,
      suggestedProducts,
    };
  }

  /**
   * Compare multiple loan products
   */
  async compareLoans(dto: LoanComparisonDto): Promise<ComparisonResult> {
    const { loanAmount, tenureMonths, loanProducts } = dto;

    const comparisonResults = loanProducts.map((product) => {
      const emi = this.calculationService.calculateEMI(
        loanAmount,
        product.interestRate,
        tenureMonths,
        'Monthly',
      );

      const totalAmount = new Decimal(emi).times(tenureMonths).toNumber();
      const totalInterest = totalAmount - loanAmount;

      const processingFee =
        product.processingFeeType === 'percentage'
          ? (loanAmount * (product.processingFee || 0)) / 100
          : product.processingFee || 0;

      const totalCost = totalAmount + processingFee;
      const effectiveRate = this.calculateEffectiveRate(
        loanAmount,
        totalCost,
        tenureMonths,
      );

      return {
        productName: product.productName,
        interestRate: product.interestRate,
        emi,
        totalInterest,
        totalAmount,
        processingFee,
        totalCost,
        effectiveRate,
        savings: 0, // Will be calculated later
      };
    });

    // Sort by total cost (ascending)
    comparisonResults.sort((a, b) => a.totalCost - b.totalCost);

    // Calculate savings compared to highest cost option
    const highestCost = comparisonResults[comparisonResults.length - 1].totalCost;
    comparisonResults.forEach((result) => {
      result.savings = highestCost - result.totalCost;
    });

    const bestOption = comparisonResults[0];

    return {
      loanAmount,
      tenureMonths,
      products: comparisonResults,
      bestOption: {
        productName: bestOption.productName,
        totalSavings: bestOption.savings || 0,
        reason: `Lowest total cost with ${bestOption.interestRate}% interest rate`,
      },
    };
  }

  /**
   * Calculate early repayment savings
   */
  async calculateEarlyRepayment(
    dto: EarlyRepaymentCalculatorDto,
  ): Promise<EarlyRepaymentResult> {
    const {
      originalLoanAmount,
      interestRate,
      originalTenureMonths,
      monthsPaid,
      earlyRepaymentAmount,
      prepaymentCharges = 0,
    } = dto;

    // Calculate original EMI
    const originalEMI = this.calculationService.calculateEMI(
      originalLoanAmount,
      interestRate,
      originalTenureMonths,
      'Monthly',
    );

    // Calculate outstanding balance after months paid
    const outstandingBalance = this.calculateOutstandingBalance(
      originalLoanAmount,
      interestRate,
      originalTenureMonths,
      monthsPaid,
      originalEMI,
    );

    // Calculate prepayment charges
    const calculatedPrepaymentCharges = (earlyRepaymentAmount * prepaymentCharges) / 100;
    const totalPrepaymentCost = earlyRepaymentAmount + calculatedPrepaymentCharges;

    // New outstanding balance after prepayment
    const newOutstandingBalance = outstandingBalance - earlyRepaymentAmount;

    // Calculate new tenure with same EMI
    const newTenureMonths = this.calculateNewTenure(
      newOutstandingBalance,
      interestRate,
      originalEMI,
    );

    // Calculate interest that would have been paid without prepayment
    const remainingMonths = originalTenureMonths - monthsPaid;
    const interestWithoutPrepayment = this.calculateTotalInterest(
      outstandingBalance,
      interestRate,
      remainingMonths,
      originalEMI,
    );

    // Calculate interest with prepayment
    const interestWithPrepayment = this.calculateTotalInterest(
      newOutstandingBalance,
      interestRate,
      newTenureMonths,
      originalEMI,
    );

    const interestSaved = interestWithoutPrepayment - interestWithPrepayment;
    const timeSavedMonths = remainingMonths - newTenureMonths;
    const totalSavings = interestSaved - calculatedPrepaymentCharges;

    // Calculate break-even point (months to recover prepayment charges)
    const monthlyInterestSavings = interestSaved / remainingMonths;
    const breakEvenMonths =
      monthlyInterestSavings > 0
        ? Math.ceil(calculatedPrepaymentCharges / monthlyInterestSavings)
        : 0;

    return {
      originalLoanAmount,
      originalTenureMonths,
      monthsPaid,
      earlyRepaymentAmount,
      prepaymentCharges: calculatedPrepaymentCharges,
      totalPrepaymentCost,
      newOutstandingBalance: Math.max(0, newOutstandingBalance),
      newTenureMonths: Math.max(0, newTenureMonths),
      newEMI: originalEMI,
      interestSaved: Math.max(0, interestSaved),
      timeSavedMonths: Math.max(0, timeSavedMonths),
      totalSavings: Math.max(0, totalSavings),
      breakEvenMonths,
    };
  }

  /**
   * Estimate interest rate based on profile
   */
  async estimateRate(dto: RateEstimatorDto): Promise<RateEstimateResult> {
    const { loanAmount, tenureMonths, monthlyIncome, creditScore, employmentType } = dto;

    // Base rate range (8% - 24%)
    let minRate = 8;
    let maxRate = 24;
    let likelyRate = 12;

    const factors: Array<{
      factor: string;
      impact: 'positive' | 'negative' | 'neutral';
      description: string;
    }> = [];

    const recommendations: string[] = [];

    // Factor 1: Credit Score
    if (creditScore) {
      if (creditScore >= 750) {
        minRate = 8;
        maxRate = 12;
        likelyRate = 10;
        factors.push({
          factor: 'Excellent Credit Score',
          impact: 'positive',
          description: `Credit score of ${creditScore} qualifies for best rates`,
        });
      } else if (creditScore >= 700) {
        minRate = 10;
        maxRate = 15;
        likelyRate = 12.5;
        factors.push({
          factor: 'Good Credit Score',
          impact: 'positive',
          description: `Credit score of ${creditScore} qualifies for competitive rates`,
        });
      } else if (creditScore >= 650) {
        minRate = 12;
        maxRate = 18;
        likelyRate = 15;
        factors.push({
          factor: 'Fair Credit Score',
          impact: 'neutral',
          description: `Credit score of ${creditScore} may result in higher rates`,
        });
        recommendations.push('Improve credit score to get better rates');
      } else {
        minRate = 15;
        maxRate = 24;
        likelyRate = 18;
        factors.push({
          factor: 'Low Credit Score',
          impact: 'negative',
          description: `Credit score of ${creditScore} will result in higher interest rates`,
        });
        recommendations.push('Focus on improving credit score before applying');
      }
    }

    // Factor 2: Loan-to-Income Ratio
    const annualIncome = monthlyIncome * 12;
    const loanToIncomeRatio = loanAmount / annualIncome;

    if (loanToIncomeRatio <= 0.5) {
      likelyRate -= 0.5;
      factors.push({
        factor: 'Low Loan-to-Income Ratio',
        impact: 'positive',
        description: 'Loan amount is reasonable relative to income',
      });
    } else if (loanToIncomeRatio > 1) {
      likelyRate += 2;
      factors.push({
        factor: 'High Loan-to-Income Ratio',
        impact: 'negative',
        description: 'Loan amount is high relative to income',
      });
      recommendations.push('Consider reducing loan amount for better rates');
    }

    // Factor 3: Employment Type
    if (employmentType === 'Salaried') {
      likelyRate -= 0.5;
      factors.push({
        factor: 'Salaried Employment',
        impact: 'positive',
        description: 'Salaried employment provides income stability',
      });
    } else if (employmentType === 'Self-Employed') {
      likelyRate += 1;
      factors.push({
        factor: 'Self-Employed',
        impact: 'neutral',
        description: 'Self-employed applicants may face slightly higher rates',
      });
    }

    // Factor 4: Loan Tenure
    if (tenureMonths <= 12) {
      likelyRate += 0.5;
      factors.push({
        factor: 'Short Tenure',
        impact: 'neutral',
        description: 'Shorter tenure may have slightly higher rates',
      });
    } else if (tenureMonths >= 36) {
      likelyRate += 1;
      factors.push({
        factor: 'Long Tenure',
        impact: 'neutral',
        description: 'Longer tenure may have slightly higher rates',
      });
    }

    // Clamp rates
    minRate = Math.max(8, Math.min(24, minRate));
    maxRate = Math.max(8, Math.min(24, maxRate));
    likelyRate = Math.max(8, Math.min(24, likelyRate));

    return {
      loanAmount,
      tenureMonths,
      estimatedRateRange: {
        min: Math.round(minRate * 100) / 100,
        max: Math.round(maxRate * 100) / 100,
        likely: Math.round(likelyRate * 100) / 100,
      },
      factors,
      recommendations,
    };
  }

  /**
   * Generate amortization schedule
   */
  private generateAmortizationSchedule(
    principal: number,
    annualRate: number,
    periods: number,
    frequency: string,
    startDate?: string,
  ): AmortizationEntry[] {
    const schedule: AmortizationEntry[] = [];
    const emi = this.calculationService.calculateEMI(
      principal,
      annualRate,
      periods,
      frequency,
    );

    let outstandingBalance = new Decimal(principal);
    let cumulativeInterest = new Decimal(0);
    let cumulativePrincipal = new Decimal(0);

    const frequencyMultiplier = this.getFrequencyMultiplier(frequency);
    const monthlyRate = new Decimal(annualRate).div(12 * 100);

    const start = startDate ? new Date(startDate) : new Date();

    for (let i = 1; i <= periods; i++) {
      // Calculate interest for this period
      const interest = outstandingBalance.times(monthlyRate).toNumber();
      const principalPaid = emi - interest;

      outstandingBalance = outstandingBalance.minus(principalPaid);
      cumulativeInterest = cumulativeInterest.plus(interest);
      cumulativePrincipal = cumulativePrincipal.plus(principalPaid);

      // Calculate payment date
      const paymentDate = new Date(start);
      paymentDate.setMonth(paymentDate.getMonth() + i - 1);

      schedule.push({
        paymentNumber: i,
        paymentDate: paymentDate.toISOString().split('T')[0],
        emi: Math.round(emi * 100) / 100,
        principal: Math.round(principalPaid * 100) / 100,
        interest: Math.round(interest * 100) / 100,
        outstandingBalance: Math.max(0, Math.round(outstandingBalance.toNumber() * 100) / 100),
        cumulativeInterest: Math.round(cumulativeInterest.toNumber() * 100) / 100,
        cumulativePrincipal: Math.round(cumulativePrincipal.toNumber() * 100) / 100,
      });
    }

    return schedule;
  }

  /**
   * Calculate outstanding balance
   */
  private calculateOutstandingBalance(
    principal: number,
    annualRate: number,
    totalPeriods: number,
    periodsPaid: number,
    emi: number,
  ): number {
    const monthlyRate = new Decimal(annualRate).div(12 * 100);
    const principalDecimal = new Decimal(principal);
    const onePlusRate = new Decimal(1).plus(monthlyRate);
    const emiDecimal = new Decimal(emi);

    // Outstanding balance formula: P * (1+r)^n - EMI * [((1+r)^n - 1) / r]
    const futureValue = principalDecimal.times(onePlusRate.pow(periodsPaid));
    const emiFactor = emiDecimal.times(
      onePlusRate.pow(periodsPaid).minus(1).div(monthlyRate),
    );

    return Math.max(0, futureValue.minus(emiFactor).toNumber());
  }

  /**
   * Calculate new tenure after prepayment
   */
  private calculateNewTenure(
    outstandingBalance: number,
    annualRate: number,
    emi: number,
  ): number {
    if (outstandingBalance <= 0 || emi <= 0) {
      return 0;
    }

    const monthlyRate = new Decimal(annualRate).div(12 * 100);
    const balanceDecimal = new Decimal(outstandingBalance);
    const emiDecimal = new Decimal(emi);

    // Solve for n: EMI = P * r * (1+r)^n / ((1+r)^n - 1)
    // Rearranged: n = log(1 + (P*r/EMI)) / log(1+r)
    const rateTimesBalance = balanceDecimal.times(monthlyRate);
    const ratio = rateTimesBalance.div(emiDecimal);
    const numerator = new Decimal(1).plus(ratio);
    const denominator = new Decimal(1).plus(monthlyRate);

    if (numerator.lte(1) || denominator.lte(1)) {
      return Math.ceil(outstandingBalance / emi);
    }

    const tenure = Math.log(numerator.toNumber()) / Math.log(denominator.toNumber());
    return Math.ceil(tenure);
  }

  /**
   * Calculate total interest for remaining periods
   */
  private calculateTotalInterest(
    principal: number,
    annualRate: number,
    periods: number,
    emi: number,
  ): number {
    const totalAmount = new Decimal(emi).times(periods);
    return Math.max(0, totalAmount.minus(principal).toNumber());
  }

  /**
   * Calculate effective rate (APR)
   */
  private calculateEffectiveRate(
    principal: number,
    totalCost: number,
    periods: number,
  ): number {
    // Simplified APR calculation
    const totalInterest = totalCost - principal;
    const annualInterest = (totalInterest / periods) * 12;
    return principal > 0 ? (annualInterest / principal) * 100 : 0;
  }

  /**
   * Calculate loan refinancing analysis
   */
  async calculateRefinancing(
    dto: LoanRefinancingDto,
  ): Promise<LoanRefinancingResult> {
    const {
      currentLoanAmount,
      currentInterestRate,
      remainingTenureMonths,
      currentEMI,
      newInterestRate,
      newTenureMonths,
      refinancingFees = 0,
      refinancingFeeType = 'percentage',
      prepaymentCharges = 0,
    } = dto;

    // Calculate remaining interest on current loan
    const totalRemainingAmount = new Decimal(currentEMI).times(remainingTenureMonths).toNumber();
    const totalInterestRemaining = totalRemainingAmount - currentLoanAmount;

    // Calculate new loan details
    const newTenure = newTenureMonths || remainingTenureMonths;
    const newEMI = this.calculationService.calculateEMI(
      currentLoanAmount,
      newInterestRate,
      newTenure,
      'Monthly',
    );

    const newTotalAmount = new Decimal(newEMI).times(newTenure).toNumber();
    const newTotalInterest = newTotalAmount - currentLoanAmount;

    // Calculate fees
    const calculatedRefinancingFees =
      refinancingFeeType === 'percentage'
        ? (currentLoanAmount * refinancingFees) / 100
        : refinancingFees;

    const calculatedPrepaymentCharges = (currentLoanAmount * prepaymentCharges) / 100;
    const totalFees = calculatedRefinancingFees + calculatedPrepaymentCharges;

    // Calculate savings
    const monthlySavings = currentEMI - newEMI;
    const totalInterestSaved = totalInterestRemaining - newTotalInterest;
    const totalSavings = totalInterestSaved - totalFees;

    // Calculate break-even point (months to recover fees)
    const breakEvenMonths =
      monthlySavings > 0 ? Math.ceil(totalFees / monthlySavings) : Infinity;

    // Time saved (if new tenure is shorter)
    const timeSavedMonths = Math.max(0, remainingTenureMonths - newTenure);

    // Determine if refinancing is recommended
    const shouldRefinance = totalSavings > 0 && breakEvenMonths < newTenure * 0.5; // Break even in first half of tenure

    const factors: Array<{
      factor: string;
      impact: 'positive' | 'negative' | 'neutral';
      description: string;
    }> = [];

    // Factor 1: Interest rate difference
    const rateDifference = currentInterestRate - newInterestRate;
    if (rateDifference > 2) {
      factors.push({
        factor: 'Significant Rate Reduction',
        impact: 'positive',
        description: `Rate reduction of ${rateDifference.toFixed(2)}% provides substantial savings`,
      });
    } else if (rateDifference > 0.5) {
      factors.push({
        factor: 'Moderate Rate Reduction',
        impact: 'positive',
        description: `Rate reduction of ${rateDifference.toFixed(2)}% provides moderate savings`,
      });
    } else if (rateDifference < 0) {
      factors.push({
        factor: 'Rate Increase',
        impact: 'negative',
        description: `New rate is ${Math.abs(rateDifference).toFixed(2)}% higher - not recommended`,
      });
    } else {
      factors.push({
        factor: 'Minimal Rate Difference',
        impact: 'neutral',
        description: 'Rate difference is minimal - consider fees carefully',
      });
    }

    // Factor 2: Break-even period
    if (breakEvenMonths <= 6) {
      factors.push({
        factor: 'Quick Break-Even',
        impact: 'positive',
        description: `Fees recovered in ${breakEvenMonths} months - excellent`,
      });
    } else if (breakEvenMonths <= 12) {
      factors.push({
        factor: 'Reasonable Break-Even',
        impact: 'positive',
        description: `Fees recovered in ${breakEvenMonths} months - good`,
      });
    } else if (breakEvenMonths < newTenure) {
      factors.push({
        factor: 'Long Break-Even',
        impact: 'neutral',
        description: `Fees recovered in ${breakEvenMonths} months - consider carefully`,
      });
    } else {
      factors.push({
        factor: 'No Break-Even',
        impact: 'negative',
        description: 'Fees exceed savings - not recommended',
      });
    }

    // Factor 3: Total savings
    if (totalSavings > currentLoanAmount * 0.1) {
      factors.push({
        factor: 'Significant Savings',
        impact: 'positive',
        description: `Total savings of ${totalSavings.toFixed(2)} is substantial`,
      });
    } else if (totalSavings > 0) {
      factors.push({
        factor: 'Moderate Savings',
        impact: 'positive',
        description: `Total savings of ${totalSavings.toFixed(2)} is moderate`,
      });
    } else {
      factors.push({
        factor: 'No Savings',
        impact: 'negative',
        description: 'Refinancing does not provide savings after fees',
      });
    }

    let reason: string;
    if (shouldRefinance) {
      reason = `Refinancing is recommended. You'll save ${totalSavings.toFixed(2)} in interest and ${monthlySavings.toFixed(2)} per month. Break-even in ${breakEvenMonths} months.`;
    } else if (totalSavings > 0) {
      reason = `Refinancing may be beneficial, but break-even period is ${breakEvenMonths} months. Consider if you plan to keep the loan long-term.`;
    } else {
      reason = `Refinancing is not recommended. Fees and charges exceed potential savings.`;
    }

    return {
      currentLoan: {
        loanAmount: currentLoanAmount,
        interestRate: currentInterestRate,
        remainingTenureMonths,
        emi: currentEMI,
        totalInterestRemaining: Math.round(totalInterestRemaining * 100) / 100,
        totalAmountRemaining: Math.round(totalRemainingAmount * 100) / 100,
      },
      newLoan: {
        loanAmount: currentLoanAmount,
        interestRate: newInterestRate,
        tenureMonths: newTenure,
        emi: Math.round(newEMI * 100) / 100,
        totalInterest: Math.round(newTotalInterest * 100) / 100,
        totalAmount: Math.round(newTotalAmount * 100) / 100,
        refinancingFees: Math.round(calculatedRefinancingFees * 100) / 100,
        prepaymentCharges: Math.round(calculatedPrepaymentCharges * 100) / 100,
        totalCost: Math.round((newTotalAmount + totalFees) * 100) / 100,
      },
      savings: {
        monthlySavings: Math.round(monthlySavings * 100) / 100,
        totalInterestSaved: Math.round(totalInterestSaved * 100) / 100,
        totalSavings: Math.round(totalSavings * 100) / 100,
        breakEvenMonths,
        timeSavedMonths,
      },
      recommendation: {
        shouldRefinance,
        reason,
        factors,
      },
    };
  }

  /**
   * Get frequency multiplier
   */
  private getFrequencyMultiplier(frequency: string): number {
    const multipliers: Record<string, number> = {
      Monthly: 12,
      Quarterly: 4,
      'Bi-Weekly': 26,
      Weekly: 52,
      Daily: 365,
    };
    return multipliers[frequency] || 12;
  }
}

