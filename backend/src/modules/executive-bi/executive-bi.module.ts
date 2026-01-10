import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ExecutiveBIService } from './services/executive-bi.service';
import { ExecutiveBIController } from './executive-bi.controller';
import { Loan } from '../loan/entities/loan.entity';
import { LoanApplication } from '../loan-application/entities/loan-application.entity';
import { LoanRepayment } from '../loan-repayment/entities/loan-repayment.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Loan, LoanApplication, LoanRepayment])],
  controllers: [ExecutiveBIController],
  providers: [ExecutiveBIService],
  exports: [ExecutiveBIService],
})
export class ExecutiveBIModule {}

