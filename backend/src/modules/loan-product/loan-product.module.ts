import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LoanProductService } from './loan-product.service';
import { LoanProductController } from './loan-product.controller';
import { LoanProduct } from './entities/loan-product.entity';
import { LoanCharge } from './entities/loan-charge.entity';

@Module({
  imports: [TypeOrmModule.forFeature([LoanProduct, LoanCharge])],
  controllers: [LoanProductController],
  providers: [LoanProductService],
  exports: [LoanProductService],
})
export class LoanProductModule {}

