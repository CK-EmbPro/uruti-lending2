import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CreditMonitoringService } from './services/credit-monitoring.service';
import { CreditMonitoringController } from './credit-monitoring.controller';
import { CreditMonitoring } from './entities/credit-monitoring.entity';
import { CreditScoreRecord } from './entities/credit-score-record.entity';
import { CreditAlert } from './entities/credit-alert.entity';

import { AuthModule } from '../auth/auth.module';
@Module({
  imports: [
    TypeOrmModule.forFeature([
      CreditMonitoring,
      CreditScoreRecord,
      CreditAlert,
    ]),
      AuthModule,
],
  controllers: [CreditMonitoringController],
  providers: [CreditMonitoringService],
  exports: [CreditMonitoringService],
})
export class CreditMonitoringModule {}

