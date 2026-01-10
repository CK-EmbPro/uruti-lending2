import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RegulatoryReportingService } from './services/regulatory-reporting.service';
import { RegulatoryReportingController } from './regulatory-reporting.controller';
import { RegulatoryReport } from './entities/regulatory-report.entity';
import { ReportSchedule } from './entities/report-schedule.entity';
import { RegulatoryChange } from './entities/regulatory-change.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      RegulatoryReport,
      ReportSchedule,
      RegulatoryChange,
    ]),
  ],
  controllers: [RegulatoryReportingController],
  providers: [RegulatoryReportingService],
  exports: [RegulatoryReportingService],
})
export class RegulatoryReportingModule {}

