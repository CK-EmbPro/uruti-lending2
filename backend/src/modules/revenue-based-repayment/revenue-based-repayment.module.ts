import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RevenueBasedRepaymentController } from './revenue-based-repayment.controller';
import { RevenueBasedRepaymentConfigService } from './services/revenue-based-repayment-config.service';
import { RevenueTrackingService } from './services/revenue-tracking.service';
import { RevenueBasedRepaymentCalculatorService } from './services/revenue-based-repayment-calculator.service';
import { RevenueVerificationService } from './services/revenue-verification.service';
import { RevenueBasedRepaymentSchedulerService } from './services/revenue-based-repayment-scheduler.service';
import { RevenueBasedRepaymentConfig } from './entities/revenue-based-repayment-config.entity';
import { RevenueTracking } from './entities/revenue-tracking.entity';
import { RevenueVerification } from './entities/revenue-verification.entity';
import { Integration } from '../integration-hub/entities/integration.entity';
import { BankTransaction } from '../open-banking/entities/bank-transaction.entity';
import { LoanModule } from '../loan/loan.module';
import { LoanProductModule } from '../loan-product/loan-product.module';
import { LoanRepaymentModule } from '../loan-repayment/loan-repayment.module';
import { Loan } from '../loan/entities/loan.entity';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      RevenueBasedRepaymentConfig,
      RevenueTracking,
      RevenueVerification,
      Integration,
      BankTransaction,
      Loan,
    ]),
    forwardRef(() => LoanModule),
    forwardRef(() => LoanProductModule),
    forwardRef(() => LoanRepaymentModule),
    AuthModule,
  ],
  controllers: [RevenueBasedRepaymentController],
  providers: [
    RevenueBasedRepaymentConfigService,
    RevenueTrackingService,
    RevenueBasedRepaymentCalculatorService,
    RevenueVerificationService,
    RevenueBasedRepaymentSchedulerService,
  ],
  exports: [
    RevenueBasedRepaymentConfigService,
    RevenueTrackingService,
    RevenueBasedRepaymentCalculatorService,
    RevenueVerificationService,
  ],
})
export class RevenueBasedRepaymentModule {}

