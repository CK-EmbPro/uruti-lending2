import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdvancedReportingService } from './services/advanced-reporting.service';
import { AdvancedReportingController } from './advanced-reporting.controller';
import { Report } from './entities/report.entity';
import { ReportTemplate } from './entities/report-template.entity';
import { JsReportModule } from '../jsreport/jsreport.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Report, ReportTemplate]),
    JsReportModule,
  ],
  controllers: [AdvancedReportingController],
  providers: [AdvancedReportingService],
  exports: [AdvancedReportingService],
})
export class AdvancedReportingModule {}

