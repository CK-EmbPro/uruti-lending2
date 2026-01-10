import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { WeightedCreditScoringService } from './services/weighted-credit-scoring.service';
import { MLScoringService } from './services/ml-scoring.service';
import { MLModelTrainingService } from './services/ml-model-training.service';
import { MLSeedDataGeneratorService } from './services/ml-seed-data-generator.service';
import { ScoringHistoryService } from './services/scoring-history.service';
import { ScoringEventListenerService } from './services/scoring-event-listener.service';
import { ScoringSchedulerService } from './services/scoring-scheduler.service';
import { RiskTierService } from './services/risk-tier.service';
import { ScoringCacheService } from './services/scoring-cache.service';
import { PerformanceMonitorService } from './services/performance-monitor.service';
import { ScoringQueueService } from './services/scoring-queue.service';
import { ExplainabilityService } from './services/explainability.service';
import { ScoringProcessor } from './processors/scoring.processor';
import { CreditScoringEngineController } from './credit-scoring-engine.controller';
import { CreditScoreHistory } from './entities/credit-score-history.entity';
import { RiskTierConfig } from './entities/risk-tier-config.entity';
import { PerformanceMetric } from './entities/performance-metric.entity';
import { Loan } from '../loan/entities/loan.entity';
import { LoanApplication } from '../loan-application/entities/loan-application.entity';
import { CreditBureauModule } from '../credit-bureau/credit-bureau.module';
import { AlternativeCreditScoringModule } from '../alternative-credit-scoring/alternative-credit-scoring.module';
import { AIModule } from '../ai/ai.module';
import { AdvancedAIModule } from '../advanced-ai/advanced-ai.module';
import { BullModule } from '@nestjs/bull';
import { CacheModule } from '@nestjs/cache-manager';

import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([CreditScoreHistory, RiskTierConfig, PerformanceMetric, Loan, LoanApplication]),
    AuthModule,
    BullModule.registerQueue({
      name: 'scoring',
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
        removeOnComplete: {
          age: 24 * 3600, // 24 hours
          count: 1000, // Keep last 1000
        },
        removeOnFail: {
          age: 7 * 24 * 3600, // 7 days
        },
      },
    }),
    CacheModule.register(),
    forwardRef(() => CreditBureauModule),
    forwardRef(() => AlternativeCreditScoringModule),
    forwardRef(() => AIModule),
    forwardRef(() => AdvancedAIModule),
  ],
  controllers: [CreditScoringEngineController],
  providers: [
    WeightedCreditScoringService,
    MLScoringService,
    MLModelTrainingService,
    MLSeedDataGeneratorService,
    ScoringHistoryService,
    ScoringEventListenerService,
    ScoringSchedulerService,
    RiskTierService,
    ScoringCacheService,
    PerformanceMonitorService,
    ScoringQueueService,
    ExplainabilityService,
    ScoringProcessor,
  ],
  exports: [
    WeightedCreditScoringService,
    MLScoringService,
    MLModelTrainingService,
    MLSeedDataGeneratorService,
    ScoringHistoryService,
    ScoringEventListenerService,
    RiskTierService,
    ScoringCacheService,
    PerformanceMonitorService,
    ScoringQueueService,
    ExplainabilityService,
  ],
})
export class CreditScoringEngineModule {}

