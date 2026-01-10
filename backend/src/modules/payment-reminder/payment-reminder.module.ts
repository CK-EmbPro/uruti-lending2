import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaymentReminder } from './entities/payment-reminder.entity';
import { LoanRepaymentSchedule } from '../loan/entities/loan-repayment-schedule.entity';
import { Loan } from '../loan/entities/loan.entity';
import { PaymentReminderService } from './services/payment-reminder.service';
import { PaymentReminderIntegrationService } from './services/payment-reminder-integration.service';
import { PaymentReminderController } from './payment-reminder.controller';
import { NotificationModule } from '../notification/notification.module';
import { EmailModule } from '../email/email.module';
import { QRCodeModule } from '../qrcode/qrcode.module';
import { PDFModule } from '../pdf/pdf.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([PaymentReminder, LoanRepaymentSchedule, Loan]),
    NotificationModule,
    EmailModule,
    QRCodeModule,
    PDFModule,
  ],
  controllers: [PaymentReminderController],
  providers: [PaymentReminderService, PaymentReminderIntegrationService],
  exports: [PaymentReminderService],
})
export class PaymentReminderModule {}

