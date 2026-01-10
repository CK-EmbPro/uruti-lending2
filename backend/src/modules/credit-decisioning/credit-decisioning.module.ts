import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CreditDecisioningService } from './services/credit-decisioning.service';
import { TierBasedDecisioningService } from './services/tier-based-decisioning.service';
import { CreditDecisioningController } from './credit-decisioning.controller';
import { LoanApplication } from '../loan-application/entities/loan-application.entity';
import { Loan } from '../loan/entities/loan.entity';
import { LoanProduct } from '../loan-product/entities/loan-product.entity';
import { CreditScoringEngineModule } from '../credit-scoring-engine/credit-scoring-engine.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([LoanApplication, Loan, LoanProduct]),
    forwardRef(() => CreditScoringEngineModule),
  ],
  controllers: [CreditDecisioningController],
  providers: [CreditDecisioningService, TierBasedDecisioningService],
  exports: [CreditDecisioningService, TierBasedDecisioningService],
})
export class CreditDecisioningModule {}

