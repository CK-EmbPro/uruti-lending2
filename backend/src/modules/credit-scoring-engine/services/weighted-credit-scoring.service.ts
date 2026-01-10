import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreditBureauService } from '../../credit-bureau/services/credit-bureau.service';
import { AlternativeCreditScoringService } from '../../alternative-credit-scoring/services/alternative-credit-scoring.service';
import { MLScoringService, MLFeatureSet } from './ml-scoring.service';
import { ScoringHistoryService } from './scoring-history.service';
import { RiskTierService } from './risk-tier.service';
import { ScoringCacheService } from './scoring-cache.service';
import { PerformanceMonitorService } from './performance-monitor.service';
import { ExplainabilityService } from './explainability.service';
import { ScoringTrigger } from '../entities/credit-score-history.entity';
import { RiskTier } from '../entities/risk-tier-config.entity';
// Note: AI services removed to break circular dependency - can be added back when needed

/**
 * Weighted Credit Scoring Service
 * 
 * Implements a three-tier scoring model:
 * - Traditional Bureau Data (30% weight)
 * - Alternative Financial Data (40% weight) - AI-powered
 * - Behavioral & Digital Data (30% weight)
 */
@Injectable()
export class WeightedCreditScoringService {
  private readonly logger = new Logger(WeightedCreditScoringService.name);

  // Scoring weights - Default (SME)
  private readonly DEFAULT_WEIGHTS = {
    TRADITIONAL_BUREAU: 0.30,
    ALTERNATIVE_FINANCIAL: 0.40,
    BEHAVIORAL_DIGITAL: 0.30,
  };

  // Segment-specific weights
  private readonly SEGMENT_WEIGHTS = {
    MICRO: {
      TRADITIONAL_BUREAU: 0.20,      // Lower weight on traditional (thin file)
      ALTERNATIVE_FINANCIAL: 0.50,   // Higher weight on alternative (cash flow)
      BEHAVIORAL_DIGITAL: 0.30,      // Standard weight on behavioral
    },
    SME: {
      TRADITIONAL_BUREAU: 0.30,      // Balanced approach
      ALTERNATIVE_FINANCIAL: 0.40,   // Strong alternative data
      BEHAVIORAL_DIGITAL: 0.30,      // Standard weight
    },
    ENTERPRISE: {
      TRADITIONAL_BUREAU: 0.40,      // Higher weight on traditional (established credit)
      ALTERNATIVE_FINANCIAL: 0.30,   // Lower weight on alternative
      BEHAVIORAL_DIGITAL: 0.30,      // Standard weight
    },
  };

  constructor(
    private readonly creditBureauService: CreditBureauService,
    private readonly alternativeScoringService: AlternativeCreditScoringService,
    private readonly mlScoringService: MLScoringService,
    private readonly scoringHistoryService: ScoringHistoryService,
    private readonly riskTierService: RiskTierService,
    private readonly scoringCacheService: ScoringCacheService,
    private readonly performanceMonitorService: PerformanceMonitorService,
    private readonly explainabilityService: ExplainabilityService,
  ) {
    // AI services removed to break circular dependency - can be added back when needed
  }

