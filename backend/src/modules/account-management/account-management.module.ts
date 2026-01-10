import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AccountManagementController } from './account-management.controller';
import { AccountInquiryService } from './services/account-inquiry.service';
import { StatementService } from './services/statement.service';
import { LoanModificationService } from './services/loan-modification.service';
import { RefinancingService } from './services/refinancing.service';
import { PayoffQuoteService } from './services/payoff-quote.service';
import { EarlySettlementRebateService } from './services/early-settlement-rebate.service';
import { EarlySettlementDailyCalculationService } from './services/early-settlement-daily-calculation.service';
import { EarlySettlementAnalyticsService } from './services/early-settlement-analytics.service';
import { LoanStatement } from './entities/loan-statement.entity';
import { LoanModification } from './entities/loan-modification.entity';
import { RefinancingApplication } from './entities/refinancing-application.entity';
import { PayoffQuote } from './entities/payoff-quote.entity';
import { EarlySettlement } from './entities/early-settlement.entity';
import { EarlySettlementDailyCalculation } from './entities/early-settlement-daily-calculation.entity';
import { EarlySettlementAnalytics } from './entities/early-settlement-analytics.entity';
import { Loan } from '../loan/entities/loan.entity';
import { LoanRepayment } from '../loan-repayment/entities/loan-repayment.entity';
import { LoanRepaymentSchedule } from '../loan/entities/loan-repayment-schedule.entity';
import { LoanApplication } from '../loan-application/entities/loan-application.entity';
import { LoanRestructureModule } from '../loan-restructure/loan-restructure.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      LoanStatement,
      LoanModification,
      RefinancingApplication,
      PayoffQuote,
      EarlySettlement,
      EarlySettlementDailyCalculation,
      EarlySettlementAnalytics,
      Loan,
      LoanRepayment,
      LoanRepaymentSchedule,
      LoanApplication,
    ]),
    LoanRestructureModule,
  ],
  controllers: [AccountManagementController],
  providers: [
    AccountInquiryService,
    StatementService,
    LoanModificationService,
    RefinancingService,
    PayoffQuoteService,
    EarlySettlementRebateService,
    EarlySettlementDailyCalculationService,
    EarlySettlementAnalyticsService,
  ],
  exports: [
    AccountInquiryService,
    StatementService,
    LoanModificationService,
    RefinancingService,
    PayoffQuoteService,
    EarlySettlementRebateService,
    EarlySettlementDailyCalculationService,
    EarlySettlementAnalyticsService,
  ],
})
export class AccountManagementModule {}













