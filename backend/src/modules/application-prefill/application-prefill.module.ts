import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ApplicationPrefillService } from './services/application-prefill.service';
import { ApplicationPrefillController } from './application-prefill.controller';
import { LoanApplication } from '../loan-application/entities/loan-application.entity';
import { Loan } from '../loan/entities/loan.entity';
import { LoanProduct } from '../loan-product/entities/loan-product.entity';

@Module({
  imports: [TypeOrmModule.forFeature([LoanApplication, Loan, LoanProduct])],
  controllers: [ApplicationPrefillController],
  providers: [ApplicationPrefillService],
  exports: [ApplicationPrefillService],
})
export class ApplicationPrefillModule {}

