import { Processor, Process } from '@nestjs/bull';
import { Job } from 'bull';
import { Logger } from '@nestjs/common';
import { WeightedCreditScoringService } from '../services/weighted-credit-scoring.service';
import { WeightedScoringRequest } from '../dto/weighted-scoring.dto';

/**
 * Bull processor for async credit scoring jobs
 * Handles high-volume concurrent scoring requests
 */
@Processor('scoring')
export class ScoringProcessor {
  private readonly logger = new Logger(ScoringProcessor.name);

  constructor(
    private readonly weightedScoringService: WeightedCreditScoringService,
  ) {}

  @Process('calculate-score')
  async handleScoringJob(job: Job<{
    request: WeightedScoringRequest;
    companyId: string;
    useML: boolean;
    segment?: 'MICRO' | 'SME' | 'ENTERPRISE';
  }>) {
    const { request, companyId, useML, segment } = job.data;
    this.logger.log(`Processing scoring job ${job.id} for applicant ${request.applicantId}`);

    try {
      // Update job progress
      await job.progress(10);

      // Calculate score
      const result = await this.weightedScoringService.calculateWeightedScore(
        request,
        companyId,
        useML,
        segment,
      );

      await job.progress(100);

      this.logger.log(`Completed scoring job ${job.id} - Score: ${result.finalScore}`);
      return result;
    } catch (error) {
      this.logger.error(`Scoring job ${job.id} failed: ${error.message}`, error.stack);
      throw error; // Will trigger retry if configured
    }
  }
}

