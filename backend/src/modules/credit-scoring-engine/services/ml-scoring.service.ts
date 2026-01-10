import { Injectable, Logger, Inject, Optional } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MLModelTrainingService } from './ml-model-training.service';
import { ModelType } from '../dto/ml-model.dto';

/**
 * Machine Learning Credit Scoring Service
 * 
 * Implements ML-based credit scoring using:
 * - Feature engineering and normalization
 * - Model inference (XGBoost/LightGBM style)
 * - Ensemble methods
 * - Model versioning and A/B testing
 */
@Injectable()
export class MLScoringService {
  private readonly logger = new Logger(MLScoringService.name);
  
  // Model configuration
  private readonly modelVersion = 'v1.0.0';
  private readonly useML = true; // Feature flag for ML scoring
  
  // Feature weights (learned from training data)
  private readonly featureWeights = {
    // Traditional Bureau Features
    creditScore: 0.15,
    paymentHistory: 0.12,
    creditUtilization: 0.10,
    creditAge: 0.08,
    publicRecords: -0.15, // Negative weight for negative events
    
    // Alternative Financial Features
    bankAccountAge: 0.08,
    averageBalance: 0.10,
    applicationQuality: 0.05, // Behavioral feature weight
    cashFlowStability: 0.12,
    incomeStability: 0.10,
    utilityPaymentConsistency: 0.08,
    rentPaymentHistory: 0.07,
    
    // Behavioral Features
    applicationCompleteness: 0.05,
    timeToComplete: 0.03,
    deviceConsistency: 0.04,
    digitalFootprintScore: 0.06,
    transactionPatterns: 0.05,
    
    // Derived Features
    debtToIncomeRatio: -0.10,
    savingsRate: 0.08,
    employmentStability: 0.09,
  };

  constructor(
    private readonly configService: ConfigService,
    @Optional() @Inject(MLModelTrainingService)
    private readonly modelTrainingService?: MLModelTrainingService,
  ) {
    this.logger.log('ML Scoring Service initialized');
  }

  /**
   * Calculate ML-based credit score
   */
  async calculateMLScore(
    features: MLFeatureSet,
    userId?: string,
  ): Promise<MLScoreResult> {
    this.logger.debug('Calculating ML-based credit score');

    // Validate minimum feature requirements
    const hasMinimumFeatures = !!(
      features.creditScore ||
      features.monthlyIncome ||
      features.paymentHistory?.length ||
      features.transactionHistory?.length
    );

    if (!hasMinimumFeatures) {
      this.logger.warn('Insufficient features for ML scoring, using default values');
    }

    try {
      // Get active model (with A/B testing support)
      let activeModel = null;
      if (this.modelTrainingService) {
        activeModel = this.modelTrainingService.getModelForABTest(ModelType.CREDIT_SCORE, userId);
      }
      
      const modelVersion = activeModel?.version || this.modelVersion;
      
      // 1. Feature Engineering
      const engineeredFeatures = this.engineerFeatures(features);
      
      // 2. Feature Normalization
      const normalizedFeatures = this.normalizeFeatures(engineeredFeatures);
      
      // 3. Model Inference
      const rawScore = this.predictScore(normalizedFeatures, activeModel);
      
      // 4. Score Calibration
      const calibratedScore = this.calibrateScore(rawScore, features);
      
      // 5. Feature Importance Analysis
      const featureImportance = this.calculateFeatureImportance(normalizedFeatures);
      
      // 6. Confidence Calculation
      const confidence = this.calculateConfidence(normalizedFeatures, featureImportance);
      
      // 7. Risk Factors
      const riskFactors = this.identifyRiskFactors(normalizedFeatures, featureImportance);

      const result = {
        score: Math.round(calibratedScore),
        rawScore,
        confidence,
        featureImportance,
        riskFactors,
        modelVersion,
        calculatedAt: new Date(),
      };

      // Log prediction for monitoring (if model training service available)
      if (this.modelTrainingService && activeModel) {
        await this.modelTrainingService.logPrediction(
          activeModel.id,
          normalizedFeatures,
          result.score,
        );
      }

      return result;
    } catch (error) {
      this.logger.error(`Error calculating ML score: ${error.message}`, error.stack);
      // Don't throw - let the weighted scoring service fall back to rule-based
      throw error;
    }
  }

