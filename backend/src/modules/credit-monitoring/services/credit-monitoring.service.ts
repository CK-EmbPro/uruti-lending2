import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan, MoreThan } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { CreditMonitoring } from '../entities/credit-monitoring.entity';
import { CreditScoreRecord } from '../entities/credit-score-record.entity';
import { CreditAlert } from '../entities/credit-alert.entity';
import { CreditScoreChangeType, AlertSeverity } from '../dto/credit-monitoring.dto';
import {
  CreateCreditMonitoringDto,
  CreditScoreRecord as CreditScoreRecordDto,
  CreditAlert as CreditAlertDto,
  CreditMonitoringSummary,
  CreditBureau,
} from '../dto/credit-monitoring.dto';

@Injectable()
export class CreditMonitoringService {
  private readonly logger = new Logger(CreditMonitoringService.name);

  constructor(
    @InjectRepository(CreditMonitoring)
    private monitoringRepository: Repository<CreditMonitoring>,
    @InjectRepository(CreditScoreRecord)
    private scoreRecordRepository: Repository<CreditScoreRecord>,
    @InjectRepository(CreditAlert)
    private alertRepository: Repository<CreditAlert>,
  ) {}

  async createMonitoring(createDto: CreateCreditMonitoringDto, userId: string): Promise<CreditMonitoring> {
    // Check if monitoring already exists for this customer and bureau
    const existing = await this.monitoringRepository.findOne({
      where: {
        customerId: createDto.customerId,
        creditBureau: createDto.creditBureau,
      },
    });

    if (existing) {
      throw new BadRequestException(
        `Credit monitoring already exists for customer ${createDto.customerId} with bureau ${createDto.creditBureau}`,
      );
    }

    const monitoring = this.monitoringRepository.create({
      ...createDto,
      nextCheckAt: this.calculateNextCheckDate(createDto.monitoringFrequency),
      createdBy: userId,
    });

    const saved = await this.monitoringRepository.save(monitoring);

    // Perform initial credit check
    await this.performCreditCheck(saved.id);

    return saved;
  }

  async findAllMonitoring(customerId?: string, isActive?: boolean): Promise<CreditMonitoring[]> {
    const where: any = {};
    if (customerId) where.customerId = customerId;
    if (isActive !== undefined) where.isActive = isActive;

    return this.monitoringRepository.find({
      where,
      order: { createdAt: 'DESC' },
    });
  }

  async findOneMonitoring(id: string): Promise<CreditMonitoring> {
    const monitoring = await this.monitoringRepository.findOne({ where: { id } });
    if (!monitoring) {
      throw new NotFoundException(`Credit monitoring with ID ${id} not found`);
    }
    return monitoring;
  }

  async updateMonitoring(
    id: string,
    updates: Partial<CreateCreditMonitoringDto>,
    userId: string,
  ): Promise<CreditMonitoring> {
    const monitoring = await this.findOneMonitoring(id);
    Object.assign(monitoring, updates);
    if (updates.monitoringFrequency) {
      monitoring.nextCheckAt = this.calculateNextCheckDate(updates.monitoringFrequency);
    }
    monitoring.updatedBy = userId;
    return this.monitoringRepository.save(monitoring);
  }

  async deleteMonitoring(id: string): Promise<void> {
    const monitoring = await this.findOneMonitoring(id);
    await this.monitoringRepository.remove(monitoring);
  }

