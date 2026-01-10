import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LoanService } from './loan.service';
import { LoanController } from './loan.controller';
import { Loan } from './entities/loan.entity';
import { LoanRepaymentSchedule } from './entities/loan-repayment-schedule.entity';
import { LoanProduct } from '../loan-product/entities/loan-product.entity';
import { CalculationModule } from '../calculation/calculation.module';
import { LoanWriteOffModule } from '../loan-write-off/loan-write-off.module';
import { LoanRefundModule } from '../loan-refund/loan-refund.module';
import { LoanTransferModule } from '../loan-transfer/loan-transfer.module';
import { WorkflowModule } from '../workflow/workflow.module';
import { LoanPartnerModule } from '../loan-partner/loan-partner.module';
import { BpiCalculationService } from './services/bpi-calculation.service';
import { LoanDemand } from '../loan-demand/entities/loan-demand.entity';
import { NotificationModule } from '../notification/notification.module';
import { IntegrationModule } from '../integration/integration.module';
import { LoanCalculatorModule } from '../loan-calculator/loan-calculator.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Loan,
      LoanRepaymentSchedule,
      LoanProduct,
      LoanDemand,
    ]),
    CalculationModule,
    LoanWriteOffModule,
    LoanRefundModule,
    LoanTransferModule,
    WorkflowModule,
    LoanPartnerModule,
    NotificationModule,
    forwardRef(() => IntegrationModule),
    LoanCalculatorModule, // Import to use RepaymentStructureService
    AuthModule,
  ],
  controllers: [LoanController],
  providers: [LoanService, BpiCalculationService],
  exports: [LoanService, BpiCalculationService],
})
export class LoanModule {}

