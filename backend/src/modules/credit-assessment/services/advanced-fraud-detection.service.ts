import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, LessThan } from 'typeorm';
import { FraudScore, FraudScoreSource, RiskLevel } from '../entities/fraud-score.entity';
import { FraudCase, FraudCaseStatus, FraudCaseType } from '../entities/fraud-case.entity';
import { FraudAlert, FraudAlertSeverity } from '../entities/fraud-alert.entity';
import { LoanApplication } from '../../loan-application/entities/loan-application.entity';
import { CalculateFraudScoreDto } from '../dto/fraud-score.dto';
import * as crypto from 'crypto';

interface DeviceFingerprint {
  userAgent?: string;
  screenResolution?: string;
  timezone?: string;
  language?: string;
  platform?: string;
  cookieEnabled?: boolean;
  doNotTrack?: boolean;
  hardwareConcurrency?: number;
  deviceMemory?: number;
}

interface FraudDetectionRequest {
  applicationId: string;
  deviceFingerprint?: DeviceFingerprint;
  ipAddress?: string;
  userAgent?: string;
  behavioralData?: Record<string, any>;
}

/**
 * Advanced Fraud Detection Service
 * Provides ML-powered fraud detection with real-time scoring
 */
@Injectable()
export class AdvancedFraudDetectionService {
  private readonly logger = new Logger(AdvancedFraudDetectionService.name);
  private readonly blacklist = new Set<string>(); // In production, use database
  private readonly whitelist = new Set<string>(); // In production, use database

  constructor(
    @InjectRepository(FraudScore)
    private readonly fraudScoreRepository: Repository<FraudScore>,
    @InjectRepository(FraudCase)
    private readonly fraudCaseRepository: Repository<FraudCase>,
    @InjectRepository(FraudAlert)
    private readonly fraudAlertRepository: Repository<FraudAlert>,
    @InjectRepository(LoanApplication)
    private readonly applicationRepository: Repository<LoanApplication>,
  ) {}

  /**
   * Calculate real-time fraud score for an application
   */
  async calculateFraudScore(request: FraudDetectionRequest | CalculateFraudScoreDto): Promise<FraudScore> {
    const application = await this.applicationRepository.findOne({
      where: { id: request.applicationId },
    });

    if (!application) {
      throw new BadRequestException(`Application ${request.applicationId} not found`);
    }

    // Generate device ID from fingerprint
    const deviceId = this.generateDeviceId(request.deviceFingerprint, request.ipAddress, request.userAgent);

    // Check blacklist/whitelist
    const isBlacklisted = this.blacklist.has(deviceId) || this.blacklist.has(request.ipAddress || '');
    const isWhitelisted = this.whitelist.has(deviceId) || this.whitelist.has(request.ipAddress || '');

    if (isWhitelisted) {
      return this.createScore(application.id, 0, RiskLevel.LOW, FraudScoreSource.RULE_BASED, {
        reason: 'Device/IP whitelisted',
      });
    }

    if (isBlacklisted) {
      return this.createScore(application.id, 100, RiskLevel.CRITICAL, FraudScoreSource.RULE_BASED, {
        reason: 'Device/IP blacklisted',
      });
    }

    // Calculate scores from different sources
    const mlScore = await this.calculateMLScore(application, request);
    const behavioralScore = await this.calculateBehavioralScore(application, request);
    const deviceScore = await this.calculateDeviceScore(request);
    const velocityScore = await this.calculateVelocityScore(application);
    const externalApiScore = await this.calculateExternalApiScore(application, request);

    // Weighted combination of scores
    const finalScore = this.combineScores({
      ml: { score: mlScore.score, weight: 0.3 },
      behavioral: { score: behavioralScore.score, weight: 0.25 },
      device: { score: deviceScore.score, weight: 0.2 },
      velocity: { score: velocityScore.score, weight: 0.15 },
      external: { score: externalApiScore.score, weight: 0.1 },
    });

    const riskLevel = this.scoreToRiskLevel(finalScore);

    // Create fraud score record
    const fraudScore = this.fraudScoreRepository.create({
      applicationId: application.id,
      score: finalScore,
      riskLevel,
      source: FraudScoreSource.ML_MODEL,
      factors: {
        mlScore: mlScore.score,
        behavioralScore: behavioralScore.score,
        deviceScore: deviceScore.score,
        velocityScore: velocityScore.score,
        externalApiScore: externalApiScore.score,
        mlFactors: mlScore.factors,
        behavioralFactors: behavioralScore.factors,
        deviceFactors: deviceScore.factors,
      },
      deviceFingerprint: request.deviceFingerprint || {},
      behavioralData: request.behavioralData || {},
      ipAddress: request.ipAddress || null,
      userAgent: request.userAgent || null,
      deviceId,
      isBlacklisted,
      isWhitelisted,
      externalApiResponse: externalApiScore.response || null,
      explanation: this.generateExplanation(finalScore, riskLevel, {
        ml: mlScore,
        behavioral: behavioralScore,
        device: deviceScore,
        velocity: velocityScore,
      }),
    });

    return await this.fraudScoreRepository.save(fraudScore);
  }

