import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LoanCalculatorController } from './loan-calculator.controller';
import { LoanCalculatorService } from './services/loan-calculator.service';
import { RepaymentStructureService } from './services/repayment-structure.service';
import { LoanProduct } from '../loan-product/entities/loan-product.entity';
import { CalculationModule } from '../calculation/calculation.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([LoanProduct]),
    CalculationModule,
  ],
  controllers: [LoanCalculatorController],
  providers: [LoanCalculatorService, RepaymentStructureService],
  exports: [LoanCalculatorService, RepaymentStructureService],
})
export class LoanCalculatorModule {}

