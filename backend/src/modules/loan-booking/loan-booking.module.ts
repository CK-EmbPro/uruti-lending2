import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LoanBookingController } from './loan-booking.controller';
import { LoanBookingService } from './services/loan-booking.service';
import { RateLockService } from './services/rate-lock.service';
import { DisbursementWorkflowService } from './services/disbursement-workflow.service';
import { LoanBooking } from './entities/loan-booking.entity';
import { LoanDocument } from './entities/loan-document.entity';
import { LoanSignature } from './entities/loan-signature.entity';
import { RateLock } from './entities/rate-lock.entity';
import { Loan } from '../loan/entities/loan.entity';
import { LoanApplication } from '../loan-application/entities/loan-application.entity';
import { LoanDisbursement } from '../loan-disbursement/entities/loan-disbursement.entity';
import { LoanProduct } from '../loan-product/entities/loan-product.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      LoanBooking,
      LoanDocument,
      LoanSignature,
      RateLock,
      Loan,
      LoanApplication,
      LoanDisbursement,
      LoanProduct,
    ]),
  ],
  controllers: [LoanBookingController],
  providers: [
    LoanBookingService,
    RateLockService,
    DisbursementWorkflowService,
  ],
  exports: [
    LoanBookingService,
    RateLockService,
    DisbursementWorkflowService,
  ],
})
export class LoanBookingModule {}