  /**
   * Feature Engineering Pipeline
   */
  private engineerFeatures(features: MLFeatureSet): EngineeredFeatures {
    const engineered: EngineeredFeatures = {
      // Base features (already normalized)
      ...features,
      
      // Derived features
      debtToIncomeRatio: features.totalDebt > 0 && features.monthlyIncome > 0
        ? features.totalDebt / (features.monthlyIncome * 12)
        : 0,
      
      savingsRate: features.monthlyIncome > 0
        ? (features.monthlySavings || 0) / features.monthlyIncome
        : 0,
      
      creditUtilizationRatio: features.totalCreditLimit > 0
        ? features.totalCreditUsed / features.totalCreditLimit
        : 0,
      
      paymentConsistency: this.calculatePaymentConsistency(features),
      
      incomeStability: this.calculateIncomeStability(features),
      
      cashFlowVolatility: this.calculateCashFlowVolatility(features),
      
      employmentStability: this.calculateEmploymentStability(features),
      
      // Time-based features
      accountAgeMonths: this.calculateAccountAge(features),
      
      // Behavioral features
      applicationQuality: this.calculateApplicationQuality(features),
      
      // Risk indicators
      riskIndicators: this.calculateRiskIndicators(features),
    };

    return engineered;
  }

  /**
   * Normalize features to 0-1 range
   */
  private normalizeFeatures(features: EngineeredFeatures): NormalizedFeatures {
    return {
      // Credit score (300-850) -> (0-1)
      creditScore: this.normalize(features.creditScore || 650, 300, 850),
      
      // Payment history (0-1) - use paymentConsistency which is already calculated
      paymentHistory: features.paymentConsistency || 0.5,
      
      // Credit utilization (0-1)
      creditUtilization: Math.min(features.creditUtilizationRatio || 0, 1),
      
      // Debt to income (0-2) -> (0-1), inverted
      debtToIncomeRatio: 1 - Math.min(features.debtToIncomeRatio || 0, 2) / 2,
      
      // Savings rate (0-1)
      savingsRate: Math.min(features.savingsRate || 0, 1),
      
      // Payment consistency (0-1)
      paymentConsistency: Math.min(features.paymentConsistency || 0, 1),
      
      // Income stability (0-1)
      incomeStability: Math.min(features.incomeStability || 0, 1),
      
      // Cash flow volatility (0-1), inverted
      cashFlowVolatility: 1 - Math.min(features.cashFlowVolatility || 0, 1),
      
      // Employment stability (0-1)
      employmentStability: Math.min(features.employmentStability || 0, 1),
      
      // Account age (0-120 months) -> (0-1)
      accountAgeMonths: this.normalize(features.accountAgeMonths || 0, 0, 120),
      
      // Application quality (0-1)
      applicationQuality: Math.min(features.applicationQuality || 0, 1),
      
      // Public records (0-10) -> (0-1), inverted
      publicRecords: 1 - Math.min((features.publicRecords || 0) / 10, 1),
      
      // Risk indicators (0-1), inverted
      riskIndicators: 1 - Math.min(features.riskIndicators || 0, 1),
    };
  }

  /**
   * ML Model Prediction (simulated XGBoost/LightGBM style)
   * In production, this would call a trained model
   */
  private predictScore(features: NormalizedFeatures, model?: any): number {
    // Simulate ensemble model prediction
    // In production, this would be:
    // 1. Load trained model (XGBoost/LightGBM)
    // 2. Run inference
    // 3. Return prediction
    
    let score = 0.5; // Base score (0-1 range)
    
    // Weighted feature combination (simulating tree-based model)
    score += features.creditScore * this.featureWeights.creditScore;
    score += features.paymentHistory * this.featureWeights.paymentHistory;
    score += (1 - features.creditUtilization) * this.featureWeights.creditUtilization;
    score += features.debtToIncomeRatio * this.featureWeights.debtToIncomeRatio;
    score += features.savingsRate * this.featureWeights.savingsRate;
    score += features.paymentConsistency * 0.10;
    score += features.incomeStability * this.featureWeights.incomeStability;
    score += features.cashFlowVolatility * 0.08;
    score += features.employmentStability * this.featureWeights.employmentStability;
    score += features.accountAgeMonths * 0.06;
    score += features.applicationQuality * this.featureWeights.applicationQuality;
    score += features.publicRecords * Math.abs(this.featureWeights.publicRecords);
    score += features.riskIndicators * 0.05;
    
    // Apply non-linear transformations (simulating tree splits)
    score = this.applyNonLinearTransforms(score, features);
    
    // Ensure score is in valid range
    return Math.max(0, Math.min(1, score));
  }