  /**
   * Calculate comprehensive credit score using weighted model
   * Optionally uses ML-enhanced scoring when ML features are available
   */
  async calculateWeightedScore(
    request: WeightedScoringRequest,
    companyId: string,
    useML: boolean = true,
    segment?: 'MICRO' | 'SME' | 'ENTERPRISE',
    trigger?: ScoringTrigger,
    triggerDetails?: Record<string, any>,
  ): Promise<WeightedScoringResult> {
    const scoringSegment = segment || this.determineSegmentFromRequest(request) || 'SME';
    const weights = this.SEGMENT_WEIGHTS[scoringSegment] || this.DEFAULT_WEIGHTS;
    
    this.logger.log(`Calculating weighted credit score for applicant ${request.applicantId} (ML: ${useML}, Segment: ${scoringSegment})`);

    const startTime = Date.now();
    const endpoint = 'calculate-weighted-score';

    // Collect all data sources in parallel
    const [
      traditionalScore,
      alternativeScore,
      behavioralScore,
    ] = await Promise.all([
      this.calculateTraditionalBureauScore(request, companyId),
      this.calculateAlternativeFinancialScore(request, companyId),
      this.calculateBehavioralDigitalScore(request, companyId),
    ]);

    // Optionally enhance with ML scoring
    let mlScoreResult = null;
    if (useML && this.hasMLFeatures(request)) {
      try {
        const mlFeatures = this.extractMLFeatures(request, traditionalScore, alternativeScore, behavioralScore);
        // Pass applicantId for A/B testing
        mlScoreResult = await this.mlScoringService.calculateMLScore(mlFeatures, request.applicantId);
        this.logger.debug(`ML score calculated: ${mlScoreResult.score} (confidence: ${mlScoreResult.confidence}, model: ${mlScoreResult.modelVersion})`);
      } catch (error) {
        this.logger.warn(`ML scoring failed, falling back to rule-based: ${error.message}`);
      }
    }

    // Calculate weighted final score (use ML if available, otherwise rule-based)
    let finalScore: number;
    if (mlScoreResult && mlScoreResult.confidence > 0.7) {
      // Blend ML score with rule-based score (70% ML, 30% rule-based)
      const ruleBasedScore = this.calculateWeightedFinalScore({
        traditional: traditionalScore,
        alternative: alternativeScore,
        behavioral: behavioralScore,
      }, weights);
      finalScore = mlScoreResult.score * 0.7 + ruleBasedScore * 0.3;
      this.logger.debug(`Using ML-enhanced score: ${finalScore} (ML: ${mlScoreResult.score}, Rule-based: ${ruleBasedScore}, Segment: ${scoringSegment})`);
    } else {
      // Use segment-specific weighted score
      finalScore = this.calculateWeightedFinalScore({
        traditional: traditionalScore,
        alternative: alternativeScore,
        behavioral: behavioralScore,
      }, weights);
      this.logger.debug(`Using segment-weighted score: ${finalScore} (Segment: ${scoringSegment}, Weights: ${JSON.stringify(weights)})`);
    }

    const processingTime = Date.now() - startTime;

    // Assign risk tier first (needed for explanation)
    const riskTier = await this.assignRiskTier(finalScore, companyId);

    // Calculate feature importance and SHAP values for explainability
    let shapValues: Record<string, number> = {};
    let limeExplanation = '';
    let enhancedExplanation = '';

    if (mlScoreResult && mlScoreResult.featureImportance) {
      // Calculate SHAP values
      const baselineScore = 650; // Baseline credit score
      shapValues = this.explainabilityService.calculateSHAPValues(
        mlScoreResult.featureImportance,
        mlScoreResult.featureImportance, // Using feature importance as weights
        baselineScore,
      );

      // Calculate LIME explanation
      const limeResult = this.explainabilityService.calculateLIME(
        mlScoreResult.featureImportance,
        mlScoreResult.featureImportance,
        finalScore,
      );
      limeExplanation = limeResult.explanation;

      // Get comprehensive compliance explanation
      const complianceExplanation = this.explainabilityService.getComplianceExplanation(
        finalScore,
        mlScoreResult.featureImportance,
        shapValues,
        limeExplanation,
        mlScoreResult.riskFactors || [],
      );
      enhancedExplanation = complianceExplanation.explanation;
    }

    // Generate comprehensive explanation
    const explanation = this.generateExplanation({
      traditional: traditionalScore,
      alternative: alternativeScore,
      behavioral: behavioralScore,
      finalScore,
      mlScore: mlScoreResult,
      riskTier, // Include tier in result for explanation
    });

    const result: WeightedScoringResult = {
      finalScore: Math.round(finalScore),
      scoreBreakdown: {
        traditional: traditionalScore,
        alternative: alternativeScore,
        behavioral: behavioralScore,
      },
      weights,
      segment: scoringSegment,
      explanation: enhancedExplanation || explanation,
      confidence: mlScoreResult 
        ? Math.max(mlScoreResult.confidence, this.calculateConfidence({
            traditional: traditionalScore,
            alternative: alternativeScore,
            behavioral: behavioralScore,
          }, weights))
        : this.calculateConfidence({
            traditional: traditionalScore,
            alternative: alternativeScore,
            behavioral: behavioralScore,
          }, weights),
      riskTier,
      processingTimeMs: processingTime,
      calculatedAt: new Date(),
      mlScore: mlScoreResult ? {
        score: mlScoreResult.score,
        confidence: mlScoreResult.confidence,
        featureImportance: mlScoreResult.featureImportance,
        riskFactors: mlScoreResult.riskFactors,
        modelVersion: mlScoreResult.modelVersion,
        ...(Object.keys(shapValues).length > 0 && { shapValues }),
      } : null,
    };

    // Cache the result
    await this.scoringCacheService.cacheScoreResult(request.applicantId, companyId, result);

    // Record performance metrics
    await this.performanceMonitorService.recordLatency(endpoint, processingTime, true, companyId);

    // Log performance warning if exceeds SLA
    if (processingTime > 2000) {
      this.logger.warn(`Scoring latency (${processingTime}ms) exceeds SLA (2000ms) for applicant ${request.applicantId}`);
    }

    // Save to history if trigger is provided
    if (trigger) {
      try {
        await this.scoringHistoryService.saveHistory(
          result,
          request.applicantId,
          trigger,
          {
            applicationId: request.applicationId,
            companyId,
            segment: scoringSegment,
            triggerMetadata: triggerDetails,
          },
        );
      } catch (error) {
        // Log error but don't fail the scoring
        this.logger.error(`Failed to save scoring history: ${error.message}`);
      }
    }

    return result;
  }

  /**
   * Check if request has sufficient data for ML scoring
   */
  private hasMLFeatures(request: WeightedScoringRequest): boolean {
    return !!(
      request.creditBureauData ||
      request.bankAccountData ||
      request.utilityTelecomData ||
      request.rentPaymentData ||
      request.behavioralData ||
      request.transactionalData
    );
  }

  /**
   * Extract ML features from request and scores
   */
  private extractMLFeatures(
    request: WeightedScoringRequest,
    traditionalScore: any,
    alternativeScore: any,
    behavioralScore: any,
  ): MLFeatureSet {
    const features: MLFeatureSet = {};

    // Traditional Bureau Features
    if (request.creditBureauData) {
      features.creditScore = request.creditBureauData.creditScore || traditionalScore?.score;
      features.paymentHistory = this.extractPaymentHistory(request.creditBureauData);
      features.totalCreditLimit = request.creditBureauData.totalCreditLimit;
      features.totalCreditUsed = request.creditBureauData.totalCreditUsed;
      features.publicRecords = request.creditBureauData.publicRecords?.length || 0;
    }

    // Alternative Financial Features
    if (request.bankAccountData) {
      features.monthlyIncome = request.bankAccountData.averageMonthlyIncome;
      features.monthlySavings = request.bankAccountData.averageMonthlySavings;
      features.totalDebt = request.bankAccountData.totalDebt;
      features.averageBalance = request.bankAccountData.averageBalance;
      features.incomeHistory = request.bankAccountData.incomeHistory;
      features.transactionHistory = request.bankAccountData.transactions;
      features.accountOpenDates = request.bankAccountData.accountOpenDates?.map(d => new Date(d));
    }

    if (request.utilityTelecomData) {
      features.utilityPaymentHistory = request.utilityTelecomData.payments?.map(p => ({
        date: new Date(p.date),
        onTime: p.onTime,
      }));
    }

    if (request.rentPaymentData) {
      features.rentPaymentHistory = request.rentPaymentData.payments?.map(p => ({
        date: new Date(p.date),
        onTime: p.onTime,
      }));
    }

    // Behavioral Features
    if (request.behavioralData) {
      features.applicationCompleteness = request.behavioralData.completionRate;
      features.timeToComplete = request.behavioralData.timeToComplete;
      features.deviceConsistency = request.behavioralData.deviceConsistency;
    }

    if (request.digitalFootprintData) {
      features.digitalFootprintScore = request.digitalFootprintData.profileScore;
    }

    // Transactional Features
    if (request.transactionalData) {
      features.transactionHistory = request.transactionalData.transactions?.map(t => ({
        date: new Date(t.date),
        amount: t.amount,
        type: t.type,
      }));
    }

    // Risk Indicators
    features.hasRecentBankruptcy = request.creditBureauData?.bankruptcies?.some(
      b => new Date(b.date).getTime() > Date.now() - 7 * 365 * 24 * 60 * 60 * 1000
    );
    features.hasRecentForeclosure = request.creditBureauData?.foreclosures?.some(
      f => new Date(f.date).getTime() > Date.now() - 7 * 365 * 24 * 60 * 60 * 1000
    );
    features.hasRecentCollections = request.creditBureauData?.collections?.some(
      c => new Date(c.date).getTime() > Date.now() - 2 * 365 * 24 * 60 * 60 * 1000
    );
    features.hasRecentLatePayments = features.paymentHistory?.some(
      p => !p.onTime && new Date(p.date).getTime() > Date.now() - 365 * 24 * 60 * 60 * 1000
    );
    features.hasHighDebt = features.totalDebt && features.monthlyIncome
      ? features.totalDebt / (features.monthlyIncome * 12) > 0.4
      : false;

    return features;
  }

