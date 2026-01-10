import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PortfolioAnalyticsService } from './services/portfolio-analytics.service';
import { PortfolioAnalyticsController } from './portfolio-analytics.controller';
import { Loan } from '../loan/entities/loan.entity';
import { LoanRepayment } from '../loan-repayment/entities/loan-repayment.entity';
import { LoanProduct } from '../loan-product/entities/loan-product.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Loan, LoanRepayment, LoanProduct])],
  controllers: [PortfolioAnalyticsController],
  providers: [PortfolioAnalyticsService],
  exports: [PortfolioAnalyticsService],
})
export class PortfolioAnalyticsModule {}