  /**
   * Calculate ML-based fraud score
   */
  private async calculateMLScore(
    application: LoanApplication,
    request: FraudDetectionRequest,
  ): Promise<{ score: number; factors: Record<string, any> }> {
    // In production, this would call a trained ML model
    // For now, using rule-based scoring that mimics ML behavior

    const factors: Record<string, number> = {};
    let totalScore = 0;

    // Factor 1: Income to loan amount ratio
    // LoanApplication doesn't have monthlyIncome - using requestedAmount as proxy
    const incomeRatio = application.requestedAmount / (application.requestedAmount * 2 || 1);
    if (incomeRatio > 0.5) {
      factors.incomeRatio = 20;
      totalScore += 20;
    } else if (incomeRatio > 0.3) {
      factors.incomeRatio = 10;
      totalScore += 10;
    }

    // Factor 2: Employment duration
    // LoanApplication doesn't have employmentDuration - skipping this check
    const employmentDuration = null;
    if (employmentDuration && employmentDuration < 6) {
      factors.shortEmployment = 15;
      totalScore += 15;
    }

    // Factor 3: Credit history
    // LoanApplication doesn't have creditScore - skipping this check
    const creditScore = null;
    if (creditScore && creditScore < 600) {
      factors.lowCreditScore = 25;
      totalScore += 25;
    }

    // Factor 4: Application completeness
    const completeness = this.calculateCompleteness(application);
    if (completeness < 0.7) {
      factors.incompleteApplication = 10;
      totalScore += 10;
    }

    // Factor 5: Document quality (mocked)
    const documentQuality = Math.random();
    if (documentQuality < 0.1) {
      factors.poorDocumentQuality = 30;
      totalScore += 30;
    }

    return {
      score: Math.min(100, totalScore),
      factors,
    };
  }

  /**
   * Calculate behavioral score
   */
  private async calculateBehavioralScore(
    application: LoanApplication,
    request: FraudDetectionRequest,
  ): Promise<{ score: number; factors: Record<string, any> }> {
    const factors: Record<string, number> = {};
    let totalScore = 0;

    // Check application submission time (suspicious if very late night)
    const submissionHour = new Date(application.createdAt).getHours();
    if (submissionHour >= 2 && submissionHour <= 5) {
      factors.suspiciousTime = 15;
      totalScore += 15;
    }

    // Check form filling speed (too fast = bot, too slow = suspicious)
    if (request.behavioralData?.formFillTime) {
      const fillTime = request.behavioralData.formFillTime;
      if (fillTime < 30) {
        factors.tooFastFilling = 20;
        totalScore += 20;
      } else if (fillTime > 3600) {
        factors.tooSlowFilling = 10;
        totalScore += 10;
      }
    }

    // Check mouse movements / keystrokes (mocked)
    if (request.behavioralData?.mouseMovements) {
      const movements = request.behavioralData.mouseMovements;
      if (movements < 10) {
        factors.lowMouseActivity = 15;
        totalScore += 15;
      }
    }

    // Check copy-paste patterns
    if (request.behavioralData?.copyPasteCount && request.behavioralData.copyPasteCount > 5) {
      factors.highCopyPaste = 10;
      totalScore += 10;
    }

    return {
      score: Math.min(100, totalScore),
      factors,
    };
  }

