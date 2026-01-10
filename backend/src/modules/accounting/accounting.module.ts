import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { AccountingController } from './accounting.controller';
import { ReconciliationService } from './services/reconciliation.service';
import { AccountingService } from './accounting.service';
import { AccountService } from './services/account.service';
import { LedgerEntry } from './entities/ledger-entry.entity';
import { PaymentMismatch } from './entities/payment-mismatch.entity';
import { ReconciliationRun } from './entities/reconciliation-run.entity';
import { JournalEntry } from './entities/journal-entry.entity';
import { GlEntry } from './entities/gl-entry.entity';
import { Account } from './entities/account.entity';
import { Loan } from '../loan/entities/loan.entity';
import { LoanRepayment } from '../loan-repayment/entities/loan-repayment.entity';
import { EndOfDayReconciliationScheduler } from './schedulers/end-of-day-reconciliation.scheduler';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      LedgerEntry,
      PaymentMismatch,
      ReconciliationRun,
      JournalEntry,
      GlEntry,
      Account,
      Loan,
      LoanRepayment,
    ]),
    ScheduleModule.forRoot(),
    AuthModule,
  ],
  controllers: [AccountingController],
  providers: [
    ReconciliationService,
    AccountingService,
    AccountService,
    EndOfDayReconciliationScheduler,
  ],
  exports: [ReconciliationService, AccountingService],
})
export class AccountingModule {}
