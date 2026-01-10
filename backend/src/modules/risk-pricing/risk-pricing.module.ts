import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RiskPricingController } from './risk-pricing.controller';
import { RiskBasedPricingService } from './services/risk-based-pricing.service';
import { LoanApplication } from '../loan-application/entities/loan-application.entity';
import { LoanProduct } from '../loan-product/entities/loan-product.entity';
import { Loan } from '../loan/entities/loan.entity';
import { LoanRepayment } from '../loan-repayment/entities/loan-repayment.entity';
import { CreditScoringEngineModule } from '../credit-scoring-engine/credit-scoring-engine.module';
import { NotificationModule } from '../notification/notification.module';
import { PortfolioOptimizationScheduler } from './schedulers/portfolio-optimization.scheduler';
import { ScheduleModule } from '@nestjs/schedule';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([LoanApplication, LoanProduct, Loan, LoanRepayment]),
    CreditScoringEngineModule,
    NotificationModule,
    ScheduleModule.forRoot(),
    AuthModule,
  ],
  controllers: [RiskPricingController],
  providers: [RiskBasedPricingService, PortfolioOptimizationScheduler],
  exports: [RiskBasedPricingService],
})
export class RiskPricingModule {}