  /**
   * Extract payment history from credit bureau data
   */
  private extractPaymentHistory(creditBureauData: any): Array<{ date: Date; onTime: boolean }> {
    if (!creditBureauData?.paymentHistory) return [];
    
    return creditBureauData.paymentHistory.map((p: any) => ({
      date: new Date(p.date),
      onTime: p.status === 'ON_TIME' || p.status === 'CURRENT',
    }));
  }

  /**
   * Traditional Bureau Data (30% weight)
   */
  private async calculateTraditionalBureauScore(
    request: WeightedScoringRequest,
    companyId: string,
  ): Promise<TraditionalBureauScore> {
    this.logger.debug('Calculating traditional bureau score');

    let creditReport = null;
    let paymentHistoryScore = 0;
    let creditUtilizationScore = 0;
    let publicRecordsScore = 0;

    try {
      // Pull credit report from bureau
      if (request.creditBureauData) {
        creditReport = request.creditBureauData;
      } else if (request.applicantId) {
        // Try to get latest credit report
        creditReport = await this.creditBureauService.getLatestCreditReport(
          request.applicantId,
          companyId,
        );
      }

      if (creditReport) {
        // Payment History Score (0-100)
        paymentHistoryScore = this.calculatePaymentHistoryScore(creditReport);

        // Credit Utilization Score (0-100)
        creditUtilizationScore = this.calculateCreditUtilizationScore(creditReport);

        // Public Records Score (0-100)
        publicRecordsScore = this.calculatePublicRecordsScore(creditReport);
      } else {
        // No credit report available - use neutral scores
        paymentHistoryScore = 50;
        creditUtilizationScore = 50;
        publicRecordsScore = 50;
      }
    } catch (error) {
      this.logger.warn(`Error calculating traditional bureau score: ${error.message}`);
      // Use neutral scores on error
      paymentHistoryScore = 50;
      creditUtilizationScore = 50;
      publicRecordsScore = 50;
    }

    // Calculate composite traditional score (0-100)
    const compositeScore = (
      paymentHistoryScore * 0.50 + // 50% weight within traditional
      creditUtilizationScore * 0.30 + // 30% weight
      publicRecordsScore * 0.20 // 20% weight
    );

    // Normalize to 300-850 scale
    const normalizedScore = 300 + (compositeScore / 100) * 550;

    return {
      score: Math.round(normalizedScore),
      breakdown: {
        paymentHistory: paymentHistoryScore,
        creditUtilization: creditUtilizationScore,
        publicRecords: publicRecordsScore,
      },
      creditReport: creditReport ? {
        creditScore: creditReport.creditScore || 0,
        provider: creditReport.provider,
      } : null,
      confidence: creditReport ? 0.9 : 0.3, // High confidence if report available
    };
  }

  /**
   * Alternative Financial Data (40% weight) - AI-powered
   */
  private async calculateAlternativeFinancialScore(
    request: WeightedScoringRequest,
    companyId: string,
  ): Promise<AlternativeFinancialScore> {
    this.logger.debug('Calculating alternative financial score (AI-powered)');

    const [
      bankAccountScore,
      utilityTelecomScore,
      rentPaymentScore,
    ] = await Promise.all([
      this.calculateBankAccountScore(request),
      this.calculateUtilityTelecomScore(request),
      this.calculateRentPaymentScore(request),
    ]);

    // Calculate composite alternative score
    const compositeScore = (
      bankAccountScore.score * 0.50 + // 50% weight within alternative
      utilityTelecomScore.score * 0.30 + // 30% weight
      rentPaymentScore.score * 0.20 // 20% weight
    );

    // Normalize to 300-850 scale
    const normalizedScore = 300 + (compositeScore / 100) * 550;

    return {
      score: Math.round(normalizedScore),
      breakdown: {
        bankAccount: bankAccountScore,
        utilityTelecom: utilityTelecomScore,
        rentPayment: rentPaymentScore,
      },
      confidence: this.calculateAlternativeConfidence({
        bankAccount: bankAccountScore,
        utilityTelecom: utilityTelecomScore,
        rentPayment: rentPaymentScore,
      }),
    };
  }

  /**
   * Bank Account Analysis - AI-powered
   */
  private async calculateBankAccountScore(
    request: WeightedScoringRequest,
  ): Promise<BankAccountScore> {
    if (!request.bankAccountData) {
      return {
        score: 50,
        confidence: 0.1,
        aiInsights: {
          cashFlowPatterns: null,
          incomeStability: null,
          spendingBehavior: null,
        },
      };
    }

    // AI-powered cash flow pattern detection
    const cashFlowPatterns = await this.detectCashFlowPatterns(request.bankAccountData);

    // AI-powered income stability prediction (time-series)
    const incomeStability = await this.predictIncomeStability(request.bankAccountData);

    // AI-powered spending behavior categorization (NLP)
    const spendingBehavior = await this.categorizeSpendingBehavior(request.bankAccountData);

    // Calculate score based on AI insights
    let score = 50; // Base score

    // Cash flow patterns (0-30 points)
    if (cashFlowPatterns.stability > 0.8) score += 30;
    else if (cashFlowPatterns.stability > 0.6) score += 20;
    else if (cashFlowPatterns.stability > 0.4) score += 10;
    else if (cashFlowPatterns.stability < 0.2) score -= 20;

    // Income stability (0-30 points)
    if (incomeStability.score > 0.8) score += 30;
    else if (incomeStability.score > 0.6) score += 20;
    else if (incomeStability.score > 0.4) score += 10;
    else if (incomeStability.score < 0.2) score -= 20;

    // Spending behavior (0-20 points)
    if (spendingBehavior.riskLevel === 'LOW') score += 20;
    else if (spendingBehavior.riskLevel === 'MEDIUM') score += 10;
    else if (spendingBehavior.riskLevel === 'HIGH') score -= 20;

    // Savings rate bonus (0-20 points)
    if (cashFlowPatterns.savingsRate > 0.2) score += 20;
    else if (cashFlowPatterns.savingsRate > 0.1) score += 10;
    else if (cashFlowPatterns.savingsRate < 0) score -= 10;

    return {
      score: Math.max(0, Math.min(100, score)),
      confidence: 0.8,
      aiInsights: {
        cashFlowPatterns,
        incomeStability,
        spendingBehavior,
      },
    };
  }

