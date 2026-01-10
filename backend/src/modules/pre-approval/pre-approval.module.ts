import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PreApprovalService } from './services/pre-approval.service';
import { PreApprovalController } from './pre-approval.controller';
import { PreApproval } from './entities/pre-approval.entity';
import { LoanProduct } from '../loan-product/entities/loan-product.entity';
import { LoanApplication } from '../loan-application/entities/loan-application.entity';
import { ApprovalPredictorModule } from '../approval-predictor/approval-predictor.module';
import { FinancialHealthModule } from '../financial-health/financial-health.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([PreApproval, LoanProduct, LoanApplication]),
    forwardRef(() => ApprovalPredictorModule),
    forwardRef(() => FinancialHealthModule),
  ],
  controllers: [PreApprovalController],
  providers: [PreApprovalService],
  exports: [PreApprovalService],
})
export class PreApprovalModule {}

