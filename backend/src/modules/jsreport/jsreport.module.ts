import { Module } from '@nestjs/common';
import { JsReportService } from './jsreport.service';
import { JsReportController } from './jsreport.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    AuthModule,
  ],
  controllers: [JsReportController],
  providers: [JsReportService],
  exports: [JsReportService],
})
export class JsReportModule {}