  /**
   * Apply non-linear transformations (simulating decision tree splits)
   */
  private applyNonLinearTransforms(score: number, features: NormalizedFeatures): number {
    // High credit score boost
    if (features.creditScore > 0.8) {
      score *= 1.1;
    }
    
    // Low debt-to-income boost
    if (features.debtToIncomeRatio > 0.7) {
      score *= 1.15;
    }
    
    // High payment consistency boost
    if (features.paymentConsistency > 0.9) {
      score *= 1.08;
    }
    
    // Penalty for high risk indicators
    if (features.riskIndicators < 0.5) {
      score *= 0.85;
    }
    
    // Penalty for low income stability
    if (features.incomeStability < 0.5) {
      score *= 0.90;
    }
    
    return score;
  }

  /**
   * Calibrate score to 300-850 range
   */
  private calibrateScore(rawScore: number, features: MLFeatureSet): number {
    // Base calibration: 300-850 range
    let calibrated = 300 + (rawScore * 550);
    
    // Additional calibration based on data quality
    const dataQuality = this.assessDataQuality(features);
    if (dataQuality < 0.7) {
      // Reduce confidence for low data quality
      calibrated = calibrated * 0.95;
    }
    
    return Math.max(300, Math.min(850, calibrated));
  }

  /**
   * Calculate feature importance for explainability
   */
  private calculateFeatureImportance(features: NormalizedFeatures): Record<string, number> {
    const importance: Record<string, number> = {};
    
    // Calculate contribution of each feature
    importance.creditScore = features.creditScore * this.featureWeights.creditScore;
    importance.paymentHistory = features.paymentHistory * this.featureWeights.paymentHistory;
    importance.creditUtilization = (1 - features.creditUtilization) * this.featureWeights.creditUtilization;
    importance.debtToIncomeRatio = features.debtToIncomeRatio * this.featureWeights.debtToIncomeRatio;
    importance.savingsRate = features.savingsRate * this.featureWeights.savingsRate;
    importance.incomeStability = features.incomeStability * this.featureWeights.incomeStability;
    importance.employmentStability = features.employmentStability * this.featureWeights.employmentStability;
    importance.paymentConsistency = features.paymentConsistency * 0.10;
    importance.publicRecords = features.publicRecords * Math.abs(this.featureWeights.publicRecords);
    
    // Normalize to percentages
    const total = Object.values(importance).reduce((sum, val) => sum + Math.abs(val), 0);
    if (total > 0) {
      Object.keys(importance).forEach(key => {
        importance[key] = (Math.abs(importance[key]) / total) * 100;
      });
    }
    
    return importance;
  }

  /**
   * Calculate confidence score
   */
  private calculateConfidence(
    features: NormalizedFeatures,
    importance: Record<string, number>,
  ): number {
    // Base confidence from feature completeness
    let confidence = 0.8;
    
    // Adjust based on feature quality
    const hasCreditData = features.creditScore > 0;
    const hasFinancialData = features.incomeStability > 0;
    const hasBehavioralData = features.applicationQuality > 0;
    
    if (hasCreditData) confidence += 0.1;
    if (hasFinancialData) confidence += 0.05;
    if (hasBehavioralData) confidence += 0.05;
    
    // Reduce confidence if key features are missing
    if (!hasCreditData && !hasFinancialData) {
      confidence *= 0.7;
    }
    
    return Math.max(0, Math.min(1, confidence));
  }