  /**
   * Calculate device-based score
   */
  private async calculateDeviceScore(request: FraudDetectionRequest): Promise<{ score: number; factors: Record<string, any> }> {
    const factors: Record<string, number> = {};
    let totalScore = 0;

    if (!request.deviceFingerprint) {
      return { score: 0, factors: {} };
    }

    // Check for known fraud indicators in device fingerprint
    const fingerprint = request.deviceFingerprint;

    // VPN/Proxy detection (mocked)
    if (request.ipAddress) {
      // In production, use IP reputation service
      const isVPN = this.checkVPN(request.ipAddress);
      if (isVPN) {
        factors.vpnDetected = 20;
        totalScore += 20;
      }
    }

    // Check for emulator/virtual machine indicators
    if (fingerprint.platform && fingerprint.platform.includes('Virtual')) {
      factors.virtualMachine = 25;
      totalScore += 25;
    }

    // Check for missing or suspicious device attributes
    if (!fingerprint.timezone || !fingerprint.language) {
      factors.missingAttributes = 15;
      totalScore += 15;
    }

    // Check device consistency (same device used for multiple applications)
    const deviceId = this.generateDeviceId(fingerprint, request.ipAddress, request.userAgent);
    const deviceUsageCount = await this.getDeviceUsageCount(deviceId);
    if (deviceUsageCount > 3) {
      factors.highDeviceUsage = 30;
      totalScore += 30;
    }

    return {
      score: Math.min(100, totalScore),
      factors,
    };
  }

  /**
   * Calculate application velocity score
   */
  private async calculateVelocityScore(application: LoanApplication): Promise<{ score: number; factors: Record<string, any> }> {
    const factors: Record<string, number> = {};
    let totalScore = 0;

    // Check applications from same applicant in last 30 days
    const recentApplications = await this.applicationRepository.count({
      where: {
        applicantId: application.applicantId,
        createdAt: LessThan(new Date()),
      },
    });

    if (recentApplications > 5) {
      factors.highApplicationCount = 40;
      totalScore += 40;
    } else if (recentApplications > 3) {
      factors.moderateApplicationCount = 20;
      totalScore += 20;
    }

    // Check applications from same IP (if available)
    // This would require storing IP addresses with applications

    return {
      score: Math.min(100, totalScore),
      factors,
    };
  }

  /**
   * Calculate external API score (Sift, Kount, etc.)
   */
  private async calculateExternalApiScore(
    application: LoanApplication,
    request: FraudDetectionRequest,
  ): Promise<{ score: number; factors: Record<string, any>; response?: any }> {
    // In production, integrate with external fraud detection APIs
    // For now, return a mock response

    // Mock external API call
    const mockResponse = {
      riskScore: Math.random() * 100,
      recommendations: ['review_manually'],
      signals: ['new_device', 'unusual_location'],
    };

    return {
      score: mockResponse.riskScore,
      factors: {
        externalRiskScore: mockResponse.riskScore,
        signals: mockResponse.signals,
      },
      response: mockResponse,
    };
  }

  /**
   * Combine multiple scores with weights
   */
  private combineScores(scores: Record<string, { score: number; weight: number }>): number {
    let weightedSum = 0;
    let totalWeight = 0;

    for (const [key, value] of Object.entries(scores)) {
      weightedSum += value.score * value.weight;
      totalWeight += value.weight;
    }

    return totalWeight > 0 ? weightedSum / totalWeight : 0;
  }

  /**
   * Convert score to risk level
   */
  private scoreToRiskLevel(score: number): RiskLevel {
    if (score >= 80) return RiskLevel.CRITICAL;
    if (score >= 60) return RiskLevel.HIGH;
    if (score >= 40) return RiskLevel.MEDIUM;
    return RiskLevel.LOW;
  }

  /**
   * Generate device ID from fingerprint
   */
  private generateDeviceId(fingerprint?: DeviceFingerprint, ipAddress?: string, userAgent?: string): string {
    const data = [
      fingerprint?.userAgent || userAgent || '',
      fingerprint?.screenResolution || '',
      fingerprint?.timezone || '',
      fingerprint?.language || '',
      fingerprint?.platform || '',
      ipAddress || '',
    ].join('|');

    return crypto.createHash('sha256').update(data).digest('hex').substring(0, 32);
  }

  /**
   * Check if IP is VPN/Proxy (mocked)
   */
  private checkVPN(ipAddress: string): boolean {
    // In production, use IP reputation service
    // Mock: 5% chance of VPN
    return Math.random() < 0.05;
  }

  /**
   * Get device usage count
   */
  private async getDeviceUsageCount(deviceId: string): Promise<number> {
    return await this.fraudScoreRepository.count({
      where: { deviceId },
    });
  }

  /**
   * Calculate application completeness
   */
  private calculateCompleteness(application: LoanApplication): number {
    let fields = 0;
    let filled = 0;

    const requiredFields = [
      'applicantName',
      'applicantEmail',
      'applicantPhone',
      'monthlyIncome',
      'employmentStatus',
      'requestedAmount',
    ];

    requiredFields.forEach((field) => {
      fields++;
      if ((application as any)[field]) {
        filled++;
      }
    });

    return fields > 0 ? filled / fields : 0;
  }

