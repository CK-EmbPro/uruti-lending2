import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PredictiveAnalyticsController } from './predictive-analytics.controller';
import { PredictiveAnalyticsService } from './services/predictive-analytics.service';
import { PredictionResult } from './entities/prediction-result.entity';
import { PredictionModel } from './entities/prediction-model.entity';
import { Loan } from '../loan/entities/loan.entity';
import { LoanApplication } from '../loan-application/entities/loan-application.entity';
import { LoanRepayment } from '../loan-repayment/entities/loan-repayment.entity';

import { AuthModule } from '../auth/auth.module';
@Module({
  imports: [
    TypeOrmModule.forFeature([
      PredictionResult,
      PredictionModel,
      Loan,
      LoanApplication,
      LoanRepayment,
    ]),
      AuthModule,
],
  controllers: [PredictiveAnalyticsController],
  providers: [PredictiveAnalyticsService],
  exports: [PredictiveAnalyticsService],
})
export class PredictiveAnalyticsModule {}

