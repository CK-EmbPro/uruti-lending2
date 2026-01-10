import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { AutoDisbursement } from './entities/auto-disbursement.entity';
import { STPMetric, ManualReviewQueueItem } from './entities/stp-metrics.entity';
import { AutoDisbursementService } from './services/auto-disbursement.service';
import { AutoRepaymentCaptureService } from './services/auto-repayment-capture.service';
import { STPTrackingService } from './services/stp-tracking.service';
import { QueueManagementService } from './services/queue-management.service';
import { AutoProcessingController } from './auto-processing.controller';
import { LoanDisbursementModule } from '../loan-disbursement/loan-disbursement.module';
import { LoanRepaymentModule } from '../loan-repayment/loan-repayment.module';
import { LoanModule } from '../loan/loan.module';
import { Loan } from '../loan/entities/loan.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      AutoDisbursement,
      STPMetric,
      ManualReviewQueueItem,
      Loan, // Add Loan entity for repository injection
    ]),
    ScheduleModule.forRoot(),
    LoanDisbursementModule,
    LoanRepaymentModule,
    LoanModule,
  ],
  controllers: [AutoProcessingController],
  providers: [
    AutoDisbursementService,
    AutoRepaymentCaptureService,
    STPTrackingService,
    QueueManagementService,
  ],
  exports: [
    AutoDisbursementService,
    AutoRepaymentCaptureService,
    STPTrackingService,
    QueueManagementService,
  ],
})
export class AutoProcessingModule {}

