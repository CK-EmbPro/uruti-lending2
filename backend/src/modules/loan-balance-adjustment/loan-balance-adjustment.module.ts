import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LoanBalanceAdjustmentService } from './loan-balance-adjustment.service';
import { LoanBalanceAdjustmentController } from './loan-balance-adjustment.controller';
import { LoanBalanceAdjustment } from './entities/loan-balance-adjustment.entity';
import { Loan } from '../loan/entities/loan.entity';
import { Company } from '../company/entities/company.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([LoanBalanceAdjustment, Loan, Company]),
  ],
  controllers: [LoanBalanceAdjustmentController],
  providers: [LoanBalanceAdjustmentService],
  exports: [LoanBalanceAdjustmentService],
})
export class LoanBalanceAdjustmentModule {}

