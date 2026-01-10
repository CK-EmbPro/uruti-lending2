import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './services/analytics.service';
import { DashboardService } from './services/dashboard.service';
import { AnalyticsGateway } from './gateways/analytics.gateway';
import { AnalyticsBroadcastService } from './services/analytics-broadcast.service';
import { Dashboard } from './entities/dashboard.entity';
import { DashboardWidget } from './entities/dashboard-widget.entity';
import { Loan } from '../loan/entities/loan.entity';
import { LoanApplication } from '../loan-application/entities/loan-application.entity';
import { LoanRepayment } from '../loan-repayment/entities/loan-repayment.entity';
import { LoanDisbursement } from '../loan-disbursement/entities/loan-disbursement.entity';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Dashboard,
      DashboardWidget,
      Loan,
      LoanApplication,
      LoanRepayment,
      LoanDisbursement,
    ]),
    AuthModule,
  ],
  controllers: [AnalyticsController],
  providers: [AnalyticsService, DashboardService, AnalyticsGateway, AnalyticsBroadcastService],
  exports: [AnalyticsService, DashboardService, AnalyticsGateway],
})
export class AnalyticsModule {}

