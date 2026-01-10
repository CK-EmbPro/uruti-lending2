import {
  Injectable,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan, Between } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ManualReviewQueueItem } from '../entities/stp-metrics.entity';
import { STPTrackingService } from './stp-tracking.service';
import { QueuePriority, SLAMetricsDto } from '../dto/stp-tracking.dto';

const MANUAL_REVIEW_SLA_MS = 2 * 60 * 60 * 1000; // 2 hours
const BUSINESS_HOURS_START = 9; // 9 AM
const BUSINESS_HOURS_END = 17; // 5 PM

@Injectable()
export class QueueManagementService {
  private readonly logger = new Logger(QueueManagementService.name);

  constructor(
    @InjectRepository(ManualReviewQueueItem)
    private readonly queueRepository: Repository<ManualReviewQueueItem>,
    private readonly stpTrackingService: STPTrackingService,
  ) {}

  /**
   * Calculate SLA metrics for manual reviews
   */
  async calculateSLAMetrics(
    startDate: Date,
    endDate: Date,
  ): Promise<SLAMetricsDto> {
    const items = await this.queueRepository.find({
      where: {
        reviewCompletedAt: Between(startDate, endDate),
      },
    });

    // Filter to business hours only
    const businessHoursItems = items.filter((item) => {
      if (!item.reviewStartedAt || !item.reviewCompletedAt) {
        return false;
      }

      const startHour = item.reviewStartedAt.getHours();
      const endHour = item.reviewCompletedAt.getHours();

      return (
        startHour >= BUSINESS_HOURS_START &&
        startHour < BUSINESS_HOURS_END &&
        endHour >= BUSINESS_HOURS_START &&
        endHour < BUSINESS_HOURS_END
      );
    });

    const totalReviews = businessHoursItems.length;
    const withinSLA = businessHoursItems.filter((item) => {
      if (!item.reviewStartedAt || !item.reviewCompletedAt) {
        return false;
      }

      const reviewTimeMs =
        item.reviewCompletedAt.getTime() - item.reviewStartedAt.getTime();
      return reviewTimeMs <= MANUAL_REVIEW_SLA_MS;
    }).length;

    const complianceRate =
      totalReviews > 0 ? (withinSLA / totalReviews) * 100 : 100;

    const totalReviewTime = businessHoursItems.reduce((sum, item) => {
      if (!item.reviewStartedAt || !item.reviewCompletedAt) {
        return sum;
      }
      return (
        sum +
        (item.reviewCompletedAt.getTime() - item.reviewStartedAt.getTime())
      );
    }, 0);

    const averageReviewTime =
      totalReviews > 0 ? totalReviewTime / totalReviews / (1000 * 60) : 0; // Convert to minutes

    return {
      totalReviews,
      withinSLA,
      complianceRate: parseFloat(complianceRate.toFixed(2)),
      averageReviewTime: parseFloat(averageReviewTime.toFixed(2)),
      period: { start: startDate, end: endDate },
    };
  }

  /**
   * Check overnight processing - queue should be cleared by 9 AM
   */
  @Cron(CronExpression.EVERY_DAY_AT_9AM)
  async checkOvernightProcessing(): Promise<void> {
    this.logger.log('Checking overnight queue processing...');

    const now = new Date();
    const nineAM = new Date(now);
    nineAM.setHours(9, 0, 0, 0);

    // Check if current time is after 9 AM
    if (now < nineAM) {
      return;
    }

    const queueStats = await this.stpTrackingService.getQueueStatistics();

    if (queueStats.total > 0) {
      this.logger.warn(
        `Queue not cleared by 9 AM. Remaining items: ${queueStats.total}`,
      );
      // Could send alert here
    } else {
      this.logger.log('Queue cleared successfully by 9 AM');
    }
  }

  /**
   * Process overnight queue (runs before 9 AM)
   */
  @Cron('0 8 * * *') // 8 AM daily
  async processOvernightQueue(): Promise<void> {
    this.logger.log('Processing overnight queue...');

    // Get all unassigned items
    const unassignedItems = await this.queueRepository.find({
      where: {
        assignedTo: null,
        reviewCompletedAt: null,
      },
      order: {
        priorityScore: 'DESC',
        createdAt: 'ASC',
      },
    });

    // Auto-assign high-priority items to available reviewers
    // In production, this would integrate with user management
    const highPriorityItems = unassignedItems.filter(
      (item) => item.priority === QueuePriority.URGENT || item.priority === QueuePriority.HIGH,
    );

    this.logger.log(
      `Found ${unassignedItems.length} unassigned items, ${highPriorityItems.length} high priority`,
    );

    // Could implement auto-assignment logic here
    // For now, just log
  }

  /**
   * Check and escalate items >24 hours
   */
  @Cron(CronExpression.EVERY_HOUR)
  async checkEscalations(): Promise<void> {
    const escalatedItems = await this.stpTrackingService.checkEscalations();

    if (escalatedItems.length > 0) {
      this.logger.warn(
        `Escalated ${escalatedItems.length} items that are >24 hours old`,
      );
      // Could send alerts to managers here
    }
  }

  /**
   * Get queue dashboard data
   */
  async getQueueDashboard(): Promise<{
    queueStats: any;
    slaMetrics: SLAMetricsDto;
    recentEscalations: number;
  }> {
    const queueStats = await this.stpTrackingService.getQueueStatistics();

    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 7); // Last 7 days

    const slaMetrics = await this.calculateSLAMetrics(startDate, endDate);

    const escalatedItems = await this.queueRepository.find({
      where: {
        escalated: true,
        reviewCompletedAt: null,
      },
    });

    return {
      queueStats,
      slaMetrics,
      recentEscalations: escalatedItems.length,
    };
  }
}

