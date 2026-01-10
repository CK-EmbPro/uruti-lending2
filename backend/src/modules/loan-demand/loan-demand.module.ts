import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LoanDemandService } from './loan-demand.service';
import { LoanDemandController } from './loan-demand.controller';
import { LoanDemand } from './entities/loan-demand.entity';
import { Loan } from '../loan/entities/loan.entity';
import { LoanRepaymentSchedule } from '../loan/entities/loan-repayment-schedule.entity';

@Module({
  imports: [TypeOrmModule.forFeature([LoanDemand, Loan, LoanRepaymentSchedule])],
  controllers: [LoanDemandController],
  providers: [LoanDemandService],
  exports: [LoanDemandService],
})
export class LoanDemandModule {}

