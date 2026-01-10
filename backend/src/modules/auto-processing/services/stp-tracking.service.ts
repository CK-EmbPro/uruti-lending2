import {
  Injectable,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { STPMetric, ManualReviewQueueItem } from '../entities/stp-metrics.entity';
import {
  ProcessingType,
  CustomerSegment,
  STPMetricsDto,
  ManualTrigger,
  QueuePriority,
  ManualReviewQueueItemDto,
} from '../dto/stp-tracking.dto';

@Injectable()
export class STPTrackingService {
  private readonly logger = new Logger(STPTrackingService.name);

  // Segment-specific STP targets
  private readonly SEGMENT_TARGETS = {
    [CustomerSegment.REPEAT_BORROWER]: 95,
    [CustomerSegment.NEW_STRONG_PROFILE]: 70,
    [CustomerSegment.NEW_WEAK_PROFILE]: 20,
  };

  constructor(
    @InjectRepository(STPMetric)
    private readonly stpMetricRepository: Repository<STPMetric>,
    @InjectRepository(ManualReviewQueueItem)
    private readonly queueRepository: Repository<ManualReviewQueueItem>,
  ) {}

  /**
   * Record STP metric
   */
  async recordSTPMetric(
    entityId: string,
    processingType: ProcessingType,
    autoProcessed: boolean,
    segment?: CustomerSegment,
    manualTriggers?: ManualTrigger[],
    processingTimeMs?: number,
  ): Promise<STPMetric> {
    const metric = this.stpMetricRepository.create({
      entityId,
      processingType,
      segment: segment || null,
      autoProcessed,
      manualTriggers: manualTriggers || [],
      processedAt: new Date(),
      processingTimeMs,
    });

    return await this.stpMetricRepository.save(metric);
  }

  /**
   * Calculate STP rate: (auto-processed / total) × 100
   */
  async calculateSTPRate(
    startDate: Date,
    endDate: Date,
    segment?: CustomerSegment,
    processingType?: ProcessingType,
  ): Promise<STPMetricsDto> {
    const queryBuilder = this.stpMetricRepository
      .createQueryBuilder('metric')
      .where('metric.processedAt BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      });

    if (segment) {
      queryBuilder.andWhere('metric.segment = :segment', { segment });
    }

    if (processingType) {
      queryBuilder.andWhere('metric.processingType = :processingType', {
        processingType,
      });
    }

    const metrics = await queryBuilder.getMany();

    const totalProcessed = metrics.length;
    const autoProcessed = metrics.filter((m) => m.autoProcessed).length;
    const stpRate = totalProcessed > 0 ? (autoProcessed / totalProcessed) * 100 : 0;

    // Calculate segment-specific rates
    const segmentRates: Record<CustomerSegment, number> = {
      [CustomerSegment.REPEAT_BORROWER]: await this.calculateSegmentRate(
        startDate,
        endDate,
        CustomerSegment.REPEAT_BORROWER,
        processingType,
      ),
      [CustomerSegment.NEW_STRONG_PROFILE]: await this.calculateSegmentRate(
        startDate,
        endDate,
        CustomerSegment.NEW_STRONG_PROFILE,
        processingType,
      ),
      [CustomerSegment.NEW_WEAK_PROFILE]: await this.calculateSegmentRate(
        startDate,
        endDate,
        CustomerSegment.NEW_WEAK_PROFILE,
        processingType,
      ),
    };

    return {
      totalProcessed,
      autoProcessed,
      stpRate: parseFloat(stpRate.toFixed(2)),
      segmentRates,
      periodStart: startDate,
      periodEnd: endDate,
    };
  }

  /**
   * Calculate STP rate for a specific segment
   */
  private async calculateSegmentRate(
    startDate: Date,
    endDate: Date,
    segment: CustomerSegment,
    processingType?: ProcessingType,
  ): Promise<number> {
    const queryBuilder = this.stpMetricRepository
      .createQueryBuilder('metric')
      .where('metric.processedAt BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      })
      .andWhere('metric.segment = :segment', { segment });

    if (processingType) {
      queryBuilder.andWhere('metric.processingType = :processingType', {
        processingType,
      });
    }

    const metrics = await queryBuilder.getMany();

    if (metrics.length === 0) {
      return 0;
    }

    const autoProcessed = metrics.filter((m) => m.autoProcessed).length;
    return parseFloat(((autoProcessed / metrics.length) * 100).toFixed(2));
  }

  /**
   * Get STP metrics by hour
   */
  async getSTPMetricsByHour(
    date: Date,
    segment?: CustomerSegment,
  ): Promise<STPMetricsDto[]> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const metrics: STPMetricsDto[] = [];

    for (let hour = 0; hour < 24; hour++) {
      const hourStart = new Date(startOfDay);
      hourStart.setHours(hour, 0, 0, 0);

      const hourEnd = new Date(startOfDay);
      hourEnd.setHours(hour, 59, 59, 999);

      const hourMetrics = await this.calculateSTPRate(
        hourStart,
        hourEnd,
        segment,
      );
      metrics.push(hourMetrics);
    }

    return metrics;
  }

  /**
   * Get STP metrics by day
   */
  async getSTPMetricsByDay(
    startDate: Date,
    endDate: Date,
    segment?: CustomerSegment,
  ): Promise<STPMetricsDto[]> {
    const metrics: STPMetricsDto[] = [];
    const currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      const dayStart = new Date(currentDate);
      dayStart.setHours(0, 0, 0, 0);

      const dayEnd = new Date(currentDate);
      dayEnd.setHours(23, 59, 59, 999);

      const dayMetrics = await this.calculateSTPRate(dayStart, dayEnd, segment);
      metrics.push(dayMetrics);

      currentDate.setDate(currentDate.getDate() + 1);
    }

    return metrics;
  }

  /**
   * Check if STP rate meets segment target
   */
  async checkSTPTarget(segment: CustomerSegment): Promise<{
    currentRate: number;
    target: number;
    meetsTarget: boolean;
  }> {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30); // Last 30 days

    const metrics = await this.calculateSTPRate(startDate, endDate, segment);
    const target = this.SEGMENT_TARGETS[segment];

    return {
      currentRate: metrics.stpRate,
      target,
      meetsTarget: metrics.stpRate >= target,
    };
  }

  /**
   * Add item to manual review queue
   */
  async addToManualReviewQueue(
    entityId: string,
    processingType: ProcessingType,
    triggers: ManualTrigger[],
    priority: QueuePriority = QueuePriority.MEDIUM,
  ): Promise<ManualReviewQueueItem> {
    // Calculate priority score
    const priorityScore = this.calculatePriorityScore(triggers, priority);

    const queueItem = this.queueRepository.create({
      entityId,
      processingType,
      triggers,
      priority: priority,
      priorityScore,
    });

    return await this.queueRepository.save(queueItem);
  }

  /**
   * Calculate priority score for queue item
   */
  private calculatePriorityScore(
    triggers: ManualTrigger[],
    priority: QueuePriority,
  ): number {
    let score = 0;

    // Base score from priority
    const priorityScores = {
      [QueuePriority.URGENT]: 100,
      [QueuePriority.HIGH]: 75,
      [QueuePriority.MEDIUM]: 50,
      [QueuePriority.LOW]: 25,
    };
    score += priorityScores[priority] || 50;

    // Add score from triggers
    const triggerScores = {
      [ManualTrigger.FRAUD]: 30,
      [ManualTrigger.LARGE_AMOUNT]: 20,
      [ManualTrigger.ACCOUNT_VERIFICATION_FAILED]: 25,
      [ManualTrigger.DISBURSEMENT_FAILED]: 20,
      [ManualTrigger.GREY_ZONE]: 15,
      [ManualTrigger.QUALITY_ISSUE]: 10,
    };

    triggers.forEach((trigger) => {
      score += triggerScores[trigger] || 0;
    });

    return score;
  }

  /**
   * Get manual review queue items (prioritized)
   */
  async getQueueItems(
    limit?: number,
    assignedTo?: string,
  ): Promise<ManualReviewQueueItemDto[]> {
    const queryBuilder = this.queueRepository
      .createQueryBuilder('item')
      .where('item.reviewCompletedAt IS NULL')
      .orderBy('item.priorityScore', 'DESC')
      .addOrderBy('item.createdAt', 'ASC');

    if (assignedTo) {
      queryBuilder.andWhere('item.assignedTo = :assignedTo', { assignedTo });
    } else {
      queryBuilder.andWhere('item.assignedTo IS NULL');
    }

    if (limit) {
      queryBuilder.limit(limit);
    }

    const items = await queryBuilder.getMany();

    return items.map((item) => ({
      id: item.id,
      entityId: item.entityId,
      processingType: item.processingType,
      triggers: item.triggers as ManualTrigger[],
      priority: item.priority as QueuePriority,
      priorityScore: item.priorityScore,
      createdAt: item.createdAt,
      assignedTo: item.assignedTo,
      reviewStartedAt: item.reviewStartedAt,
      reviewCompletedAt: item.reviewCompletedAt,
    }));
  }

  /**
   * Assign queue item to reviewer
   */
  async assignQueueItem(
    queueItemId: string,
    reviewerId: string,
  ): Promise<ManualReviewQueueItem> {
    const item = await this.queueRepository.findOne({
      where: { id: queueItemId },
    });

    if (!item) {
      throw new Error(`Queue item ${queueItemId} not found`);
    }

    item.assignedTo = reviewerId;
    item.reviewStartedAt = new Date();

    return await this.queueRepository.save(item);
  }

  /**
   * Complete queue item review
   */
  async completeQueueItem(queueItemId: string): Promise<ManualReviewQueueItem> {
    const item = await this.queueRepository.findOne({
      where: { id: queueItemId },
    });

    if (!item) {
      throw new Error(`Queue item ${queueItemId} not found`);
    }

    item.reviewCompletedAt = new Date();

    return await this.queueRepository.save(item);
  }

  /**
   * Check for items requiring escalation (>24 hours)
   */
  async checkEscalations(): Promise<ManualReviewQueueItem[]> {
    const twentyFourHoursAgo = new Date();
    twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

    const items = await this.queueRepository.find({
      where: {
        reviewCompletedAt: null,
        escalated: false,
      },
    });

    const itemsToEscalate = items.filter(
      (item) => item.createdAt < twentyFourHoursAgo,
    );

    // Mark as escalated
    for (const item of itemsToEscalate) {
      item.escalated = true;
      item.escalatedAt = new Date();
      await this.queueRepository.save(item);
    }

    return itemsToEscalate;
  }

  /**
   * Get queue statistics
   */
  async getQueueStatistics(): Promise<{
    total: number;
    unassigned: number;
    assigned: number;
    escalated: number;
    byPriority: Record<string, number>;
  }> {
    const allItems = await this.queueRepository.find({
      where: { reviewCompletedAt: null },
    });

    const unassigned = allItems.filter((item) => !item.assignedTo).length;
    const assigned = allItems.filter((item) => !!item.assignedTo).length;
    const escalated = allItems.filter((item) => item.escalated).length;

    const byPriority: Record<string, number> = {};
    allItems.forEach((item) => {
      byPriority[item.priority] = (byPriority[item.priority] || 0) + 1;
    });

    return {
      total: allItems.length,
      unassigned,
      assigned,
      escalated,
      byPriority,
    };
  }
}

