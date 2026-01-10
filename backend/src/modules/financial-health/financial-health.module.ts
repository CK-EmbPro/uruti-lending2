import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FinancialHealthService } from './services/financial-health.service';
import { FinancialHealthController } from './financial-health.controller';
import { Loan } from '../loan/entities/loan.entity';
import { LoanApplication } from '../loan-application/entities/loan-application.entity';
import { LoanRepayment } from '../loan-repayment/entities/loan-repayment.entity';
import { CreditDecision } from '../credit-assessment/entities/credit-decision.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Loan, LoanApplication, LoanRepayment, CreditDecision]),
  ],
  controllers: [FinancialHealthController],
  providers: [FinancialHealthService],
  exports: [FinancialHealthService],
})
export class FinancialHealthModule {}