  /**
   * Utility & Telecom Payments - AI pattern matching
   */
  private async calculateUtilityTelecomScore(
    request: WeightedScoringRequest,
  ): Promise<UtilityTelecomScore> {
    if (!request.utilityTelecomData) {
      return {
        score: 50,
        confidence: 0.1,
        aiInsights: {
          paymentConsistency: null,
          accountLongevity: null,
        },
      };
    }

    // AI pattern matching for payment consistency
    const paymentConsistency = await this.analyzePaymentConsistency(
      request.utilityTelecomData,
    );

    // Account longevity analysis
    const accountLongevity = this.analyzeAccountLongevity(request.utilityTelecomData);

    let score = 50; // Base score

    // Payment consistency (0-50 points)
    if (paymentConsistency.consistencyScore > 0.95) score += 50;
    else if (paymentConsistency.consistencyScore > 0.90) score += 40;
    else if (paymentConsistency.consistencyScore > 0.85) score += 30;
    else if (paymentConsistency.consistencyScore > 0.80) score += 20;
    else if (paymentConsistency.consistencyScore < 0.70) score -= 30;

    // Account longevity (0-30 points)
    if (accountLongevity.months > 24) score += 30;
    else if (accountLongevity.months > 12) score += 20;
    else if (accountLongevity.months > 6) score += 10;
    else if (accountLongevity.months < 3) score -= 10;

    // Late payment penalty
    if (paymentConsistency.latePayments > 0) {
      score -= Math.min(20, paymentConsistency.latePayments * 5);
    }

    return {
      score: Math.max(0, Math.min(100, score)),
      confidence: 0.75,
      aiInsights: {
        paymentConsistency,
        accountLongevity,
      },
    };
  }

  /**
   * Rent Payment History
   */
  private async calculateRentPaymentScore(
    request: WeightedScoringRequest,
  ): Promise<RentPaymentScore> {
    if (!request.rentPaymentData) {
      return {
        score: 50,
        confidence: 0.1,
        aiInsights: {
          timelinessAnalysis: null,
          paymentSourceVerification: null,
        },
      };
    }

    // Timeliness analysis
    const timelinessAnalysis = this.analyzeRentTimeliness(request.rentPaymentData);

    // Payment source verification
    const paymentSourceVerification = await this.verifyPaymentSource(
      request.rentPaymentData,
    );

    let score = 50; // Base score

    // Timeliness (0-50 points)
    if (timelinessAnalysis.onTimeRate > 0.95) score += 50;
    else if (timelinessAnalysis.onTimeRate > 0.90) score += 40;
    else if (timelinessAnalysis.onTimeRate > 0.85) score += 30;
    else if (timelinessAnalysis.onTimeRate > 0.80) score += 20;
    else if (timelinessAnalysis.onTimeRate < 0.70) score -= 30;

    // Payment source verification (0-30 points)
    if (paymentSourceVerification.verified) score += 30;
    else if (paymentSourceVerification.partial) score += 15;

    // Missed payments penalty
    if (timelinessAnalysis.missedPayments > 0) {
      score -= Math.min(30, timelinessAnalysis.missedPayments * 10);
    }

    return {
      score: Math.max(0, Math.min(100, score)),
      confidence: 0.7,
      aiInsights: {
        timelinessAnalysis,
        paymentSourceVerification,
      },
    };
  }

  /**
   * Behavioral & Digital Data (30% weight)
   */
  private async calculateBehavioralDigitalScore(
    request: WeightedScoringRequest,
    companyId: string,
  ): Promise<BehavioralDigitalScore> {
    this.logger.debug('Calculating behavioral & digital score');

    const [
      deviceBiometricsScore,
      digitalFootprintScore,
      transactionalIntelligenceScore,
    ] = await Promise.all([
      this.calculateDeviceBiometricsScore(request),
      this.calculateDigitalFootprintScore(request),
      this.calculateTransactionalIntelligenceScore(request),
    ]);

    // Calculate composite behavioral score
    const compositeScore = (
      deviceBiometricsScore.score * 0.40 + // 40% weight within behavioral
      digitalFootprintScore.score * 0.35 + // 35% weight
      transactionalIntelligenceScore.score * 0.25 // 25% weight
    );

    // Normalize to 300-850 scale
    const normalizedScore = 300 + (compositeScore / 100) * 550;

    return {
      score: Math.round(normalizedScore),
      breakdown: {
        deviceBiometrics: deviceBiometricsScore,
        digitalFootprint: digitalFootprintScore,
        transactionalIntelligence: transactionalIntelligenceScore,
      },
      confidence: this.calculateBehavioralConfidence({
        deviceBiometrics: deviceBiometricsScore,
        digitalFootprint: digitalFootprintScore,
        transactionalIntelligence: transactionalIntelligenceScore,
      }),
    };
  }

