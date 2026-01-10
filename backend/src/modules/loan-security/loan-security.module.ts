import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LoanSecurityService } from './loan-security.service';
import { LoanSecurityController } from './loan-security.controller';
import { LoanSecurity } from './entities/loan-security.entity';
import { Loan } from '../loan/entities/loan.entity';

@Module({
  imports: [TypeOrmModule.forFeature([LoanSecurity, Loan])],
  controllers: [LoanSecurityController],
  providers: [LoanSecurityService],
  exports: [LoanSecurityService],
})
export class LoanSecurityModule {}

