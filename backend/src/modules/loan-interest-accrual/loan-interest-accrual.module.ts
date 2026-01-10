import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LoanInterestAccrualService } from './loan-interest-accrual.service';
import { LoanInterestAccrualController } from './loan-interest-accrual.controller';
import { LoanInterestAccrual } from './entities/loan-interest-accrual.entity';
import { Loan } from '../loan/entities/loan.entity';
import { CalculationModule } from '../calculation/calculation.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([LoanInterestAccrual, Loan]),
    CalculationModule,
  ],
  controllers: [LoanInterestAccrualController],
  providers: [LoanInterestAccrualService],
  exports: [LoanInterestAccrualService],
})
export class LoanInterestAccrualModule {}