  /**
   * Device & Behavioral Biometrics
   */
  private async calculateDeviceBiometricsScore(
    request: WeightedScoringRequest,
  ): Promise<DeviceBiometricsScore> {
    if (!request.behavioralData) {
      return {
        score: 50,
        confidence: 0.1,
        insights: {
          applicationCompletion: null,
          typingPatterns: null,
          formFillingBehavior: null,
        },
      };
    }

    const behavioral = request.behavioralData;

    // Application completion patterns
    const applicationCompletion = this.analyzeApplicationCompletion(behavioral);

    // Typing speed and patterns
    const typingPatterns = this.analyzeTypingPatterns(behavioral);

    // Form filling behavior
    const formFillingBehavior = this.analyzeFormFillingBehavior(behavioral);

    let score = 50; // Base score

    // Application completion (0-30 points)
    if (applicationCompletion.completionRate === 1.0) score += 30;
    else if (applicationCompletion.completionRate > 0.9) score += 20;
    else if (applicationCompletion.completionRate > 0.8) score += 10;
    else if (applicationCompletion.completionRate < 0.6) score -= 20;

    // Typing patterns (0-25 points) - consistent patterns = lower risk
    if (typingPatterns.consistency > 0.8 && typingPatterns.speed > 0.5) score += 25;
    else if (typingPatterns.consistency > 0.6) score += 15;
    else if (typingPatterns.consistency < 0.4) score -= 15; // Inconsistent = potential fraud

    // Form filling behavior (0-25 points)
    if (formFillingBehavior.authentic) score += 25;
    else if (formFillingBehavior.suspicious) score -= 20;

    // Time spent (0-20 points) - reasonable time = authentic
    if (formFillingBehavior.timeSpent > 300 && formFillingBehavior.timeSpent < 1800) {
      score += 20;
    } else if (formFillingBehavior.timeSpent < 60) {
      score -= 15; // Too fast = potential bot
    }

    return {
      score: Math.max(0, Math.min(100, score)),
      confidence: 0.6,
      insights: {
        applicationCompletion,
        typingPatterns,
        formFillingBehavior,
      },
    };
  }

  /**
   * Digital Footprint (with consent)
   */
  private async calculateDigitalFootprintScore(
    request: WeightedScoringRequest,
  ): Promise<DigitalFootprintScore> {
    if (!request.digitalFootprintData || !request.digitalFootprintData.consent) {
      return {
        score: 50,
        confidence: 0.1,
        insights: {
          professionalProfile: null,
          onlinePresence: null,
          educationalVerification: null,
        },
      };
    }

    const footprint = request.digitalFootprintData;

    // Professional profile strength
    const professionalProfile = this.analyzeProfessionalProfile(footprint);

    // Online presence stability
    const onlinePresence = this.analyzeOnlinePresence(footprint);

    // Educational verification
    const educationalVerification = await this.verifyEducation(footprint);

    let score = 50; // Base score

    // Professional profile (0-35 points)
    if (professionalProfile.strength > 0.8) score += 35;
    else if (professionalProfile.strength > 0.6) score += 25;
    else if (professionalProfile.strength > 0.4) score += 15;
    else if (professionalProfile.strength < 0.2) score -= 15;

    // Online presence stability (0-30 points)
    if (onlinePresence.stability > 0.8) score += 30;
    else if (onlinePresence.stability > 0.6) score += 20;
    else if (onlinePresence.stability < 0.3) score -= 10;

    // Educational verification (0-25 points)
    if (educationalVerification.verified) score += 25;
    else if (educationalVerification.partial) score += 12;

    return {
      score: Math.max(0, Math.min(100, score)),
      confidence: 0.65,
      insights: {
        professionalProfile,
        onlinePresence,
        educationalVerification,
      },
    };
  }

  /**
   * Transactional Intelligence
   */
  private async calculateTransactionalIntelligenceScore(
    request: WeightedScoringRequest,
  ): Promise<TransactionalIntelligenceScore> {
    if (!request.transactionalData) {
      return {
        score: 50,
        confidence: 0.1,
        insights: {
          merchantCategoryPatterns: null,
          timeOfDaySpending: null,
          geographicConsistency: null,
        },
      };
    }

    // Merchant category patterns
    const merchantCategoryPatterns = this.analyzeMerchantCategories(
      request.transactionalData,
    );

    // Time-of-day spending
    const timeOfDaySpending = this.analyzeTimeOfDaySpending(request.transactionalData);

    // Geographic consistency
    const geographicConsistency = this.analyzeGeographicConsistency(
      request.transactionalData,
    );

    let score = 50; // Base score

    // Merchant category patterns (0-30 points)
    if (merchantCategoryPatterns.riskLevel === 'LOW') score += 30;
    else if (merchantCategoryPatterns.riskLevel === 'MEDIUM') score += 15;
    else if (merchantCategoryPatterns.riskLevel === 'HIGH') score -= 20;

    // Time-of-day spending (0-25 points) - consistent patterns = lower risk
    if (timeOfDaySpending.consistency > 0.7) score += 25;
    else if (timeOfDaySpending.consistency > 0.5) score += 15;
    else if (timeOfDaySpending.consistency < 0.3) score -= 15;

    // Geographic consistency (0-25 points)
    if (geographicConsistency.consistency > 0.8) score += 25;
    else if (geographicConsistency.consistency > 0.6) score += 15;
    else if (geographicConsistency.consistency < 0.4) score -= 20; // Unusual locations = risk

    return {
      score: Math.max(0, Math.min(100, score)),
      confidence: 0.7,
      insights: {
        merchantCategoryPatterns,
        timeOfDaySpending,
        geographicConsistency,
      },
    };
  }

  // ==================== AI-Powered Analysis Methods ====================

  /**
   * AI: Detect cash flow patterns
   */
  private async detectCashFlowPatterns(
    bankData: any,
  ): Promise<CashFlowPatterns> {
    // TODO: Integrate with ML model for pattern detection
    // For now, use rule-based analysis
    
    const transactions = bankData.transactions || [];
    const monthlyIncomes: number[] = [];
    const monthlyExpenses: number[] = [];

    // Group by month
    const monthlyData = new Map<string, { income: number; expense: number }>();

    transactions.forEach((tx: any) => {
      const month = new Date(tx.date).toISOString().substring(0, 7);
      if (!monthlyData.has(month)) {
        monthlyData.set(month, { income: 0, expense: 0 });
      }
      const data = monthlyData.get(month)!;
      if (tx.amount > 0) {
        data.income += tx.amount;
      } else {
        data.expense += Math.abs(tx.amount);
      }
    });

    monthlyData.forEach((data) => {
      monthlyIncomes.push(data.income);
      monthlyExpenses.push(data.expense);
    });

    // Calculate stability (coefficient of variation)
    const incomeStability = this.calculateStability(monthlyIncomes);
    const expenseStability = this.calculateStability(monthlyExpenses);

    // Calculate savings rate
    const avgIncome = monthlyIncomes.reduce((a, b) => a + b, 0) / monthlyIncomes.length || 0;
    const avgExpense = monthlyExpenses.reduce((a, b) => a + b, 0) / monthlyExpenses.length || 0;
    const savingsRate = avgIncome > 0 ? (avgIncome - avgExpense) / avgIncome : 0;

    return {
      stability: (incomeStability + expenseStability) / 2,
      savingsRate,
      incomeTrend: this.calculateTrend(monthlyIncomes),
      expenseTrend: this.calculateTrend(monthlyExpenses),
    };
  }

