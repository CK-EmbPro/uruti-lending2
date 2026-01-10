import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LoanDisbursementService } from './loan-disbursement.service';
import { LoanDisbursementController } from './loan-disbursement.controller';
import { LoanDisbursement } from './entities/loan-disbursement.entity';
import { Loan } from '../loan/entities/loan.entity';
import { LoanRepaymentSchedule } from '../loan/entities/loan-repayment-schedule.entity';
import { LoanSecurityShortfallModule } from '../loan-security-shortfall/loan-security-shortfall.module';
import { LoanSecurityAssignmentModule } from '../loan-security-assignment/loan-security-assignment.module';
import { LoanSecurityPriceModule } from '../loan-security-price/loan-security-price.module';
import { CalculationModule } from '../calculation/calculation.module';
import { LoanChargePostingModule } from '../loan-charge-posting/loan-charge-posting.module';
import { AccountingModule } from '../accounting/accounting.module';
import { NotificationModule } from '../notification/notification.module';
import { CurrencyModule } from '../currency/currency.module';
import { DisbursementIntegrationService } from './services/disbursement-integration.service';
import { EmailModule } from '../email/email.module';
import { QRCodeModule } from '../qrcode/qrcode.module';
import { PDFModule } from '../pdf/pdf.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      LoanDisbursement,
      Loan,
      LoanRepaymentSchedule,
    ]),
    LoanSecurityShortfallModule,
    LoanSecurityAssignmentModule,
    LoanSecurityPriceModule,
    CalculationModule,
    LoanChargePostingModule,
    AccountingModule,
    NotificationModule,
    CurrencyModule,
    EmailModule,
    QRCodeModule,
    PDFModule,
  ],
  controllers: [LoanDisbursementController],
  providers: [LoanDisbursementService, DisbursementIntegrationService],
  exports: [LoanDisbursementService],
})
export class LoanDisbursementModule {}

