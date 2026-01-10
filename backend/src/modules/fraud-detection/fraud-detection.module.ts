import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { FraudDetectionService } from './services/fraud-detection.service';
import { IdentityDuplicationDetectionService } from './services/identity-duplication-detection.service';
import { DocumentForgeryDetectionService } from './services/document-forgery-detection.service';
import { BehavioralAnomalyDetectionService } from './services/behavioral-anomaly-detection.service';
import { FraudDetectionController } from './fraud-detection.controller';
import { LoanApplication } from '../loan-application/entities/loan-application.entity';
import { FraudCheck } from './entities/fraud-check.entity';
import { IdentityDuplicationCheck } from './entities/identity-duplication-check.entity';
import { DocumentForgeryCheck } from './entities/document-forgery-check.entity';
import { BehavioralAnomalyCheck } from './entities/behavioral-anomaly-check.entity';
import { ForgeryTemplate } from './entities/forgery-template.entity';
import { NetworkRelationship } from './entities/network-relationship.entity';
import { NetworkCluster } from './entities/network-cluster.entity';
import { FraudInvestigationCase } from './entities/fraud-investigation-case.entity';
import { NetworkFraudDetectionService } from './services/network-fraud-detection.service';
import { FraudInvestigationCaseService } from './services/fraud-investigation-case.service';
import { FraudPerformanceMonitorService } from './services/fraud-performance-monitor.service';
import { FraudBatchAnalysisService } from './services/fraud-batch-analysis.service';
import { FraudModelRetrainingService } from './services/fraud-model-retraining.service';
import { Loan } from '../loan/entities/loan.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      LoanApplication,
      FraudCheck,
      IdentityDuplicationCheck,
      DocumentForgeryCheck,
      BehavioralAnomalyCheck,
      ForgeryTemplate,
      NetworkRelationship,
      NetworkCluster,
      FraudInvestigationCase,
      Loan,
    ]),
    ConfigModule,
    ScheduleModule.forRoot(), // For cron jobs
  ],
  controllers: [FraudDetectionController],
  providers: [
    FraudDetectionService,
    IdentityDuplicationDetectionService,
    DocumentForgeryDetectionService,
    BehavioralAnomalyDetectionService,
    NetworkFraudDetectionService,
    FraudInvestigationCaseService,
    FraudPerformanceMonitorService,
    FraudBatchAnalysisService,
    FraudModelRetrainingService,
  ],
  exports: [
    FraudDetectionService,
    IdentityDuplicationDetectionService,
    DocumentForgeryDetectionService,
    BehavioralAnomalyDetectionService,
    NetworkFraudDetectionService,
    FraudInvestigationCaseService,
    FraudPerformanceMonitorService,
    FraudBatchAnalysisService,
    FraudModelRetrainingService,
  ],
})
export class FraudDetectionModule {}

