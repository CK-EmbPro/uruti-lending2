import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { WeightedScoringRequest } from '../dto/weighted-scoring.dto';

/**
 * Service for managing scoring requests in a queue
 * Handles high-volume concurrent requests using Bull queue
 */
@Injectable()
export class ScoringQueueService {
  private readonly logger = new Logger(ScoringQueueService.name);

  constructor(
    @InjectQueue('scoring') private readonly scoringQueue: Queue,
  ) {}

  /**
   * Add scoring job to queue (async processing)
   */
  async queueScoringJob(
    request: WeightedScoringRequest,
    companyId: string,
    useML: boolean = true,
    segment?: 'MICRO' | 'SME' | 'ENTERPRISE',
  ): Promise<{ jobId: string; status: string }> {
    const job = await this.scoringQueue.add(
      'calculate-score',
      {
        request,
        companyId,
        useML,
        segment,
      },
      {
        attempts: 3, // Retry up to 3 times
        backoff: {
          type: 'exponential',
          delay: 2000, // 2 seconds initial delay
        },
        removeOnComplete: {
          age: 24 * 3600, // Keep completed jobs for 24 hours
          count: 1000, // Keep last 1000 completed jobs
        },
        removeOnFail: {
          age: 7 * 24 * 3600, // Keep failed jobs for 7 days
        },
      },
    );

    this.logger.log(`Queued scoring job ${job.id} for applicant ${request.applicantId}`);
    return {
      jobId: job.id.toString(),
      status: 'queued',
    };
  }

  /**
   * Get job status
   */
  async getJobStatus(jobId: string): Promise<{
    id: string;
    status: string;
    progress?: number;
    result?: any;
    error?: string;
  }> {
    const job = await this.scoringQueue.getJob(jobId);
    if (!job) {
      throw new Error(`Job ${jobId} not found`);
    }

    const state = await job.getState();
    const progress = job.progress();
    const result = job.returnvalue;
    const failedReason = job.failedReason;

    return {
      id: job.id.toString(),
      status: state,
      progress: typeof progress === 'number' ? progress : undefined,
      result,
      error: failedReason,
    };
  }

  /**
   * Get queue statistics
   */
  async getQueueStats(): Promise<{
    waiting: number;
    active: number;
    completed: number;
    failed: number;
    delayed: number;
  }> {
    const [waiting, active, completed, failed, delayed] = await Promise.all([
      this.scoringQueue.getWaitingCount(),
      this.scoringQueue.getActiveCount(),
      this.scoringQueue.getCompletedCount(),
      this.scoringQueue.getFailedCount(),
      this.scoringQueue.getDelayedCount(),
    ]);

    return {
      waiting,
      active,
      completed,
      failed,
      delayed,
    };
  }

  /**
   * Retry failed job
   */
  async retryJob(jobId: string): Promise<void> {
    const job = await this.scoringQueue.getJob(jobId);
    if (!job) {
      throw new Error(`Job ${jobId} not found`);
    }
    await job.retry();
    this.logger.log(`Retrying job ${jobId}`);
  }

  /**
   * Remove job from queue
   */
  async removeJob(jobId: string): Promise<void> {
    const job = await this.scoringQueue.getJob(jobId);
    if (!job) {
      throw new Error(`Job ${jobId} not found`);
    }
    await job.remove();
    this.logger.log(`Removed job ${jobId}`);
  }

  /**
   * Clean completed jobs
   */
  async cleanCompletedJobs(grace: number = 24 * 3600 * 1000): Promise<number> {
    const cleaned = await this.scoringQueue.clean(grace, 'completed');
    return Array.isArray(cleaned) ? cleaned.length : 0;
  }

  /**
   * Clean failed jobs
   */
  async cleanFailedJobs(grace: number = 7 * 24 * 3600 * 1000): Promise<number> {
    const cleaned = await this.scoringQueue.clean(grace, 'failed');
    return Array.isArray(cleaned) ? cleaned.length : 0;
  }
}