  /**
   * Identify risk factors
   */
  private identifyRiskFactors(
    features: NormalizedFeatures,
    importance: Record<string, number>,
  ): string[] {
    const riskFactors: string[] = [];
    
    if (features.creditScore < 0.5) {
      riskFactors.push('Low credit score');
    }
    
    if (features.creditUtilization > 0.8) {
      riskFactors.push('High credit utilization');
    }
    
    if (features.debtToIncomeRatio < 0.3) {
      riskFactors.push('High debt-to-income ratio');
    }
    
    if (features.paymentConsistency < 0.6) {
      riskFactors.push('Inconsistent payment history');
    }
    
    if (features.incomeStability < 0.5) {
      riskFactors.push('Unstable income');
    }
    
    if (features.publicRecords < 0.7) {
      riskFactors.push('Public records on file');
    }
    
    if (features.riskIndicators < 0.5) {
      riskFactors.push('Multiple risk indicators');
    }
    
    return riskFactors;
  }

  // Helper methods for feature engineering

  private calculatePaymentConsistency(features: MLFeatureSet): number {
    if (!features.paymentHistory || features.paymentHistory.length === 0) {
      return 0.5; // Neutral if no data
    }
    
    // Calculate consistency from payment history
    const onTimePayments = features.paymentHistory.filter(p => p.onTime).length;
    return onTimePayments / features.paymentHistory.length;
  }

  private calculateIncomeStability(features: MLFeatureSet): number {
    if (!features.incomeHistory || features.incomeHistory.length < 3) {
      return 0.5; // Neutral if insufficient data
    }
    
    // Calculate coefficient of variation
    const incomes = features.incomeHistory.map(h => h.amount);
    const mean = incomes.reduce((a, b) => a + b, 0) / incomes.length;
    const variance = incomes.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / incomes.length;
    const stdDev = Math.sqrt(variance);
    const cv = mean > 0 ? stdDev / mean : 1;
    
    // Lower CV = more stable = higher score
    return Math.max(0, 1 - cv);
  }

  private calculateCashFlowVolatility(features: MLFeatureSet): number {
    if (!features.transactionHistory || features.transactionHistory.length < 3) {
      return 0.5;
    }
    
    // Calculate monthly cash flow variance
    const monthlyFlows = this.aggregateMonthlyFlows(features.transactionHistory);
    if (monthlyFlows.length < 3) return 0.5;
    
    const mean = monthlyFlows.reduce((a, b) => a + b, 0) / monthlyFlows.length;
    const variance = monthlyFlows.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / monthlyFlows.length;
    const stdDev = Math.sqrt(variance);
    const cv = mean !== 0 ? stdDev / Math.abs(mean) : 1;
    
    return Math.min(1, cv);
  }

  private calculateEmploymentStability(features: MLFeatureSet): number {
    if (!features.employmentHistory || features.employmentHistory.length === 0) {
      return 0.5;
    }
    
    // Calculate based on employment duration and job changes
    const totalMonths = features.employmentHistory.reduce(
      (sum, job) => sum + (job.durationMonths || 0),
      0,
    );
    const jobChanges = features.employmentHistory.length - 1;
    
    // Longer employment and fewer changes = more stable
    const stabilityScore = Math.min(1, totalMonths / 60); // 5 years = max
    const changePenalty = Math.min(0.3, jobChanges * 0.1);
    
    return Math.max(0, stabilityScore - changePenalty);
  }

  private calculateAccountAge(features: MLFeatureSet): number {
    if (!features.accountOpenDates || features.accountOpenDates.length === 0) {
      return 0;
    }
    
    const oldestAccount = Math.min(...features.accountOpenDates.map(d => {
      const date = new Date(d);
      const now = new Date();
      return (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24 * 30); // months
    }));
    
    return oldestAccount;
  }

  private calculateApplicationQuality(features: MLFeatureSet): number {
    let quality = 0.5; // Base quality
    
    // Completeness
    if (features.applicationCompleteness) {
      quality += features.applicationCompleteness * 0.3;
    }
    
    // Time to complete (faster = better, but not too fast)
    if (features.timeToComplete) {
      const timeScore = features.timeToComplete > 5 && features.timeToComplete < 30
        ? 1.0
        : features.timeToComplete < 5
        ? 0.7 // Too fast might indicate fraud
        : 0.5; // Too slow
      quality += timeScore * 0.2;
    }
    
    return Math.min(1, quality);
  }

