import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LoanChargePosting } from './entities/loan-charge-posting.entity';
import { LoanChargePostingService } from './loan-charge-posting.service';
import { Loan } from '../loan/entities/loan.entity';
import { LoanProduct } from '../loan-product/entities/loan-product.entity';
import { LoanCharge } from '../loan-product/entities/loan-charge.entity';
import { LoanProductModule } from '../loan-product/loan-product.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      LoanChargePosting,
      Loan,
      LoanProduct,
      LoanCharge,
    ]),
    LoanProductModule,
  ],
  providers: [LoanChargePostingService],
  exports: [LoanChargePostingService],
})
export class LoanChargePostingModule {}

