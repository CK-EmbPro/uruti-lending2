import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { HealthController } from './health.controller';
import { UptimeMonitoringService } from './services/uptime-monitoring.service';
import { UptimeLog } from './entities/uptime-log.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([UptimeLog]),
    ScheduleModule,
  ],
  controllers: [HealthController],
  providers: [UptimeMonitoringService],
  exports: [UptimeMonitoringService],
})
export class HealthModule {}

