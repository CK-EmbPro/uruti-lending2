import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaymentProcessingController } from './payment-processing.controller';
import { PaymentReminderService } from './services/payment-reminder.service';
import { AutopayService } from './services/autopay.service';
import { PaymentReversalService } from './services/payment-reversal.service';
import { PartialPaymentService } from './services/partial-payment.service';
import { PaymentAllocationService } from './services/payment-allocation.service';
import { PaymentReminder } from './entities/payment-reminder.entity';
import { AutopayEnrollment } from './entities/autopay-enrollment.entity';
import { PaymentReversal } from './entities/payment-reversal.entity';
import { PartialPayment } from './entities/partial-payment.entity';
import { PaymentAllocation } from './entities/payment-allocation.entity';
import { Loan } from '../loan/entities/loan.entity';
import { LoanRepayment } from '../loan-repayment/entities/loan-repayment.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      PaymentReminder,
      AutopayEnrollment,
      PaymentReversal,
      PartialPayment,
      PaymentAllocation,
      Loan,
      LoanRepayment,
    ]),
  ],
  controllers: [PaymentProcessingController],
  providers: [
    PaymentReminderService,
    AutopayService,
    PaymentReversalService,
    PartialPaymentService,
    PaymentAllocationService,
  ],
  exports: [
    PaymentReminderService,
    AutopayService,
    PaymentReversalService,
    PartialPaymentService,
    PaymentAllocationService,
  ],
})
export class PaymentProcessingModule {}