  async performCreditCheck(monitoringId: string): Promise<CreditScoreRecord> {
    const monitoring = await this.findOneMonitoring(monitoringId);

    if (!monitoring.isActive) {
      throw new BadRequestException('Credit monitoring is not active');
    }

    // TODO: Integrate with actual credit bureau API
    // For now, simulate credit score retrieval
    const creditScore = await this.fetchCreditScore(monitoring.customerId, monitoring.creditBureau);

    // Get previous score
    const previousRecord = await this.scoreRecordRepository.findOne({
      where: {
        customerId: monitoring.customerId,
        creditBureau: monitoring.creditBureau,
      },
      order: { scoreDate: 'DESC' },
    });

    const previousScore = previousRecord?.creditScore;
    const scoreChange = previousScore ? creditScore - previousScore : 0;
    const changeType = this.determineChangeType(scoreChange);

    // Create new score record
    const scoreRecord = this.scoreRecordRepository.create({
      customerId: monitoring.customerId,
      monitoringId: monitoring.id,
      creditBureau: monitoring.creditBureau,
      creditScore: creditScore,
      scoreDate: new Date(),
      previousScore: previousScore,
      scoreChange: scoreChange,
      changeType: changeType,
      creditFactors: await this.fetchCreditFactors(monitoring.customerId, monitoring.creditBureau),
      reportData: await this.fetchReportData(monitoring.customerId, monitoring.creditBureau),
    });

    const savedRecord = await this.scoreRecordRepository.save(scoreRecord);

    // Update monitoring
    monitoring.lastCheckedAt = new Date();
    monitoring.nextCheckAt = this.calculateNextCheckDate(monitoring.monitoringFrequency);
    monitoring.checkCount += 1;
    await this.monitoringRepository.save(monitoring);

    // Check for alerts
    if (monitoring.alertThreshold && Math.abs(scoreChange) >= monitoring.alertThreshold) {
      await this.createAlert(monitoring, savedRecord, scoreChange);
    }

    return savedRecord;
  }

  private async fetchCreditScore(customerId: string, bureau: CreditBureau): Promise<number> {
    // TODO: Integrate with actual credit bureau API
    // This is a placeholder that simulates credit score retrieval
    this.logger.log(`Fetching credit score for customer ${customerId} from ${bureau}`);
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Return simulated score (in production, this would be an actual API call)
    return Math.floor(Math.random() * 200) + 500; // 500-700 range
  }

  private async fetchCreditFactors(customerId: string, bureau: CreditBureau): Promise<Record<string, any>> {
    // TODO: Integrate with actual credit bureau API
    return {
      paymentHistory: 'Good',
      creditUtilization: 'Low',
      lengthOfCreditHistory: 'Average',
      newCredit: 'None',
      creditMix: 'Good',
    };
  }

  private async fetchReportData(customerId: string, bureau: CreditBureau): Promise<Record<string, any>> {
    // TODO: Integrate with actual credit bureau API
    return {
      reportDate: new Date().toISOString(),
      bureau: bureau,
      // Additional report data would come from actual API
    };
  }

  private determineChangeType(scoreChange: number): CreditScoreChangeType {
    if (scoreChange > 0) return CreditScoreChangeType.INCREASE;
    if (scoreChange < 0) return CreditScoreChangeType.DECREASE;
    return CreditScoreChangeType.NO_CHANGE;
  }

  private calculateNextCheckDate(frequencyDays: number): Date {
    const nextCheck = new Date();
    nextCheck.setDate(nextCheck.getDate() + frequencyDays);
    return nextCheck;
  }

  async createAlert(
    monitoring: CreditMonitoring,
    scoreRecord: CreditScoreRecord,
    scoreChange: number,
  ): Promise<CreditAlert> {
    const alertType = scoreChange > 0 ? 'SIGNIFICANT_INCREASE' : 'SIGNIFICANT_DECREASE';
    const severity = this.determineAlertSeverity(Math.abs(scoreChange));

    const message = `Credit score ${scoreChange > 0 ? 'increased' : 'decreased'} by ${Math.abs(scoreChange)} points. ` +
      `Current score: ${scoreRecord.creditScore} (Previous: ${scoreRecord.previousScore})`;

    const alert = this.alertRepository.create({
      customerId: monitoring.customerId,
      monitoringId: monitoring.id,
      alertType,
      severity,
      message,
      currentScore: scoreRecord.creditScore,
      previousScore: scoreRecord.previousScore || 0,
      scoreChange,
      alertDate: new Date(),
      metadata: {
        creditBureau: monitoring.creditBureau,
        scoreRecordId: scoreRecord.id,
      },
    });

    return this.alertRepository.save(alert);
  }

