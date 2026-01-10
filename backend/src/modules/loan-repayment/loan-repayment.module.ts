import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LoanRepaymentService } from './loan-repayment.service';
import { LoanRepaymentController } from './loan-repayment.controller';
import { LoanRepaymentSeedService } from './loan-repayment-seed.service';
import { LoanRepayment } from './entities/loan-repayment.entity';
import { PrepaymentCharge } from './entities/prepayment-charge.entity';
import { Loan } from '../loan/entities/loan.entity';
import { LoanProduct } from '../loan-product/entities/loan-product.entity';
import { LoanDemand } from '../loan-demand/entities/loan-demand.entity';
import { AccountingModule } from '../accounting/accounting.module';
import { NotificationModule } from '../notification/notification.module';
import { CurrencyModule } from '../currency/currency.module';
import { IntegrationModule } from '../integration/integration.module';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RepaymentIntegrationService } from './services/repayment-integration.service';
import { EmailModule } from '../email/email.module';
import { QRCodeModule } from '../qrcode/qrcode.module';
import { PDFModule } from '../pdf/pdf.module';
import { ExcelModule } from '../excel/excel.module';

import { AuthModule } from '../auth/auth.module';
@Module({
  imports: [
    TypeOrmModule.forFeature([
      LoanRepayment,
      PrepaymentCharge,
      Loan,
      LoanProduct,
      LoanDemand,
    ]),
    AccountingModule,
    NotificationModule,
    CurrencyModule,
    forwardRef(() => IntegrationModule),
    EmailModule,
    QRCodeModule,
    PDFModule,
    ExcelModule,
    AuthModule,
  ],
  controllers: [LoanRepaymentController],
  providers: [
    LoanRepaymentService,
    LoanRepaymentSeedService,
    RepaymentIntegrationService,
    JwtAuthGuard,
  ],
  exports: [LoanRepaymentService, LoanRepaymentSeedService],
})
export class LoanRepaymentModule {}

