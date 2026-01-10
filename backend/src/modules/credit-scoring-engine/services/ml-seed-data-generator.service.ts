import { Injectable, Logger } from '@nestjs/common';
import { TrainingData } from './ml-model-training.service';

/**
 * ML Seed Data Generator Service
 * 
 * Generates realistic historical training data for ML model training
 */
@Injectable()
export class MLSeedDataGeneratorService {
  private readonly logger = new Logger(MLSeedDataGeneratorService.name);

  /**
   * Generate training data for credit scoring model
   */
  async generateTrainingData(
    sampleCount: number = 1000,
    options?: {
      includeHighRisk?: boolean;
      includeLowRisk?: boolean;
      includeMediumRisk?: boolean;
      dateRange?: { start: Date; end: Date };
    },
  ): Promise<TrainingData> {
    this.logger.log(`Generating ${sampleCount} training samples`);

    const samples: Array<{ features: Record<string, any>; target: number }> = [];
    
    const {
      includeHighRisk = true,
      includeLowRisk = true,
      includeMediumRisk = true,
      dateRange,
    } = options || {};

    const startDate = dateRange?.start || new Date(Date.now() - 365 * 24 * 60 * 60 * 1000 * 2); // 2 years ago
    const endDate = dateRange?.end || new Date();

    // Generate samples with different risk profiles
    const highRiskCount = includeHighRisk ? Math.floor(sampleCount * 0.2) : 0;
    const lowRiskCount = includeLowRisk ? Math.floor(sampleCount * 0.4) : 0;
    const mediumRiskCount = includeMediumRisk ? sampleCount - highRiskCount - lowRiskCount : sampleCount;

    // Generate high-risk samples (poor credit, low scores)
    for (let i = 0; i < highRiskCount; i++) {
      samples.push(this.generateHighRiskSample(startDate, endDate));
    }

    // Generate low-risk samples (good credit, high scores)
    for (let i = 0; i < lowRiskCount; i++) {
      samples.push(this.generateLowRiskSample(startDate, endDate));
    }

    // Generate medium-risk samples (mixed profiles)
    for (let i = 0; i < mediumRiskCount; i++) {
      samples.push(this.generateMediumRiskSample(startDate, endDate));
    }

    // Shuffle samples for better training
    this.shuffleArray(samples);

    return {
      samples,
      featureNames: this.getFeatureNames(),
    };
  }

  /**
   * Generate high-risk sample (poor credit profile)
   */
  private generateHighRiskSample(startDate: Date, endDate: Date): { features: Record<string, any>; target: number } {
    const creditScore = this.randomInt(300, 580); // Low credit score
    const monthlyIncome = this.randomInt(2000, 4000);
    const totalDebt = this.randomInt(15000, 50000);
    const monthsOfHistory = this.randomInt(6, 24);
    
    // Ensure debt is high relative to income for high-risk
    const minDebt = monthlyIncome * 12 * 0.3; // At least 30% DTI
    const adjustedDebt = Math.max(totalDebt, minDebt);

    return {
      features: {
        // Traditional Bureau
        creditScore,
        paymentHistory: this.generatePaymentHistory(monthsOfHistory, 0.4, startDate, endDate), // 40% on-time
        totalCreditLimit: this.randomInt(5000, 20000),
        totalCreditUsed: this.randomInt(4000, 18000), // High utilization
        publicRecords: this.randomInt(1, 3), // Has public records

        // Alternative Financial
        monthlyIncome,
        monthlySavings: this.randomInt(-500, 200), // Negative or low savings
        totalDebt: adjustedDebt,
        averageBalance: this.randomInt(100, 1000), // Low balance
        incomeHistory: this.generateIncomeHistory(monthsOfHistory, monthlyIncome, 0.3, startDate), // Unstable
        transactionHistory: this.generateTransactionHistory(monthsOfHistory, monthlyIncome, 0.4, startDate),
        utilityPaymentHistory: this.generatePaymentHistory(monthsOfHistory, 0.5, startDate, endDate),
        rentPaymentHistory: this.generatePaymentHistory(monthsOfHistory, 0.6, startDate, endDate),

        // Behavioral
        applicationCompleteness: this.randomFloat(0.6, 0.8), // Incomplete
        timeToComplete: this.randomInt(2, 5), // Too fast (suspicious)
        deviceConsistency: Math.random() > 0.7, // Inconsistent
        digitalFootprintScore: this.randomFloat(0.3, 0.5), // Weak profile

        // Employment
        employmentHistory: this.generateEmploymentHistory(monthsOfHistory, true, startDate),

        // Account info
        accountOpenDates: this.generateAccountOpenDates(1, 12, startDate),

        // Risk indicators
        hasRecentBankruptcy: Math.random() > 0.7,
        hasRecentForeclosure: Math.random() > 0.8,
        hasRecentCollections: Math.random() > 0.6,
        hasRecentLatePayments: true,
        hasHighDebt: adjustedDebt / (monthlyIncome * 12) > 0.4,
      },
      target: creditScore + this.randomInt(-30, 30), // Target around credit score
    };
  }

