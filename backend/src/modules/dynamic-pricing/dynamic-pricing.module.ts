import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DynamicPricingService } from './services/dynamic-pricing.service';
import { DynamicPricingController } from './dynamic-pricing.controller';
import { LoanProduct } from '../loan-product/entities/loan-product.entity';
import { Loan } from '../loan/entities/loan.entity';
import { CalculationModule } from '../calculation/calculation.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([LoanProduct, Loan]),
    CalculationModule,
  ],
  controllers: [DynamicPricingController],
  providers: [DynamicPricingService],
  exports: [DynamicPricingService],
})
export class DynamicPricingModule {}

