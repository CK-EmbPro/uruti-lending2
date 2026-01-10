import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LoanRefundService } from './loan-refund.service';
import { LoanRefundController } from './loan-refund.controller';
import { LoanRefund } from './entities/loan-refund.entity';
import { Loan } from '../loan/entities/loan.entity';
import { LoanProduct } from '../loan-product/entities/loan-product.entity';
import { Company } from '../company/entities/company.entity';
import { AccountingModule } from '../accounting/accounting.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([LoanRefund, Loan, LoanProduct, Company]),
    AccountingModule,
  ],
  controllers: [LoanRefundController],
  providers: [LoanRefundService],
  exports: [LoanRefundService],
})
export class LoanRefundModule {}