  private determineAlertSeverity(scoreChange: number): AlertSeverity {
    if (scoreChange >= 50) return AlertSeverity.CRITICAL;
    if (scoreChange >= 30) return AlertSeverity.HIGH;
    if (scoreChange >= 20) return AlertSeverity.MEDIUM;
    return AlertSeverity.LOW;
  }

  async getCreditHistory(customerId: string, bureau?: CreditBureau): Promise<CreditScoreRecord[]> {
    const where: any = { customerId };
    if (bureau) where.creditBureau = bureau;

    return this.scoreRecordRepository.find({
      where,
      order: { scoreDate: 'DESC' },
    });
  }

  async getAlerts(customerId?: string, isRead?: boolean): Promise<CreditAlert[]> {
    const where: any = {};
    if (customerId) where.customerId = customerId;
    if (isRead !== undefined) where.isRead = isRead;

    return this.alertRepository.find({
      where,
      order: { alertDate: 'DESC' },
    });
  }

  async markAlertAsRead(alertId: string): Promise<CreditAlert> {
    const alert = await this.alertRepository.findOne({ where: { id: alertId } });
    if (!alert) {
      throw new NotFoundException(`Credit alert with ID ${alertId} not found`);
    }
    alert.isRead = true;
    return this.alertRepository.save(alert);
  }

  async getMonitoringSummary(): Promise<CreditMonitoringSummary> {
    const allMonitoring = await this.monitoringRepository.find();
    const activeMonitoring = allMonitoring.filter(m => m.isActive);

    // Get recent score changes (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentChanges = await this.scoreRecordRepository.count({
      where: {
        scoreDate: MoreThan(thirtyDaysAgo),
        scoreChange: MoreThan(0), // Non-zero changes
      },
    });

    // Get active alerts
    const activeAlerts = await this.alertRepository.count({
      where: { isRead: false },
    });

    // Calculate average credit score
    const recentScores = await this.scoreRecordRepository
      .createQueryBuilder('record')
      .select('AVG(record.creditScore)', 'avg')
      .where('record.scoreDate >= :date', { date: thirtyDaysAgo })
      .getRawOne();

    const averageScore = recentScores?.avg ? Math.round(Number(recentScores.avg)) : 0;

    // Score distribution
    const allScores = await this.scoreRecordRepository
      .createQueryBuilder('record')
      .select('record.creditScore', 'score')
      .where('record.scoreDate >= :date', { date: thirtyDaysAgo })
      .getRawMany();

    const distribution = {
      excellent: allScores.filter(s => s.score >= 800).length,
      good: allScores.filter(s => s.score >= 700 && s.score < 800).length,
      fair: allScores.filter(s => s.score >= 600 && s.score < 700).length,
      poor: allScores.filter(s => s.score < 600).length,
    };

    return {
      totalMonitored: allMonitoring.length,
      activeMonitoring: activeMonitoring.length,
      recentScoreChanges: recentChanges,
      activeAlerts: activeAlerts,
      averageCreditScore: averageScore,
      scoreDistribution: distribution,
    };
  }

  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async processScheduledChecks() {
    this.logger.log('Processing scheduled credit checks...');
    const dueChecks = await this.monitoringRepository.find({
      where: {
        isActive: true,
        nextCheckAt: LessThan(new Date()),
      },
    });

    for (const monitoring of dueChecks) {
      try {
        await this.performCreditCheck(monitoring.id);
        this.logger.log(`Completed credit check for monitoring ${monitoring.id}`);
      } catch (error) {
        this.logger.error(`Error processing credit check for monitoring ${monitoring.id}: ${error.message}`);
      }
    }

    this.logger.log(`Processed ${dueChecks.length} scheduled credit checks`);
  }
}