  /**
   * Generate low-risk sample (good credit profile)
   */
  private generateLowRiskSample(startDate: Date, endDate: Date): { features: Record<string, any>; target: number } {
    const creditScore = this.randomInt(700, 850); // High credit score
    const monthlyIncome = this.randomInt(5000, 15000);
    // Ensure debt is low relative to income for low-risk (max 30% DTI)
    const maxDebt = monthlyIncome * 12 * 0.3;
    const totalDebt = this.randomInt(5000, Math.min(30000, maxDebt));
    const monthsOfHistory = this.randomInt(24, 60);

    return {
      features: {
        // Traditional Bureau
        creditScore,
        paymentHistory: this.generatePaymentHistory(monthsOfHistory, 0.95, startDate, endDate), // 95% on-time
        totalCreditLimit: this.randomInt(30000, 100000),
        totalCreditUsed: this.randomInt(3000, 15000), // Low utilization
        publicRecords: 0, // No public records

        // Alternative Financial
        monthlyIncome,
        monthlySavings: this.randomInt(1000, 5000), // Good savings
        totalDebt,
        averageBalance: this.randomInt(5000, 50000), // High balance
        incomeHistory: this.generateIncomeHistory(monthsOfHistory, monthlyIncome, 0.1, startDate), // Stable
        transactionHistory: this.generateTransactionHistory(monthsOfHistory, monthlyIncome, 0.15, startDate),
        utilityPaymentHistory: this.generatePaymentHistory(monthsOfHistory, 0.98, startDate, endDate),
        rentPaymentHistory: this.generatePaymentHistory(monthsOfHistory, 1.0, startDate, endDate), // Always on-time

        // Behavioral
        applicationCompleteness: this.randomFloat(0.95, 1.0), // Complete
        timeToComplete: this.randomInt(8, 25), // Reasonable time
        deviceConsistency: true, // Consistent
        digitalFootprintScore: this.randomFloat(0.8, 1.0), // Strong profile

        // Employment
        employmentHistory: this.generateEmploymentHistory(monthsOfHistory, false, startDate),

        // Account info
        accountOpenDates: this.generateAccountOpenDates(3, 10, startDate),

        // Risk indicators
        hasRecentBankruptcy: false,
        hasRecentForeclosure: false,
        hasRecentCollections: false,
        hasRecentLatePayments: false,
        hasHighDebt: false,
      },
      target: creditScore + this.randomInt(-20, 20),
    };
  }