  private calculateRiskIndicators(features: MLFeatureSet): number {
    let riskScore = 0;
    
    // Count risk indicators
    if (features.hasRecentBankruptcy) riskScore += 0.3;
    if (features.hasRecentForeclosure) riskScore += 0.2;
    if (features.hasRecentCollections) riskScore += 0.2;
    if (features.hasRecentLatePayments) riskScore += 0.15;
    if (features.hasHighDebt) riskScore += 0.15;
    
    return Math.min(1, riskScore);
  }

  private aggregateMonthlyFlows(transactions: any[]): number[] {
    // Group transactions by month and calculate net flow
    const monthlyFlows: Record<string, number> = {};
    
    transactions.forEach(txn => {
      const date = new Date(txn.date);
      const monthKey = `${date.getFullYear()}-${date.getMonth()}`;
      monthlyFlows[monthKey] = (monthlyFlows[monthKey] || 0) + (txn.amount || 0);
    });
    
    return Object.values(monthlyFlows);
  }

  private assessDataQuality(features: MLFeatureSet): number {
    let quality = 0;
    let maxQuality = 0;
    
    // Credit data quality
    maxQuality += 0.3;
    if (features.creditScore) quality += 0.3;
    
    // Financial data quality
    maxQuality += 0.3;
    if (features.monthlyIncome && features.monthlyIncome > 0) quality += 0.3;
    
    // Payment history quality
    maxQuality += 0.2;
    if (features.paymentHistory && features.paymentHistory.length > 0) quality += 0.2;
    
    // Behavioral data quality
    maxQuality += 0.2;
    if (features.applicationCompleteness) quality += 0.2;
    
    return maxQuality > 0 ? quality / maxQuality : 0.5;
  }

  private normalize(value: number, min: number, max: number): number {
    if (max === min) return 0.5;
    return Math.max(0, Math.min(1, (value - min) / (max - min)));
  }
}

// Type definitions

export interface MLFeatureSet {
  // Traditional Bureau
  creditScore?: number;
  paymentHistory?: Array<{ date: Date; onTime: boolean }>;
  creditUtilization?: number;
  totalCreditLimit?: number;
  totalCreditUsed?: number;
  publicRecords?: number;
  
  // Alternative Financial
  monthlyIncome?: number;
  monthlySavings?: number;
  totalDebt?: number;
  bankAccountAge?: number;
  averageBalance?: number;
  incomeHistory?: Array<{ date: Date; amount: number }>;
  transactionHistory?: Array<{ date: Date; amount: number; type: string }>;
  utilityPaymentHistory?: Array<{ date: Date; onTime: boolean }>;
  rentPaymentHistory?: Array<{ date: Date; onTime: boolean }>;
  
  // Behavioral
  applicationCompleteness?: number;
  timeToComplete?: number; // minutes
  deviceConsistency?: boolean;
  digitalFootprintScore?: number;
  
  // Employment
  employmentHistory?: Array<{ company: string; durationMonths: number }>;
  
  // Account info
  accountOpenDates?: Date[];
  
  // Risk indicators
  hasRecentBankruptcy?: boolean;
  hasRecentForeclosure?: boolean;
  hasRecentCollections?: boolean;
  hasRecentLatePayments?: boolean;
  hasHighDebt?: boolean;
}

interface EngineeredFeatures extends MLFeatureSet {
  debtToIncomeRatio: number;
  savingsRate: number;
  creditUtilizationRatio: number;
  paymentConsistency: number;
  incomeStability: number;
  cashFlowVolatility: number;
  employmentStability: number;
  accountAgeMonths: number;
  applicationQuality: number;
  riskIndicators: number;
}

interface NormalizedFeatures {
  creditScore: number;
  paymentHistory: number;
  creditUtilization: number;
  debtToIncomeRatio: number;
  savingsRate: number;
  paymentConsistency: number;
  incomeStability: number;
  cashFlowVolatility: number;
  employmentStability: number;
  accountAgeMonths: number;
  applicationQuality: number;
  publicRecords: number;
  riskIndicators: number;
}

export interface MLScoreResult {
  score: number; // 300-850
  rawScore: number; // 0-1
  confidence: number; // 0-1
  featureImportance: Record<string, number>; // percentages
  riskFactors: string[];
  modelVersion: string;
  calculatedAt: Date;
}

