import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { DocumentForgeryCheck, ForgeryReviewStatus } from '../entities/document-forgery-check.entity';
import { FraudInvestigationCase, InvestigationStatus } from '../entities/fraud-investigation-case.entity';

@Injectable()
export class FraudModelRetrainingService {
  private readonly logger = new Logger(FraudModelRetrainingService.name);

  constructor(
    @InjectRepository(DocumentForgeryCheck)
    private readonly forgeryCheckRepository: Repository<DocumentForgeryCheck>,
    @InjectRepository(FraudInvestigationCase)
    private readonly investigationCaseRepository: Repository<FraudInvestigationCase>,
  ) {}

  /**
   * Monthly model retraining (runs on 1st of each month)
   */
  @Cron('0 2 1 * *') // 2 AM on 1st of each month
  async retrainModels(): Promise<void> {
    this.logger.log('Starting monthly model retraining...');
    const startTime = Date.now();

    try {
      // Get last month's data
      const endDate = new Date();
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - 1);

      // 1. Collect confirmed fraud cases
      const confirmedFraudCases = await this.investigationCaseRepository.find({
        where: {
          createdAt: Between(startDate, endDate),
          status: InvestigationStatus.RESOLVED,
          // In production, would filter for confirmed fraud cases
        },
      });

      // 2. Collect confirmed forgery cases
      const confirmedForgeryCases = await this.forgeryCheckRepository.find({
        where: {
          createdAt: Between(startDate, endDate),
          reviewStatus: ForgeryReviewStatus.CONFIRMED_FRAUD,
        },
      });

      // 3. Collect false positive cases
      const falsePositiveCases = await this.forgeryCheckRepository.find({
        where: {
          createdAt: Between(startDate, endDate),
          reviewStatus: ForgeryReviewStatus.FALSE_POSITIVE,
        },
      });

      this.logger.log(
        `Collected training data: ${confirmedFraudCases.length} fraud cases, ${confirmedForgeryCases.length} forgery cases, ${falsePositiveCases.length} false positives`,
      );

      // 4. Prepare training dataset
      const trainingData = {
        positive: [
          ...confirmedFraudCases.map((c) => ({
            type: 'investigation',
            caseId: c.id,
            applicationIds: c.applicationIds,
            features: this.extractFeatures(c),
            label: 'fraud',
          })),
          ...confirmedForgeryCases.map((c) => ({
            type: 'forgery',
            checkId: c.id,
            documentId: c.documentId,
            features: this.extractForgeryFeatures(c),
            label: 'fraud',
          })),
        ],
        negative: falsePositiveCases.map((c) => ({
          type: 'forgery',
          checkId: c.id,
          documentId: c.documentId,
          features: this.extractForgeryFeatures(c),
          label: 'not_fraud',
        })),
      };

      // 5. Train models (in production, would call ML service)
      this.logger.log('Training models with collected data...');
      await this.trainModels(trainingData);

      const duration = Date.now() - startTime;
      this.logger.log(`Model retraining completed in ${duration}ms`);
    } catch (error) {
      this.logger.error(`Model retraining failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Extract features from investigation case
   */
  private extractFeatures(case_: FraudInvestigationCase): Record<string, any> {
    return {
      clusterSize: case_.applicationIds?.length || 0,
      totalAmount: case_.totalAmount || 0,
      escalationLevel: case_.escalationLevel,
      evidenceCount:
        (case_.evidence?.screenshots?.length || 0) +
        (case_.evidence?.recordings?.length || 0) +
        (case_.evidence?.documents?.length || 0),
    };
  }

  /**
   * Extract features from forgery check
   */
  private extractForgeryFeatures(check: DocumentForgeryCheck): Record<string, any> {
    return {
      fontAnalysisRisk: check.fontAnalysis?.riskScore || 0,
      metadataAnalysisRisk: check.metadataAnalysis?.riskScore || 0,
      imageForensicsRisk: check.imageForensics?.riskScore || 0,
      templateMatchRisk: check.templateMatch?.riskScore || 0,
      overallRiskScore: check.overallRiskScore || 0,
    };
  }

  /**
   * Train models (placeholder - in production would call ML service)
   */
  private async trainModels(trainingData: any): Promise<void> {
    // In production, this would:
    // 1. Send training data to ML service
    // 2. Train fraud detection models
    // 3. Validate model performance
    // 4. Deploy new models if performance improved

    this.logger.log(
      `Training models with ${trainingData.positive.length} positive and ${trainingData.negative.length} negative samples`,
    );

    // Simulate training time
    await new Promise((resolve) => setTimeout(resolve, 1000));

    this.logger.log('Models trained successfully');
  }

  /**
   * Manual trigger for model retraining
   */
  async triggerRetraining(): Promise<void> {
    this.logger.log('Manual model retraining triggered');
    await this.retrainModels();
  }
}

