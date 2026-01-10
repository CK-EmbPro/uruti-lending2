import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LoanServicingService } from './services/loan-servicing.service';
import { LoanServicingController } from './loan-servicing.controller';
import { ServicingTask } from './entities/servicing-task.entity';
import { AutoEscalationRule } from './entities/auto-escalation-rule.entity';
import { PaymentRetryLog } from './entities/payment-retry-log.entity';
import { Loan } from '../loan/entities/loan.entity';
import { LoanRepayment } from '../loan-repayment/entities/loan-repayment.entity';
import { LoanRepaymentSchedule } from '../loan/entities/loan-repayment-schedule.entity';

import { AuthModule } from '../auth/auth.module';
@Module({
  imports: [
    TypeOrmModule.forFeature([
      ServicingTask,
      AutoEscalationRule,
      PaymentRetryLog,
      Loan,
      LoanRepayment,
      LoanRepaymentSchedule,
    ]),
      AuthModule,
],
  controllers: [LoanServicingController],
  providers: [LoanServicingService],
  exports: [LoanServicingService],
})
export class LoanServicingModule {}

