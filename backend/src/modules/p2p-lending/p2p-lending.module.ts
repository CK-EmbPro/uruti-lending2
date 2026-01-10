import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { P2PLendingService } from './services/p2p-lending.service';
import { P2PLendingController } from './p2p-lending.controller';
import { P2PListing } from './entities/p2p-listing.entity';
import { P2PInvestment } from './entities/p2p-investment.entity';
import { LoanApplication } from '../loan-application/entities/loan-application.entity';
import { Loan } from '../loan/entities/loan.entity';
import { LoanRepayment } from '../loan-repayment/entities/loan-repayment.entity';

import { AuthModule } from '../auth/auth.module';
@Module({
  imports: [
    TypeOrmModule.forFeature([
      P2PListing,
      P2PInvestment,
      LoanApplication,
      Loan,
      LoanRepayment,
    ]),
      AuthModule,
],
  controllers: [P2PLendingController],
  providers: [P2PLendingService],
  exports: [P2PLendingService],
})
export class P2PLendingModule {}