  /**
   * Generate medium-risk sample (mixed profile)
   */
  private generateMediumRiskSample(startDate: Date, endDate: Date): { features: Record<string, any>; target: number } {
    const creditScore = this.randomInt(580, 700); // Medium credit score
    const monthlyIncome = this.randomInt(3000, 8000);
    const totalDebt = this.randomInt(10000, 40000);
    const monthsOfHistory = this.randomInt(12, 36);

    return {
      features: {
        // Traditional Bureau
        creditScore,
        paymentHistory: this.generatePaymentHistory(monthsOfHistory, 0.75, startDate, endDate), // 75% on-time
        totalCreditLimit: this.randomInt(15000, 50000),
        totalCreditUsed: this.randomInt(8000, 30000),
        publicRecords: Math.random() > 0.8 ? 1 : 0,

        // Alternative Financial
        monthlyIncome,
        monthlySavings: this.randomInt(200, 2000),
        totalDebt,
        averageBalance: this.randomInt(1000, 10000),
        incomeHistory: this.generateIncomeHistory(monthsOfHistory, monthlyIncome, 0.2, startDate),
        transactionHistory: this.generateTransactionHistory(monthsOfHistory, monthlyIncome, 0.25, startDate),
        utilityPaymentHistory: this.generatePaymentHistory(monthsOfHistory, 0.8, startDate, endDate),
        rentPaymentHistory: this.generatePaymentHistory(monthsOfHistory, 0.85, startDate, endDate),

        // Behavioral
        applicationCompleteness: this.randomFloat(0.8, 0.95),
        timeToComplete: this.randomInt(5, 20),
        deviceConsistency: Math.random() > 0.3,
        digitalFootprintScore: this.randomFloat(0.5, 0.8),

        // Employment
        employmentHistory: this.generateEmploymentHistory(monthsOfHistory, Math.random() > 0.7, startDate),

        // Account info
        accountOpenDates: this.generateAccountOpenDates(1, 5, startDate),

        // Risk indicators
        hasRecentBankruptcy: Math.random() > 0.9,
        hasRecentForeclosure: Math.random() > 0.95,
        hasRecentCollections: Math.random() > 0.8,
        hasRecentLatePayments: Math.random() > 0.5,
        hasHighDebt: Math.random() > 0.6,
      },
      target: creditScore + this.randomInt(-40, 40),
    };
  }

  /**
   * Generate payment history
   */
  private generatePaymentHistory(
    months: number,
    onTimeRate: number,
    startDate: Date,
    endDate: Date,
  ): Array<{ date: Date; onTime: boolean }> {
    const payments: Array<{ date: Date; onTime: boolean }> = [];
    const monthDiff = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 30);
    const actualMonths = Math.min(months, Math.floor(monthDiff));

    for (let i = 0; i < actualMonths; i++) {
      const date = new Date(startDate);
      date.setMonth(date.getMonth() + i);
      payments.push({
        date,
        onTime: Math.random() < onTimeRate,
      });
    }

