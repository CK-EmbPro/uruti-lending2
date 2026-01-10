import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LoanSecurityShortfall } from './entities/loan-security-shortfall.entity';
import { LoanSecurityShortfallService } from './loan-security-shortfall.service';
import { LoanSecurityShortfallController } from './loan-security-shortfall.controller';
import { Loan } from '../loan/entities/loan.entity';
import { LoanSecurityPriceModule } from '../loan-security-price/loan-security-price.module';
import { LoanSecurityAssignmentModule } from '../loan-security-assignment/loan-security-assignment.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([LoanSecurityShortfall, Loan]),
    LoanSecurityPriceModule,
    forwardRef(() => LoanSecurityAssignmentModule),
  ],
  controllers: [LoanSecurityShortfallController],
  providers: [LoanSecurityShortfallService],
  exports: [LoanSecurityShortfallService],
})
export class LoanSecurityShortfallModule {}

