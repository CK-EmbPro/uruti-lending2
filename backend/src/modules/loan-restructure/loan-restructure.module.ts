import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LoanRestructureService } from './loan-restructure.service';
import { LoanRestructureController } from './loan-restructure.controller';
import { LoanRestructure } from './entities/loan-restructure.entity';
import { PaymentHoliday } from './entities/payment-holiday.entity';
import { RestructureAcknowledgment } from './entities/restructure-acknowledgment.entity';
import { Loan } from '../loan/entities/loan.entity';
import { LoanRepaymentSchedule } from '../loan/entities/loan-repayment-schedule.entity';
import { LoanDemand } from '../loan-demand/entities/loan-demand.entity';
import { LoanRepaymentModule } from '../loan-repayment/loan-repayment.module';
import { LoanBalanceAdjustmentModule } from '../loan-balance-adjustment/loan-balance-adjustment.module';
import { WorkflowModule } from '../workflow/workflow.module';
import { LoanModule } from '../loan/loan.module';
import { CalculationModule } from '../calculation/calculation.module';
import { PaymentHolidayTrackingService } from './services/payment-holiday-tracking.service';
import { RestructureValidationService } from './services/restructure-validation.service';
import { RestructureImpactAnalysisService } from './services/restructure-impact-analysis.service';
import { RestructureAcknowledgmentService } from './services/restructure-acknowledgment.service';
import { RestructureFeeService } from './services/restructure-fee.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      LoanRestructure,
      PaymentHoliday,
      RestructureAcknowledgment,
      Loan,
      LoanRepaymentSchedule,
      LoanDemand,
    ]),
    forwardRef(() => LoanRepaymentModule),
    forwardRef(() => LoanModule),
    CalculationModule,
    LoanBalanceAdjustmentModule,
    WorkflowModule,
  ],
  controllers: [LoanRestructureController],
  providers: [
    LoanRestructureService,
    PaymentHolidayTrackingService,
    RestructureValidationService,
    RestructureImpactAnalysisService,
    RestructureAcknowledgmentService,
    RestructureFeeService,
  ],
  exports: [
    LoanRestructureService,
    PaymentHolidayTrackingService,
    RestructureValidationService,
    RestructureImpactAnalysisService,
    RestructureAcknowledgmentService,
    RestructureFeeService,
  ],
})
export class LoanRestructureModule {}