    return payments;
  }

  /**
   * Generate income history
   */
  private generateIncomeHistory(
    months: number,
    baseIncome: number,
    volatility: number,
    startDate: Date,
  ): Array<{ date: Date; amount: number }> {
    const history: Array<{ date: Date; amount: number }> = [];
    const monthDiff = (new Date().getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 30);
    const actualMonths = Math.min(months, Math.floor(monthDiff));

    for (let i = 0; i < actualMonths; i++) {
      const date = new Date(startDate);
      date.setMonth(date.getMonth() + i);
      const variation = (Math.random() - 0.5) * 2 * volatility; // -volatility to +volatility
      history.push({
        date,
        amount: baseIncome * (1 + variation),
      });
    }

    return history;
  }

  /**
   * Generate transaction history
   */
  private generateTransactionHistory(
    months: number,
    monthlyIncome: number,
    volatility: number,
    startDate: Date,
  ): Array<{ date: Date; amount: number; type: string }> {
    const transactions: Array<{ date: Date; amount: number; type: string }> = [];
    const monthDiff = (new Date().getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 30);
    const actualMonths = Math.min(months, Math.floor(monthDiff));

    const transactionTypes = ['SALARY', 'GROCERIES', 'UTILITIES', 'RENT', 'ENTERTAINMENT', 'TRANSPORT', 'SHOPPING'];

    for (let i = 0; i < actualMonths; i++) {
      const date = new Date(startDate);
      date.setMonth(date.getMonth() + i);
      
      // Income transaction
      const incomeVariation = (Math.random() - 0.5) * 2 * volatility;
      transactions.push({
        date: new Date(date.getFullYear(), date.getMonth(), 1),
        amount: monthlyIncome * (1 + incomeVariation),
        type: 'SALARY',
      });

      // Expense transactions (10-20 per month)
      const expenseCount = this.randomInt(10, 20);
      for (let j = 0; j < expenseCount; j++) {
        const expenseDate = new Date(date);
        expenseDate.setDate(this.randomInt(1, 28));
        transactions.push({
          date: expenseDate,
          amount: -this.randomInt(20, 500),
          type: transactionTypes[this.randomInt(1, transactionTypes.length - 1)],
        });
      }
    }

    return transactions;
  }

  /**
   * Generate employment history
   */
  private generateEmploymentHistory(
    totalMonths: number,
    unstable: boolean,
    startDate: Date,
  ): Array<{ company: string; durationMonths: number }> {
    const companies = ['Tech Corp', 'Finance Inc', 'Retail Co', 'Manufacturing Ltd', 'Services LLC'];
    const history: Array<{ company: string; durationMonths: number }> = [];

    if (unstable) {
      // Multiple short-term jobs
      const jobCount = this.randomInt(2, 5);
      let remainingMonths = totalMonths;
      
      for (let i = 0; i < jobCount && remainingMonths > 0; i++) {
        const duration = Math.min(this.randomInt(3, 12), remainingMonths);
        history.push({
          company: companies[this.randomInt(0, companies.length - 1)],
          durationMonths: duration,
        });
        remainingMonths -= duration;
      }
    } else {
      // One or two long-term jobs
      if (totalMonths > 24) {
        const firstJobMonths = this.randomInt(12, totalMonths - 6);
        history.push({
          company: companies[0],
          durationMonths: firstJobMonths,
        });
        if (totalMonths - firstJobMonths > 6) {
          history.push({
            company: companies[1],
            durationMonths: totalMonths - firstJobMonths,
          });
        }
      } else {
        history.push({
          company: companies[0],
          durationMonths: totalMonths,
        });
      }
    }

    return history;
  }

  /**
   * Generate account open dates
   */
  private generateAccountOpenDates(
    minAccounts: number,
    maxAccounts: number,
    startDate: Date,
  ): Date[] {
    const accountCount = this.randomInt(minAccounts, maxAccounts);
    const dates: Date[] = [];

    for (let i = 0; i < accountCount; i++) {
      const yearsAgo = this.randomInt(1, 10);
      const date = new Date();
      date.setFullYear(date.getFullYear() - yearsAgo);
      date.setMonth(this.randomInt(0, 11));
      date.setDate(this.randomInt(1, 28));
      dates.push(date);
    }

    return dates.sort((a, b) => a.getTime() - b.getTime());
  }

  /**
   * Get feature names for training data
   */
  private getFeatureNames(): string[] {
    return [
      'creditScore',
      'paymentHistory',
      'totalCreditLimit',
      'totalCreditUsed',
      'publicRecords',
      'monthlyIncome',
      'monthlySavings',
      'totalDebt',
      'averageBalance',
      'applicationCompleteness',
      'timeToComplete',
      'deviceConsistency',
      'digitalFootprintScore',
      'hasRecentBankruptcy',
      'hasRecentForeclosure',
      'hasRecentCollections',
      'hasRecentLatePayments',
      'hasHighDebt',
    ];
  }

  /**
   * Shuffle array (Fisher-Yates algorithm)
   */
  private shuffleArray<T>(array: T[]): void {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
  }

  /**
   * Generate realistic credit score based on features
   * Uses a weighted formula that mimics real credit scoring
   */
  generateTargetScore(features: Record<string, any>): number {
    let score = 650; // Base score

    // Credit score impact (40% weight)
    if (features.creditScore) {
      score = features.creditScore * 0.4 + score * 0.6;
    }

    // Payment history impact (25% weight)
    if (features.paymentHistory && Array.isArray(features.paymentHistory) && features.paymentHistory.length > 0) {
      const onTimeRate = features.paymentHistory.filter((p: any) => p.onTime).length / features.paymentHistory.length;
      score += (onTimeRate - 0.5) * 120; // Strong impact
    }

    // Debt-to-income impact (15% weight)
    if (features.monthlyIncome && features.totalDebt && features.monthlyIncome > 0) {
      const dti = features.totalDebt / (features.monthlyIncome * 12);
      if (dti > 0.5) score -= 60; // Very high DTI
      else if (dti > 0.4) score -= 40;
      else if (dti > 0.3) score -= 20;
      else if (dti < 0.2) score += 30; // Low DTI is good
      else if (dti < 0.15) score += 50;
    }

    // Savings impact (10% weight)
    if (features.monthlyIncome && features.monthlySavings !== undefined && features.monthlyIncome > 0) {
      const savingsRate = features.monthlySavings / features.monthlyIncome;
      if (savingsRate > 0.25) score += 50; // Excellent savings
      else if (savingsRate > 0.2) score += 35;
      else if (savingsRate > 0.1) score += 20;
      else if (savingsRate < 0) score -= 40; // Negative savings (spending more than income)
      else if (savingsRate < 0.05) score -= 10;
    }

    // Credit utilization impact (5% weight)
    if (features.totalCreditLimit && features.totalCreditUsed !== undefined && features.totalCreditLimit > 0) {
      const utilization = features.totalCreditUsed / features.totalCreditLimit;
      if (utilization > 0.9) score -= 30; // Very high utilization
      else if (utilization > 0.8) score -= 20;
      else if (utilization < 0.3) score += 20; // Low utilization is good
      else if (utilization < 0.1) score += 30;
    }

    // Public records impact (5% weight)
    if (features.publicRecords > 0) {
      score -= features.publicRecords * 40; // Strong negative impact
    }

    // Risk indicators impact (strong penalties)
    if (features.hasRecentBankruptcy) score -= 120; // Major penalty
    if (features.hasRecentForeclosure) score -= 100;
    if (features.hasRecentCollections) score -= 60;
    if (features.hasRecentLatePayments) score -= 40;
    if (features.hasHighDebt) score -= 50;

    // Employment stability (5% weight)
    if (features.employmentHistory && Array.isArray(features.employmentHistory)) {
      const totalMonths = features.employmentHistory.reduce((sum: number, job: any) => sum + (job.durationMonths || 0), 0);
      const jobCount = features.employmentHistory.length;
      
      if (totalMonths > 60 && jobCount <= 2) score += 30; // Long, stable employment
      else if (totalMonths > 36 && jobCount <= 2) score += 20;
      else if (totalMonths < 12 || jobCount > 4) score -= 30; // Unstable
      else if (totalMonths < 24) score -= 15;
    }

    // Application quality (minor impact)
    if (features.applicationCompleteness) {
      score += (features.applicationCompleteness - 0.5) * 20;
    }

    // Digital footprint (minor impact)
    if (features.digitalFootprintScore) {
      score += (features.digitalFootprintScore - 0.5) * 15;
    }

    // Ensure score is in valid range
    return Math.max(300, Math.min(850, Math.round(score)));
  }

  /**
   * Generate bulk training data with realistic targets
   */
  async generateBulkTrainingData(
    sampleCount: number = 10000,
    options?: {
      dateRange?: { start: Date; end: Date };
      riskDistribution?: { high: number; medium: number; low: number };
    },
  ): Promise<TrainingData> {
    this.logger.log(`Generating bulk training data: ${sampleCount} samples`);

    const {
      dateRange,
      riskDistribution = { high: 0.2, medium: 0.4, low: 0.4 },
    } = options || {};

    const startDate = dateRange?.start || new Date(Date.now() - 365 * 24 * 60 * 60 * 1000 * 3); // 3 years ago
    const endDate = dateRange?.end || new Date();

    const highRiskCount = Math.floor(sampleCount * riskDistribution.high);
    const lowRiskCount = Math.floor(sampleCount * riskDistribution.low);
    const mediumRiskCount = sampleCount - highRiskCount - lowRiskCount;

    const samples: Array<{ features: Record<string, any>; target: number }> = [];

    // Generate samples
    for (let i = 0; i < highRiskCount; i++) {
      const sample = this.generateHighRiskSample(startDate, endDate);
      sample.target = this.generateTargetScore(sample.features);
      samples.push(sample);
    }

    for (let i = 0; i < lowRiskCount; i++) {
      const sample = this.generateLowRiskSample(startDate, endDate);
      sample.target = this.generateTargetScore(sample.features);
      samples.push(sample);
    }

    for (let i = 0; i < mediumRiskCount; i++) {
      const sample = this.generateMediumRiskSample(startDate, endDate);
      sample.target = this.generateTargetScore(sample.features);
      samples.push(sample);
    }

    // Shuffle for better training
    this.shuffleArray(samples);

    this.logger.log(`Generated ${samples.length} training samples`);

    return {
      samples,
      featureNames: this.getFeatureNames(),
    };
  }

  // Helper methods

  private randomInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  private randomFloat(min: number, max: number): number {
    return Math.random() * (max - min) + min;
  }
}

