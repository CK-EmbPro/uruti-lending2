import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SmartProductMatchingService } from './services/smart-product-matching.service';
import { SmartProductMatchingController } from './smart-product-matching.controller';
import { LoanProduct } from '../loan-product/entities/loan-product.entity';
import { LoanApplication } from '../loan-application/entities/loan-application.entity';
import { Loan } from '../loan/entities/loan.entity';
import { CalculationModule } from '../calculation/calculation.module';
import { LoanCalculatorModule } from '../loan-calculator/loan-calculator.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([LoanProduct, LoanApplication, Loan]),
    CalculationModule,
    forwardRef(() => LoanCalculatorModule),
  ],
  controllers: [SmartProductMatchingController],
  providers: [SmartProductMatchingService],
  exports: [SmartProductMatchingService],
})
export class SmartProductMatchingModule {}

