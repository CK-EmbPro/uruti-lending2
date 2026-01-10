import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdvancedAnalyticsService } from './services/advanced-analytics.service';
import { AdvancedAnalyticsController } from './advanced-analytics.controller';
import { LoanApplication } from '../loan-application/entities/loan-application.entity';
import { Loan } from '../loan/entities/loan.entity';

@Module({
  imports: [TypeOrmModule.forFeature([LoanApplication, Loan])],
  controllers: [AdvancedAnalyticsController],
  providers: [AdvancedAnalyticsService],
  exports: [AdvancedAnalyticsService],
})
export class AdvancedAnalyticsModule {}