  /**
   * AI: Predict income stability (time-series prediction)
   */
  private async predictIncomeStability(bankData: any): Promise<IncomeStability> {
    // TODO: Integrate with time-series ML model
    // For now, use statistical analysis

    const transactions = bankData.transactions || [];
    const incomes = transactions
      .filter((tx: any) => tx.amount > 0)
      .map((tx: any) => tx.amount);

    if (incomes.length === 0) {
      return { score: 0, prediction: 'UNSTABLE', confidence: 0 };
    }

    const stability = this.calculateStability(incomes);
    const trend = this.calculateTrend(incomes);

    let prediction: 'STABLE' | 'INCREASING' | 'DECREASING' | 'UNSTABLE' = 'UNSTABLE';
    if (stability > 0.8 && trend > -0.1 && trend < 0.1) {
      prediction = 'STABLE';
    } else if (trend > 0.1) {
      prediction = 'INCREASING';
    } else if (trend < -0.1) {
      prediction = 'DECREASING';
    }

    return {
      score: stability,
      prediction,
      confidence: Math.min(0.9, incomes.length / 12), // More data = higher confidence
    };
  }

  /**
   * AI: Categorize spending behavior (NLP)
   */
  private async categorizeSpendingBehavior(bankData: any): Promise<SpendingBehavior> {
    // TODO: Integrate with NLP model for transaction categorization
    // For now, use rule-based categorization

    const transactions = bankData.transactions || [];
    const expenses = transactions.filter((tx: any) => tx.amount < 0);

    const categories: Record<string, number> = {};
    expenses.forEach((tx: any) => {
      const category = tx.category || 'OTHER';
      categories[category] = (categories[category] || 0) + Math.abs(tx.amount);
    });

    // Risk assessment based on categories
    const highRiskCategories = ['GAMBLING', 'CASH_ADVANCE', 'PAYDAY_LOAN'];
    const mediumRiskCategories = ['ENTERTAINMENT', 'LUXURY'];
    const lowRiskCategories = ['GROCERIES', 'UTILITIES', 'TRANSPORTATION'];

    let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' = 'LOW';
    const totalExpense = Object.values(categories).reduce((a, b) => a + b, 0);

    if (totalExpense > 0) {
      const highRiskRatio = highRiskCategories.reduce(
        (sum, cat) => sum + (categories[cat] || 0),
        0,
      ) / totalExpense;
      const mediumRiskRatio = mediumRiskCategories.reduce(
        (sum, cat) => sum + (categories[cat] || 0),
        0,
      ) / totalExpense;

      if (highRiskRatio > 0.1) {
        riskLevel = 'HIGH';
      } else if (mediumRiskRatio > 0.3 || highRiskRatio > 0.05) {
        riskLevel = 'MEDIUM';
      }
    }

    return {
      riskLevel,
      categories,
      totalExpense,
    };
  }

  /**
   * AI: Analyze payment consistency (pattern matching)
   */
  private async analyzePaymentConsistency(
    utilityData: any,
  ): Promise<PaymentConsistency> {
    const payments = utilityData.payments || [];
    if (payments.length === 0) {
      return { consistencyScore: 0, latePayments: 0, averageDaysLate: 0 };
    }

    let onTimeCount = 0;
    let lateCount = 0;
    let totalDaysLate = 0;

    payments.forEach((payment: any) => {
      const daysLate = payment.daysLate || 0;
      if (daysLate === 0) {
        onTimeCount++;
      } else {
        lateCount++;
        totalDaysLate += daysLate;
      }
    });

    const consistencyScore = onTimeCount / payments.length;
    const averageDaysLate = lateCount > 0 ? totalDaysLate / lateCount : 0;

    return {
      consistencyScore,
      latePayments: lateCount,
      averageDaysLate,
    };
  }

  // ==================== Helper Methods ====================

  private calculatePaymentHistoryScore(creditReport: any): number {
    const paymentHistory = creditReport.paymentHistory || {};
    const totalPayments =
      (paymentHistory.onTimePayments || 0) +
      (paymentHistory.latePayments30 || 0) +
      (paymentHistory.latePayments60 || 0) +
      (paymentHistory.latePayments90 || 0);

    if (totalPayments === 0) return 50;

    const onTimeRate = (paymentHistory.onTimePayments || 0) / totalPayments;
    const late30Rate = (paymentHistory.latePayments30 || 0) / totalPayments;
    const late60Rate = (paymentHistory.latePayments60 || 0) / totalPayments;
    const late90Rate = (paymentHistory.latePayments90 || 0) / totalPayments;

    let score = 100;
    score -= late30Rate * 100 * 0.1; // -10% for 30-day late
    score -= late60Rate * 100 * 0.3; // -30% for 60-day late
    score -= late90Rate * 100 * 0.6; // -60% for 90-day late

    return Math.max(0, Math.min(100, score));
  }

  private calculateCreditUtilizationScore(creditReport: any): number {
    const accountsSummary = creditReport.accountsSummary || {};
    const utilization = accountsSummary.creditUtilization || 0;

    if (utilization <= 0.1) return 100; // Excellent
    if (utilization <= 0.3) return 80; // Good
    if (utilization <= 0.5) return 60; // Fair
    if (utilization <= 0.7) return 40; // Poor
    return 20; // Very poor
  }

  private calculatePublicRecordsScore(creditReport: any): number {
    const publicRecords = creditReport.publicRecords || [];
    if (publicRecords.length === 0) return 100;

    let score = 100;
    publicRecords.forEach((record: any) => {
      if (record.type === 'BANKRUPTCY') score -= 50;
      else if (record.type === 'FORECLOSURE') score -= 40;
      else if (record.type === 'LIEN') score -= 30;
      else if (record.type === 'JUDGMENT') score -= 25;
    });

    return Math.max(0, score);
  }

