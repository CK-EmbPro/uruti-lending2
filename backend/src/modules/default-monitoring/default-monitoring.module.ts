import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { DefaultMonitoringController } from './default-monitoring.controller';
import { PredictiveDefaultMonitoringService } from './services/predictive-default-monitoring.service';
import { CollectionsDashboardService } from './services/collections-dashboard.service';
import { DefaultPerformanceMetricsService } from './services/default-performance-metrics.service';
import { DefaultRiskScore } from './entities/default-risk-score.entity';
import { PreDefaultAction } from './entities/pre-default-action.entity';
import { BehavioralBaseline } from './entities/behavioral-baseline.entity';
import { Loan } from '../loan/entities/loan.entity';
import { LoanRepayment } from '../loan-repayment/entities/loan-repayment.entity';
import { LoanRepaymentSchedule } from '../loan/entities/loan-repayment-schedule.entity';
import { NotificationModule } from '../notification/notification.module';
import { DailyRiskScoreScheduler } from './schedulers/daily-risk-score.scheduler';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      DefaultRiskScore,
      PreDefaultAction,
      BehavioralBaseline,
      Loan,
      LoanRepayment,
      LoanRepaymentSchedule,
    ]),
    ScheduleModule.forRoot(),
    NotificationModule,
    AuthModule,
  ],
  controllers: [DefaultMonitoringController],
  providers: [
    PredictiveDefaultMonitoringService,
    CollectionsDashboardService,
    DefaultPerformanceMetricsService,
    DailyRiskScoreScheduler,
  ],
  exports: [
    PredictiveDefaultMonitoringService,
    CollectionsDashboardService,
    DefaultPerformanceMetricsService,
  ],
})
export class DefaultMonitoringModule {}

