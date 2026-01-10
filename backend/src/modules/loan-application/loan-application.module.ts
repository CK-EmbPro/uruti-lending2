import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LoanApplicationService } from './loan-application.service';
import { LoanApplicationController } from './loan-application.controller';
import { LoanApplication } from './entities/loan-application.entity';
import { LoanProduct } from '../loan-product/entities/loan-product.entity';
import { Loan } from '../loan/entities/loan.entity';
import { LoanModule } from '../loan/loan.module';
import { WorkflowModule } from '../workflow/workflow.module';
import { LoanApplicationWorkflowService } from './loan-application-workflow.service';
import { LoanApplicationSeedService } from './loan-application-seed.service';
import { ApplicationRecoveryService } from './application-recovery.service';
import { Company } from '../company/entities/company.entity';
import { LoanDisbursement } from '../loan-disbursement/entities/loan-disbursement.entity';
import { LoanRepayment } from '../loan-repayment/entities/loan-repayment.entity';
import { NotificationModule } from '../notification/notification.module';
import { IntegrationModule } from '../integration/integration.module';
import { CreditScoringEngineModule } from '../credit-scoring-engine/credit-scoring-engine.module';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { LoanApplicationIntegrationService } from './services/loan-application-integration.service';
import { EmailModule } from '../email/email.module';
import { FileUploadModule } from '../file-upload/file-upload.module';
import { QRCodeModule } from '../qrcode/qrcode.module';
import { PDFModule } from '../pdf/pdf.module';

import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      LoanApplication,
      LoanProduct,
      Loan,
      Company,
      LoanDisbursement,
      LoanRepayment,
    ]),
    forwardRef(() => LoanModule),
    forwardRef(() => IntegrationModule),
    WorkflowModule,
    NotificationModule,
    forwardRef(() => CreditScoringEngineModule),
    EmailModule,
    FileUploadModule,
    QRCodeModule,
    PDFModule,
    AuthModule,
  ],
  controllers: [LoanApplicationController],
  providers: [
    LoanApplicationService,
    LoanApplicationWorkflowService,
    LoanApplicationSeedService,
    ApplicationRecoveryService,
    LoanApplicationIntegrationService,
    JwtAuthGuard,
  ],
  exports: [LoanApplicationService, LoanApplicationSeedService],
})
export class LoanApplicationModule {}

