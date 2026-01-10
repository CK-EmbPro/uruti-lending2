import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RiskModelingService } from './services/risk-modeling.service';
import { RiskModelingController } from './risk-modeling.controller';
import { RiskModel } from './entities/risk-model.entity';
import { RiskPrediction } from './entities/risk-prediction.entity';
import { EarlyWarningIndicator } from './entities/early-warning-indicator.entity';
import { Loan } from '../loan/entities/loan.entity';
import { LoanRepayment } from '../loan-repayment/entities/loan-repayment.entity';

import { AuthModule } from '../auth/auth.module';
@Module({
  imports: [
    TypeOrmModule.forFeature([
      RiskModel,
      RiskPrediction,
      EarlyWarningIndicator,
      Loan,
      LoanRepayment,
    ]),
      AuthModule,
],
  controllers: [RiskModelingController],
  providers: [RiskModelingService],
  exports: [RiskModelingService],
})
export class RiskModelingModule {}

