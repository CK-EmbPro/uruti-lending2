import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdvancedAnalyticsBIService } from './services/advanced-analytics-bi.service';
import { AdvancedAnalyticsBIController } from './advanced-analytics-bi.controller';
import { CustomReport } from './entities/custom-report.entity';
import { AdvancedDashboard } from './entities/advanced-dashboard.entity';
import { DataVisualization } from './entities/data-visualization.entity';
import { DataInsight } from './entities/data-insight.entity';
import { Loan } from '../loan/entities/loan.entity';
import { LoanApplication } from '../loan-application/entities/loan-application.entity';
import { LoanRepayment } from '../loan-repayment/entities/loan-repayment.entity';

import { AuthModule } from '../auth/auth.module';
@Module({
  imports: [
    TypeOrmModule.forFeature([
      CustomReport,
      AdvancedDashboard,
      DataVisualization,
      DataInsight,
      Loan,
      LoanApplication,
      LoanRepayment,
    ]),
      AuthModule,
],
  controllers: [AdvancedAnalyticsBIController],
  providers: [AdvancedAnalyticsBIService],
  exports: [AdvancedAnalyticsBIService],
})
export class AdvancedAnalyticsBIModule {}

