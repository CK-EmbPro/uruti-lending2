import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReferralProgramService } from './services/referral-program.service';
import { ReferralProgramController } from './referral-program.controller';
import { Referral } from './entities/referral.entity';
import { LoanApplication } from '../loan-application/entities/loan-application.entity';
import { Loan } from '../loan/entities/loan.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Referral, LoanApplication, Loan])],
  controllers: [ReferralProgramController],
  providers: [ReferralProgramService],
  exports: [ReferralProgramService],
})
export class ReferralProgramModule {}

