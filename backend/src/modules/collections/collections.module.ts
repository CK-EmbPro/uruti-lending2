import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CollectionsController } from './collections.controller';
import { CollectionsService } from './services/collections.service';
import { Loan } from '../loan/entities/loan.entity';
import { LoanRepaymentSchedule } from '../loan/entities/loan-repayment-schedule.entity';
import { DelinquencyRecord } from './entities/delinquency-record.entity';
import { LateFee } from './entities/late-fee.entity';
import { CreditBureauUpdate } from './entities/credit-bureau-update.entity';
import { CollectionNotice } from './entities/collection-notice.entity';
import { CollectionWorkflow } from './entities/collection-workflow.entity';
import { CollectionActivity } from './entities/collection-activity.entity';
import { PromiseToPay } from './entities/promise-to-pay.entity';
import { PaymentArrangement } from './entities/payment-arrangement.entity';
import { ArrangementCompliance } from './entities/arrangement-compliance.entity';
import { SkipTrace } from './entities/skip-trace.entity';
import { LegalAction } from './entities/legal-action.entity';
import { Lawsuit } from './entities/lawsuit.entity';
import { Judgment } from './entities/judgment.entity';
import { CollectionAgency } from './entities/collection-agency.entity';
import { ThirdPartyPlacement } from './entities/third-party-placement.entity';
import { NotificationModule } from '../notification/notification.module';
import { CollectionsIntegrationService } from './services/collections-integration.service';
import { EmailModule } from '../email/email.module';
import { QRCodeModule } from '../qrcode/qrcode.module';
import { PDFModule } from '../pdf/pdf.module';
import { ExcelModule } from '../excel/excel.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Loan,
      LoanRepaymentSchedule,
      DelinquencyRecord,
      LateFee,
      CreditBureauUpdate,
      CollectionNotice,
      CollectionWorkflow,
      CollectionActivity,
      PromiseToPay,
      PaymentArrangement,
      ArrangementCompliance,
      SkipTrace,
      LegalAction,
      Lawsuit,
      Judgment,
      CollectionAgency,
      ThirdPartyPlacement,
    ]),
    AuthModule,
    NotificationModule,
    EmailModule,
    QRCodeModule,
    PDFModule,
    ExcelModule,
  ],
  controllers: [CollectionsController],
  providers: [CollectionsService, CollectionsIntegrationService],
  exports: [CollectionsService],
})
export class CollectionsModule {}

