import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PerformanceMonitoringService } from './services/performance-monitoring.service';
import { PerformanceMonitoringController } from './performance-monitoring.controller';
import { PerformanceMetric } from './entities/performance-metric.entity';
import { AlertRule } from './entities/alert-rule.entity';

@Module({
  imports: [TypeOrmModule.forFeature([PerformanceMetric, AlertRule])],
  controllers: [PerformanceMonitoringController],
  providers: [PerformanceMonitoringService],
  exports: [PerformanceMonitoringService],
})
export class PerformanceMonitoringModule {}

