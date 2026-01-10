import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LoanSecurityDepositService } from './loan-security-deposit.service';
import { LoanSecurityDepositController } from './loan-security-deposit.controller';
import { LoanSecurityDepositUsage } from './entities/loan-security-deposit-usage.entity';
import { Loan } from '../loan/entities/loan.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([LoanSecurityDepositUsage, Loan]),
  ],
  controllers: [LoanSecurityDepositController],
  providers: [LoanSecurityDepositService],
  exports: [LoanSecurityDepositService],
})
export class LoanSecurityDepositModule {}