  private calculateWeightedFinalScore(
    scores: {
      traditional: TraditionalBureauScore;
      alternative: AlternativeFinancialScore;
      behavioral: BehavioralDigitalScore;
    },
    weights: { TRADITIONAL_BUREAU: number; ALTERNATIVE_FINANCIAL: number; BEHAVIORAL_DIGITAL: number } = this.DEFAULT_WEIGHTS,
  ): number {
    const traditionalContribution = scores.traditional.score * weights.TRADITIONAL_BUREAU;
    const alternativeContribution = scores.alternative.score * weights.ALTERNATIVE_FINANCIAL;
    const behavioralContribution = scores.behavioral.score * weights.BEHAVIORAL_DIGITAL;

    return traditionalContribution + alternativeContribution + behavioralContribution;
  }

  private calculateConfidence(
    scores: {
      traditional: TraditionalBureauScore;
      alternative: AlternativeFinancialScore;
      behavioral: BehavioralDigitalScore;
    },
    weights: { TRADITIONAL_BUREAU: number; ALTERNATIVE_FINANCIAL: number; BEHAVIORAL_DIGITAL: number } = this.DEFAULT_WEIGHTS,
  ): number {
    const weightedConfidences = [
      scores.traditional.confidence * weights.TRADITIONAL_BUREAU,
      scores.alternative.confidence * weights.ALTERNATIVE_FINANCIAL,
      scores.behavioral.confidence * weights.BEHAVIORAL_DIGITAL,
    ];

    return weightedConfidences.reduce((a, b) => a + b, 0);
  }

  /**
   * Assign risk tier using RiskTierService
   * Returns Prime, Standard, Monitored, or High-risk
   */
  private async assignRiskTier(score: number, companyId?: string): Promise<RiskTier> {
    const tier = await this.riskTierService.assignRiskTier(score, companyId);
    return tier as RiskTier; // Returns PRIME, STANDARD, MONITORED, or HIGH_RISK
  }

  private determineSegmentFromRequest(request: WeightedScoringRequest): 'MICRO' | 'SME' | 'ENTERPRISE' | null {
    // Determine segment based on request data
    // For now, default to SME if no clear indicator
    // This can be enhanced based on loan amount, business type, etc.
    if (request.applicationId) {
      // Could check application details to determine segment
      return 'SME'; // Default
    }
    return null;
  }

  private generateExplanation(result: any): string {
    const parts: string[] = [];
    // Get tier name from result (already assigned)
    const tierName = result.riskTier === 'PRIME' ? 'Prime'
      : result.riskTier === 'STANDARD' ? 'Standard'
      : result.riskTier === 'MONITORED' ? 'Monitored'
      : result.riskTier === 'HIGH_RISK' ? 'High-risk'
      : result.riskTier || 'Unknown';
    parts.push(`Final credit score: ${result.finalScore} (${tierName} risk tier).`);

    // ML score information
    if (result.mlScore) {
      parts.push(`ML-enhanced scoring was applied (model: ${result.mlScore.modelVersion}, confidence: ${(result.mlScore.confidence * 100).toFixed(0)}%).`);
      
      if (result.mlScore.riskFactors && result.mlScore.riskFactors.length > 0) {
        parts.push(`Key risk factors identified: ${result.mlScore.riskFactors.slice(0, 3).join(', ')}.`);
      }
      
      // Top feature importance
      const topFeatures = Object.entries(result.mlScore.featureImportance)
        .sort(([, a], [, b]) => (b as number) - (a as number))
        .slice(0, 3)
        .map(([key]) => key.replace(/([A-Z])/g, ' $1').trim());
      if (topFeatures.length > 0) {
        parts.push(`Most influential factors: ${topFeatures.join(', ')}.`);
      }
    }

    if (result.traditional.score > 700) {
      parts.push('Strong traditional credit history.');
    } else if (result.traditional.score < 600) {
      parts.push('Traditional credit data shows some concerns.');
    }

    if (result.alternative.score > 700) {
      parts.push('Excellent alternative financial indicators.');
    }

    if (result.behavioral.score > 700) {
      parts.push('Positive behavioral and digital signals.');
    }

    return parts.join(' ');
  }

