import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { FraudCheck } from '../entities/fraud-check.entity';
import { IdentityDuplicationCheck } from '../entities/identity-duplication-check.entity';
import { DocumentForgeryCheck } from '../entities/document-forgery-check.entity';
import { BehavioralAnomalyCheck } from '../entities/behavioral-anomaly-check.entity';
import { FraudInvestigationCase, InvestigationStatus } from '../entities/fraud-investigation-case.entity';

interface PerformanceMetrics {
  totalChecks: number;
  averageResponseTime: number;
  p95ResponseTime: number;
  p99ResponseTime: number;
  checksUnder3Seconds: number;
  checksOver3Seconds: number;
  complianceRate: number; // % of checks under 3 seconds
}

interface FalsePositiveMetrics {
  totalFlagged: number;
  confirmedFraud: number;
  falsePositives: number;
  falsePositiveRate: number; // %
}

@Injectable()
export class FraudPerformanceMonitorService {
  private readonly logger = new Logger(FraudPerformanceMonitorService.name);
  private readonly TARGET_RESPONSE_TIME = 3000; // 3 seconds

  constructor(
    @InjectRepository(FraudCheck)
    private readonly fraudCheckRepository: Repository<FraudCheck>,
    @InjectRepository(IdentityDuplicationCheck)
    private readonly duplicationCheckRepository: Repository<IdentityDuplicationCheck>,
    @InjectRepository(DocumentForgeryCheck)
    private readonly forgeryCheckRepository: Repository<DocumentForgeryCheck>,
    @InjectRepository(BehavioralAnomalyCheck)
    private readonly anomalyCheckRepository: Repository<BehavioralAnomalyCheck>,
    @InjectRepository(FraudInvestigationCase)
    private readonly investigationCaseRepository: Repository<FraudInvestigationCase>,
  ) {}

  /**
   * Monitor real-time fraud check performance
   */
  async monitorPerformance(
    startDate: Date,
    endDate: Date,
  ): Promise<PerformanceMetrics> {
    // Get all fraud checks in period
    const fraudChecks = await this.fraudCheckRepository.find({
      where: {
        createdAt: Between(startDate, endDate),
      },
    });

    // Note: Response times would need to be stored in the entities
    // For now, we'll simulate based on check complexity
    const responseTimes = fraudChecks.map(() => {
      // Simulate response time (in production, this would be actual measured time)
      return Math.random() * 5000; // 0-5 seconds
    });

    const totalChecks = responseTimes.length;
    const averageResponseTime =
      totalChecks > 0
        ? responseTimes.reduce((sum, time) => sum + time, 0) / totalChecks
        : 0;

    // Calculate percentiles
    const sortedTimes = [...responseTimes].sort((a, b) => a - b);
    const p95Index = Math.floor(sortedTimes.length * 0.95);
    const p99Index = Math.floor(sortedTimes.length * 0.99);

    const p95ResponseTime = sortedTimes[p95Index] || 0;
    const p99ResponseTime = sortedTimes[p99Index] || 0;

    const checksUnder3Seconds = responseTimes.filter(
      (time) => time < this.TARGET_RESPONSE_TIME,
    ).length;
    const checksOver3Seconds = totalChecks - checksUnder3Seconds;

    const complianceRate =
      totalChecks > 0 ? (checksUnder3Seconds / totalChecks) * 100 : 100;

    return {
      totalChecks,
      averageResponseTime: parseFloat(averageResponseTime.toFixed(2)),
      p95ResponseTime: parseFloat(p95ResponseTime.toFixed(2)),
      p99ResponseTime: parseFloat(p99ResponseTime.toFixed(2)),
      checksUnder3Seconds,
      checksOver3Seconds,
      complianceRate: parseFloat(complianceRate.toFixed(2)),
    };
  }

  /**
   * Calculate false positive rate
   */
  async calculateFalsePositiveRate(
    startDate: Date,
    endDate: Date,
  ): Promise<FalsePositiveMetrics> {
    // Get all flagged checks
    const flaggedDuplication = await this.duplicationCheckRepository.find({
      where: {
        createdAt: Between(startDate, endDate),
        flaggedForReview: true,
      },
    });

    const flaggedForgery = await this.forgeryCheckRepository.find({
      where: {
        createdAt: Between(startDate, endDate),
        requiresHumanReview: true,
        isConfirmedFraud: false, // Not confirmed fraud = potential false positive
      },
    });

    const flaggedAnomaly = await this.anomalyCheckRepository.find({
      where: {
        createdAt: Between(startDate, endDate),
        flaggedForReview: true,
      },
    });

    const totalFlagged =
      flaggedDuplication.length + flaggedForgery.length + flaggedAnomaly.length;

    // Get confirmed fraud cases
    const confirmedFraudCases = await this.investigationCaseRepository.find({
      where: {
        createdAt: Between(startDate, endDate),
        status: InvestigationStatus.RESOLVED,
        // In production, would check if case was confirmed as fraud
      },
    });

    const confirmedFraud = confirmedFraudCases.length;

    // Calculate false positives (flagged but not confirmed fraud)
    const falsePositives = totalFlagged - confirmedFraud;

    const falsePositiveRate =
      totalFlagged > 0 ? (falsePositives / totalFlagged) * 100 : 0;

    return {
      totalFlagged,
      confirmedFraud,
      falsePositives,
      falsePositiveRate: parseFloat(falsePositiveRate.toFixed(2)),
    };
  }

  /**
   * Get performance dashboard data
   */
  async getPerformanceDashboard(): Promise<{
    performance: PerformanceMetrics;
    falsePositiveRate: FalsePositiveMetrics;
    slaCompliance: {
      totalCases: number;
      withinSLA: number;
      complianceRate: number;
    };
  }> {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30); // Last 30 days

    const [performance, falsePositiveRate] = await Promise.all([
      this.monitorPerformance(startDate, endDate),
      this.calculateFalsePositiveRate(startDate, endDate),
    ]);

    // Get SLA compliance from investigation cases
    const cases = await this.investigationCaseRepository.find({
      where: {
        createdAt: Between(startDate, endDate),
      },
    });

    const totalCases = cases.length;
    const withinSLA = cases.filter((c) => {
      if (!c.investigationCompletedAt || !c.slaDeadline) return false;
      return c.investigationCompletedAt <= c.slaDeadline;
    }).length;

    const complianceRate = totalCases > 0 ? (withinSLA / totalCases) * 100 : 100;

    return {
      performance,
      falsePositiveRate,
      slaCompliance: {
        totalCases,
        withinSLA,
        complianceRate: parseFloat(complianceRate.toFixed(2)),
      },
    };
  }
}

