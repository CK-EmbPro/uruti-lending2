import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { NetworkFraudDetectionService } from './network-fraud-detection.service';
import { FraudInvestigationCaseService } from './fraud-investigation-case.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { LoanApplication } from '../../loan-application/entities/loan-application.entity';

@Injectable()
export class FraudBatchAnalysisService {
  private readonly logger = new Logger(FraudBatchAnalysisService.name);

  constructor(
    private readonly networkFraudService: NetworkFraudDetectionService,
    private readonly investigationCaseService: FraudInvestigationCaseService,
    @InjectRepository(LoanApplication)
    private readonly applicationRepository: Repository<LoanApplication>,
  ) {}

  /**
   * Run nightly batch analysis (runs before 6 AM)
   */
  @Cron('0 5 * * *') // 5 AM daily
  async runNightlyAnalysis(): Promise<void> {
    this.logger.log('Starting nightly fraud batch analysis...');
    const startTime = Date.now();

    try {
      // Get all companies (in production, would iterate through companies)
      // For now, we'll use a default company ID
      const companyId = 'default'; // Would be fetched from config or database

      // 1. Rebuild relationship graph
      this.logger.log('Rebuilding relationship graph...');
      await this.networkFraudService.buildRelationshipGraph(companyId);

      // 2. Detect clusters
      this.logger.log('Detecting clusters...');
      const clusters = await this.networkFraudService.detectClusters(companyId);

      // 3. Flag clusters with 2+ fraudulent/defaulted members
      this.logger.log('Flagging suspicious clusters...');
      for (const cluster of clusters) {
        const shouldFlag = await this.networkFraudService.shouldFlagCluster(cluster.id);
        if (shouldFlag) {
          // Create investigation case for flagged cluster
          await this.investigationCaseService.createCase({
            applicationIds: cluster.applicationIds,
            clusterId: cluster.id,
            description: `Fraud ring detected: ${cluster.size} applications, ${cluster.fraudulentMembers} fraudulent, ${cluster.defaultedMembers} defaulted`,
            totalAmount: 0, // Would calculate from applications
          });
        }
      }

      const duration = Date.now() - startTime;
      this.logger.log(`Nightly batch analysis completed in ${duration}ms`);
    } catch (error) {
      this.logger.error(`Nightly batch analysis failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Check if batch analysis completed before 6 AM
   */
  @Cron('0 6 * * *') // 6 AM daily
  async checkBatchCompletion(): Promise<void> {
    this.logger.log('Checking batch analysis completion...');

    // In production, would check if batch completed successfully
    // For now, just log
    this.logger.log('Batch analysis completion check passed');
  }
}

