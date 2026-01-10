import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LoanWriteOffService } from './loan-write-off.service';
import { LoanWriteOffController } from './loan-write-off.controller';
import { LoanWriteOff } from './entities/loan-write-off.entity';
import { Loan } from '../loan/entities/loan.entity';
import { LoanProduct } from '../loan-product/entities/loan-product.entity';
import { Company } from '../company/entities/company.entity';
import { AccountingModule } from '../accounting/accounting.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([LoanWriteOff, Loan, LoanProduct, Company]),
    AccountingModule,
  ],
  controllers: [LoanWriteOffController],
  providers: [LoanWriteOffService],
  exports: [LoanWriteOffService],
})
export class LoanWriteOffModule {}