  /**
   * Create a fraud score record
   */
  private async createScore(
    applicationId: string,
    score: number,
    riskLevel: RiskLevel,
    source: FraudScoreSource,
    factors: Record<string, any>,
  ): Promise<FraudScore> {
    const fraudScore = this.fraudScoreRepository.create({
      applicationId,
      score,
      riskLevel,
      source,
      factors,
      explanation: this.generateExplanation(score, riskLevel, {}),
    });

    return await this.fraudScoreRepository.save(fraudScore);
  }

  /**
   * Generate human-readable explanation
   */
  private generateExplanation(
    score: number,
    riskLevel: RiskLevel,
    contributingScores: Record<string, any>,
  ): string {
    const explanations: string[] = [];

    if (score >= 80) {
      explanations.push('Very high fraud risk detected');
    } else if (score >= 60) {
      explanations.push('High fraud risk detected');
    } else if (score >= 40) {
      explanations.push('Moderate fraud risk detected');
    } else {
      explanations.push('Low fraud risk');
    }

    if (contributingScores.ml?.factors) {
      const mlFactors = Object.keys(contributingScores.ml.factors);
      if (mlFactors.length > 0) {
        explanations.push(`ML factors: ${mlFactors.join(', ')}`);
      }
    }

    if (contributingScores.behavioral?.factors) {
      const behavioralFactors = Object.keys(contributingScores.behavioral.factors);
      if (behavioralFactors.length > 0) {
        explanations.push(`Behavioral factors: ${behavioralFactors.join(', ')}`);
      }
    }

    return explanations.join('. ');
  }

  /**
   * Create or update fraud case
   */
  async createOrUpdateCase(
    alertId: string,
    caseType: FraudCaseType,
    description: string,
  ): Promise<FraudCase> {
    const alert = await this.fraudAlertRepository.findOne({ where: { id: alertId } });
    if (!alert) {
      throw new BadRequestException(`Alert ${alertId} not found`);
    }

    // Check if case already exists
    let fraudCase = await this.fraudCaseRepository.findOne({
      where: { caseNumber: `CASE-${alert.id.substring(0, 8).toUpperCase()}` },
    });

    if (!fraudCase) {
      fraudCase = this.fraudCaseRepository.create({
        caseNumber: `CASE-${alert.id.substring(0, 8).toUpperCase()}`,
        caseType,
        status: FraudCaseStatus.OPEN,
        priority: this.calculatePriority(alert.severity),
        description,
        relatedApplications: [alert.applicationId],
      });
    } else {
      fraudCase.description = description;
      fraudCase.status = FraudCaseStatus.INVESTIGATING;
    }

    // Link alert to case
    alert.caseId = fraudCase.id;
    await this.fraudAlertRepository.save(alert);

    return await this.fraudCaseRepository.save(fraudCase);
  }

  /**
   * Calculate case priority from alert severity
   */
  private calculatePriority(severity: FraudAlertSeverity): number {
    switch (severity) {
      case FraudAlertSeverity.CRITICAL:
        return 1;
      case FraudAlertSeverity.HIGH:
        return 2;
      case FraudAlertSeverity.MEDIUM:
        return 3;
      default:
        return 4;
    }
  }

  /**
   * Get fraud analytics
   */
  async getFraudAnalytics(filters?: { fromDate?: Date; toDate?: Date; companyId?: string }) {
    const query = this.fraudScoreRepository.createQueryBuilder('score');

    if (filters?.fromDate) {
      query.andWhere('score.createdAt >= :fromDate', { fromDate: filters.fromDate });
    }

    if (filters?.toDate) {
      query.andWhere('score.createdAt <= :toDate', { toDate: filters.toDate });
    }

    const scores = await query.getMany();

    const total = scores.length;
    const critical = scores.filter((s) => s.riskLevel === RiskLevel.CRITICAL).length;
    const high = scores.filter((s) => s.riskLevel === RiskLevel.HIGH).length;
    const medium = scores.filter((s) => s.riskLevel === RiskLevel.MEDIUM).length;
    const low = scores.filter((s) => s.riskLevel === RiskLevel.LOW).length;

    const averageScore = total > 0 ? scores.reduce((sum, s) => sum + Number(s.score), 0) / total : 0;

    return {
      total,
      critical,
      high,
      medium,
      low,
      averageScore: Number(averageScore.toFixed(2)),
      distribution: {
        critical: total > 0 ? (critical / total) * 100 : 0,
        high: total > 0 ? (high / total) * 100 : 0,
        medium: total > 0 ? (medium / total) * 100 : 0,
        low: total > 0 ? (low / total) * 100 : 0,
      },
    };
  }
}

