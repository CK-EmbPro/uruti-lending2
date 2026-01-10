import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { LoanApplication } from '../loan-application/entities/loan-application.entity';
import { LoanApplicationDocument } from '../loan-application-document/entities/loan-application-document.entity';
import { KYCScreening } from './entities/kyc-screening.entity';
import { PrivacyConsent, PrivacyRequest } from './entities/privacy-consent.entity';
import { AuditLog } from './entities/audit-log.entity';
import { DocumentRetention } from './entities/document-retention.entity';
import { ComplianceService } from './services/compliance.service';
import { RegTechAutomationService } from './services/regtech-automation.service';
import { InstantKYCAMLService } from './services/instant-kyc-aml.service';
import { ComplianceController } from './compliance.controller';
import { CreditBureauModule } from '../credit-bureau/credit-bureau.module';
import { RegulatoryChange } from './entities/regulatory-change.entity';
import { ComplianceCheck } from './entities/compliance-check.entity';
import { CompliancePolicy } from './entities/compliance-policy.entity';
import { ComplianceReport } from './entities/compliance-report.entity';
import { Loan } from '../loan/entities/loan.entity';

@Module({
  imports: [
    ScheduleModule,
    TypeOrmModule.forFeature([
      LoanApplication,
      LoanApplicationDocument,
      KYCScreening,
      PrivacyConsent,
      PrivacyRequest,
      AuditLog,
      DocumentRetention,
      RegulatoryChange,
      ComplianceCheck,
      CompliancePolicy,
      ComplianceReport,
      Loan,
    ]),
    CreditBureauModule,
  ],
  controllers: [ComplianceController],
  providers: [ComplianceService, RegTechAutomationService, InstantKYCAMLService],
  exports: [ComplianceService, RegTechAutomationService, InstantKYCAMLService],
})
export class ComplianceModule {}

