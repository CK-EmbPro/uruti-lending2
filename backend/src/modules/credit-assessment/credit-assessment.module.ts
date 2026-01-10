import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CreditAssessmentController } from './credit-assessment.controller';
import { CreditScoringService } from './services/credit-scoring.service';
import { UnderwritingService } from './services/underwriting.service';
import { DecisionOverrideService } from './services/decision-override.service';
import { OverrideApprovalService } from './services/override-approval.service';
import { OverrideAuditService } from './services/override-audit.service';
import { OverridePerformanceService } from './services/override-performance.service';
import { FraudDetectionService } from './services/fraud-detection.service';
import { AdvancedFraudDetectionService } from './services/advanced-fraud-detection.service';
import { AdverseActionService } from './services/adverse-action.service';
import { AutoApprovalService } from './services/auto-approval.service';
import { CreditDecision } from './entities/credit-decision.entity';
import { UnderwritingReview } from './entities/underwriting-review.entity';
import { FraudAlert } from './entities/fraud-alert.entity';
import { FraudScore } from './entities/fraud-score.entity';
import { FraudCase } from './entities/fraud-case.entity';
import { AdverseActionNotice } from './entities/adverse-action-notice.entity';
import { OverrideApproval } from './entities/override-approval.entity';
import { OverrideAudit } from './entities/override-audit.entity';
import { OverridePerformanceReport } from './entities/override-performance-report.entity';
import { LoanApplication } from '../loan-application/entities/loan-application.entity';
import { LoanProduct } from '../loan-product/entities/loan-product.entity';
import { Loan } from '../loan/entities/loan.entity';
import { CreditScoringEngineModule } from '../credit-scoring-engine/credit-scoring-engine.module';
import { ComplianceModule } from '../compliance/compliance.module';
import { FraudDetectionModule } from '../fraud-detection/fraud-detection.module';
// FraudDetectionModule exports all fraud detection services including:
// - FraudDetectionService
// - IdentityDuplicationDetectionService
// - DocumentForgeryDetectionService
// - BehavioralAnomalyDetectionService
import { AutoProcessingModule } from '../auto-processing/auto-processing.module';
import { AIModule } from '../ai/ai.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      CreditDecision,
      UnderwritingReview,
      FraudAlert,
      FraudScore,
      FraudCase,
      AdverseActionNotice,
      OverrideApproval,
      OverrideAudit,
      OverridePerformanceReport,
      LoanApplication,
      LoanProduct,
      Loan,
    ]),
    CreditScoringEngineModule,
    ComplianceModule,
    FraudDetectionModule,
    AutoProcessingModule, // For STPTrackingService
    AIModule,
  ],
  controllers: [CreditAssessmentController],
  providers: [
    CreditScoringService,
    UnderwritingService,
    DecisionOverrideService,
    OverrideApprovalService,
    OverrideAuditService,
    OverridePerformanceService,
    FraudDetectionService,
    AdvancedFraudDetectionService,
    AdverseActionService,
    AutoApprovalService,
  ],
  exports: [
    CreditScoringService,
    UnderwritingService,
    DecisionOverrideService,
    OverrideApprovalService,
    OverrideAuditService,
    OverridePerformanceService,
    FraudDetectionService,
    AdvancedFraudDetectionService,
    AdverseActionService,
    AutoApprovalService,
  ],
})
export class CreditAssessmentModule {}

