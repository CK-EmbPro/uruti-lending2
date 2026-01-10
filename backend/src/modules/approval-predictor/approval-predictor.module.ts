import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ApprovalPredictorService } from './services/approval-predictor.service';
import { ApprovalPredictorController } from './approval-predictor.controller';
import { LoanApplication } from '../loan-application/entities/loan-application.entity';
import { Loan } from '../loan/entities/loan.entity';
import { LoanProduct } from '../loan-product/entities/loan-product.entity';
import { CreditDecision } from '../credit-assessment/entities/credit-decision.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([LoanApplication, Loan, LoanProduct, CreditDecision]),
  ],
  controllers: [ApprovalPredictorController],
  providers: [ApprovalPredictorService],
  exports: [ApprovalPredictorService],
})
export class ApprovalPredictorModule {}