  // Additional helper methods for analysis
  private calculateStability(values: number[]): number {
    if (values.length < 2) return 0.5;
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);
    const cv = mean > 0 ? stdDev / mean : 1; // Coefficient of variation
    return Math.max(0, Math.min(1, 1 - cv)); // Invert: lower CV = higher stability
  }

  private calculateTrend(values: number[]): number {
    if (values.length < 2) return 0;
    const n = values.length;
    const sumX = (n * (n + 1)) / 2;
    const sumY = values.reduce((a, b) => a + b, 0);
    const sumXY = values.reduce((sum, val, idx) => sum + val * (idx + 1), 0);
    const sumX2 = (n * (n + 1) * (2 * n + 1)) / 6;
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    return slope;
  }

  private analyzeAccountLongevity(data: any): { months: number } {
    const oldestAccount = data.accounts?.reduce((oldest: any, account: any) => {
      const accountAge = account.startDate
        ? Math.floor((Date.now() - new Date(account.startDate).getTime()) / (1000 * 60 * 60 * 24 * 30))
        : 0;
      return accountAge > oldest ? accountAge : oldest;
    }, 0) || 0;
    return { months: oldestAccount };
  }

  private analyzeRentTimeliness(data: any): { onTimeRate: number; missedPayments: number } {
    const payments = data.payments || [];
    if (payments.length === 0) return { onTimeRate: 0, missedPayments: 0 };

    const onTime = payments.filter((p: any) => (p.daysLate || 0) === 0).length;
    const missed = payments.filter((p: any) => (p.daysLate || 0) > 30).length;

    return {
      onTimeRate: onTime / payments.length,
      missedPayments: missed,
    };
  }

  private async verifyPaymentSource(data: any): Promise<{ verified: boolean; partial: boolean }> {
    // TODO: Integrate with payment verification service
    return { verified: data.verified || false, partial: data.partial || false };
  }

  private analyzeApplicationCompletion(behavioral: any): { completionRate: number } {
    return {
      completionRate: behavioral.completionRate || 0,
    };
  }

  private analyzeTypingPatterns(behavioral: any): { consistency: number; speed: number } {
    return {
      consistency: behavioral.typingConsistency || 0.5,
      speed: behavioral.typingSpeed || 0.5,
    };
  }

  private analyzeFormFillingBehavior(behavioral: any): { authentic: boolean; suspicious: boolean; timeSpent: number } {
    return {
      authentic: behavioral.authentic || false,
      suspicious: behavioral.suspicious || false,
      timeSpent: behavioral.timeSpentSeconds || 0,
    };
  }

  private analyzeProfessionalProfile(footprint: any): { strength: number } {
    return {
      strength: footprint.professionalStrength || 0.5,
    };
  }

  private analyzeOnlinePresence(footprint: any): { stability: number } {
    return {
      stability: footprint.presenceStability || 0.5,
    };
  }

  private async verifyEducation(footprint: any): Promise<{ verified: boolean; partial: boolean }> {
    // TODO: Integrate with education verification service
    return {
      verified: footprint.educationVerified || false,
      partial: footprint.educationPartial || false,
    };
  }

  private analyzeMerchantCategories(data: any): { riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' } {
    // Simplified risk assessment
    return { riskLevel: 'MEDIUM' };
  }

  private analyzeTimeOfDaySpending(data: any): { consistency: number } {
    return { consistency: data.timeConsistency || 0.5 };
  }

  private analyzeGeographicConsistency(data: any): { consistency: number } {
    return { consistency: data.geographicConsistency || 0.5 };
  }

  private calculateAlternativeConfidence(scores: any): number {
    const confidences = [
      scores.bankAccount.confidence,
      scores.utilityTelecom.confidence,
      scores.rentPayment.confidence,
    ];
    return confidences.reduce((a, b) => a + b, 0) / confidences.length;
  }

  private calculateBehavioralConfidence(scores: any): number {
    const confidences = [
      scores.deviceBiometrics.confidence,
      scores.digitalFootprint.confidence,
      scores.transactionalIntelligence.confidence,
    ];
    return confidences.reduce((a, b) => a + b, 0) / confidences.length;
  }
}

// ==================== Type Definitions ====================

interface WeightedScoringRequest {
  applicantId: string;
  applicationId?: string;
  creditBureauData?: any;
  bankAccountData?: any;
  utilityTelecomData?: any;
  rentPaymentData?: any;
  behavioralData?: any;
  digitalFootprintData?: { consent: boolean; [key: string]: any };
  transactionalData?: any;
  segment?: 'MICRO' | 'SME' | 'ENTERPRISE';
}

interface WeightedScoringResult {
  finalScore: number;
  scoreBreakdown: {
    traditional: TraditionalBureauScore;
    alternative: AlternativeFinancialScore;
    behavioral: BehavioralDigitalScore;
  };
  weights: {
    TRADITIONAL_BUREAU: number;
    ALTERNATIVE_FINANCIAL: number;
    BEHAVIORAL_DIGITAL: number;
  };
  segment?: 'MICRO' | 'SME' | 'ENTERPRISE';
  explanation: string;
  confidence: number;
  riskTier: 'PRIME' | 'STANDARD' | 'MONITORED' | 'HIGH_RISK';
  processingTimeMs: number;
  calculatedAt: Date;
  mlScore?: {
    score: number;
    confidence: number;
    featureImportance: Record<string, number>;
    riskFactors: string[];
    modelVersion: string;
  };
}

interface TraditionalBureauScore {
  score: number;
  breakdown: {
    paymentHistory: number;
    creditUtilization: number;
    publicRecords: number;
  };
  creditReport: { creditScore: number; provider: string } | null;
  confidence: number;
}

interface AlternativeFinancialScore {
  score: number;
  breakdown: {
    bankAccount: BankAccountScore;
    utilityTelecom: UtilityTelecomScore;
    rentPayment: RentPaymentScore;
  };
  confidence: number;
}

interface BankAccountScore {
  score: number;
  confidence: number;
  aiInsights: {
    cashFlowPatterns: CashFlowPatterns | null;
    incomeStability: IncomeStability | null;
    spendingBehavior: SpendingBehavior | null;
  };
}

interface CashFlowPatterns {
  stability: number;
  savingsRate: number;
  incomeTrend: number;
  expenseTrend: number;
}

interface IncomeStability {
  score: number;
  prediction: 'STABLE' | 'INCREASING' | 'DECREASING' | 'UNSTABLE';
  confidence: number;
}

interface SpendingBehavior {
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  categories: Record<string, number>;
  totalExpense: number;
}

interface UtilityTelecomScore {
  score: number;
  confidence: number;
  aiInsights: {
    paymentConsistency: PaymentConsistency | null;
    accountLongevity: { months: number } | null;
  };
}

interface PaymentConsistency {
  consistencyScore: number;
  latePayments: number;
  averageDaysLate: number;
}

interface RentPaymentScore {
  score: number;
  confidence: number;
  aiInsights: {
    timelinessAnalysis: { onTimeRate: number; missedPayments: number } | null;
    paymentSourceVerification: { verified: boolean; partial: boolean } | null;
  };
}

interface BehavioralDigitalScore {
  score: number;
  breakdown: {
    deviceBiometrics: DeviceBiometricsScore;
    digitalFootprint: DigitalFootprintScore;
    transactionalIntelligence: TransactionalIntelligenceScore;
  };
  confidence: number;
}

interface DeviceBiometricsScore {
  score: number;
  confidence: number;
  insights: {
    applicationCompletion: { completionRate: number } | null;
    typingPatterns: { consistency: number; speed: number } | null;
    formFillingBehavior: { authentic: boolean; suspicious: boolean; timeSpent: number } | null;
  };
}

interface DigitalFootprintScore {
  score: number;
  confidence: number;
  insights: {
    professionalProfile: { strength: number } | null;
    onlinePresence: { stability: number } | null;
    educationalVerification: { verified: boolean; partial: boolean } | null;
  };
}

interface TransactionalIntelligenceScore {
  score: number;
  confidence: number;
  insights: {
    merchantCategoryPatterns: { riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' } | null;
    timeOfDaySpending: { consistency: number } | null;
    geographicConsistency: { consistency: number } | null;
  };
}

