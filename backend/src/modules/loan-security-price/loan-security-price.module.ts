import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LoanSecurityPrice } from './entities/loan-security-price.entity';
import { LoanSecurityPriceService } from './loan-security-price.service';
import { LoanSecurityPriceController } from './loan-security-price.controller';

@Module({
  imports: [TypeOrmModule.forFeature([LoanSecurityPrice])],
  controllers: [LoanSecurityPriceController],
  providers: [LoanSecurityPriceService],
  exports: [LoanSecurityPriceService],
})
export class LoanSecurityPriceModule {}

