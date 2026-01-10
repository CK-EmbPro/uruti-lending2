import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FastDecisionController } from './fast-decision.controller';
import { FastDecisionService } from './services/fast-decision.service';
import { DecisionProgress } from './entities/decision-progress.entity';
import { LoanProduct } from '../loan-product/entities/loan-product.entity';
import { AIModule } from '../ai/ai.module';
import { ComplianceModule } from '../compliance/compliance.module';
import { CreditScoringEngineModule } from '../credit-scoring-engine/credit-scoring-engine.module';
import { LoanApplicationModule } from '../loan-application/loan-application.module';
import { NotificationModule } from '../notification/notification.module';
import { CreditAssessmentModule } from '../credit-assessment/credit-assessment.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([DecisionProgress, LoanProduct]),
    AIModule,
    ComplianceModule,
    CreditScoringEngineModule,
    LoanApplicationModule,
    NotificationModule,
    CreditAssessmentModule,
    AuthModule,
  ],
  controllers: [FastDecisionController],
  providers: [FastDecisionService],
  exports: [FastDecisionService],
})
export class FastDecisionModule {}

