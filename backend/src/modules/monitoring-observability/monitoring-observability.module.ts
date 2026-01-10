import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MonitoringObservabilityService } from './services/monitoring-observability.service';
import { MonitoringObservabilityController } from './monitoring-observability.controller';
import { Metric } from './entities/metric.entity';
import { AlertRule } from './entities/alert-rule.entity';
import { Alert } from './entities/alert.entity';

import { AuthModule } from '../auth/auth.module';
@Module({
  imports: [
    TypeOrmModule.forFeature([
      Metric,
      AlertRule,
      Alert,
    ]),
      AuthModule,
],
  controllers: [MonitoringObservabilityController],
  providers: [MonitoringObservabilityService],
  exports: [MonitoringObservabilityService],
})
export class MonitoringObservabilityModule {}

