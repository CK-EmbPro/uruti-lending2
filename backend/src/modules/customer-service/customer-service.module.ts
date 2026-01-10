import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CustomerServiceController } from './customer-service.controller';
import { CustomerServiceService } from './services/customer-service.service';
import { Loan } from '../loan/entities/loan.entity';
import { LoanRepaymentSchedule } from '../loan/entities/loan-repayment-schedule.entity';
import { PaymentExtension } from './entities/payment-extension.entity';
import { Dispute } from './entities/dispute.entity';
import { DisputeResolution } from './entities/dispute-resolution.entity';
import { AccountUpdate } from './entities/account-update.entity';
import { FeeWaiver } from './entities/fee-waiver.entity';

import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Loan,
      LoanRepaymentSchedule,
      PaymentExtension,
      Dispute,
      DisputeResolution,
      AccountUpdate,
      FeeWaiver,
    ]),
    AuthModule,
  ],
  controllers: [CustomerServiceController],
  providers: [CustomerServiceService],
  exports: [CustomerServiceService],
})
export class CustomerServiceModule {}

