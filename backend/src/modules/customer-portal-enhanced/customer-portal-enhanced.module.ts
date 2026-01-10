import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CustomerPortalEnhancedService } from './services/customer-portal-enhanced.service';
import { CustomerPortalEnhancedController } from './customer-portal-enhanced.controller';
import { CustomerPaymentMethod } from './entities/payment-method.entity';
import { CustomerAutoPay } from './entities/auto-pay.entity';
import { CustomerDocument } from './entities/customer-document.entity';
import { CustomerCommunicationPreference } from './entities/communication-preference.entity';
import { CustomerFinancialGoal } from './entities/financial-goal.entity';
import { LoanApplication } from '../loan-application/entities/loan-application.entity';
import { Loan } from '../loan/entities/loan.entity';
import { LoanRepaymentSchedule } from '../loan/entities/loan-repayment-schedule.entity';

import { AuthModule } from '../auth/auth.module';
@Module({
  imports: [
    TypeOrmModule.forFeature([
      CustomerPaymentMethod,
      CustomerAutoPay,
      CustomerDocument,
      CustomerCommunicationPreference,
      CustomerFinancialGoal,
      LoanApplication,
      Loan,
      LoanRepaymentSchedule,
    ]),
      AuthModule,
],
  controllers: [CustomerPortalEnhancedController],
  providers: [CustomerPortalEnhancedService],
  exports: [CustomerPortalEnhancedService],
})
export class CustomerPortalEnhancedModule {}

