import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ComplianceMonitoringService } from './services/compliance-monitoring.service';
import { ComplianceMonitoringController } from './compliance-monitoring.controller';
import { ComplianceCheck } from '../compliance/entities/compliance-check.entity';
import { KYCScreening } from '../compliance/entities/kyc-screening.entity';
import { AuditLog } from '../compliance/entities/audit-log.entity';
import { DocumentRetention } from '../compliance/entities/document-retention.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ComplianceCheck,
      KYCScreening,
      AuditLog,
      DocumentRetention,
    ]),
  ],
  controllers: [ComplianceMonitoringController],
  providers: [ComplianceMonitoringService],
  exports: [ComplianceMonitoringService],
})
export class ComplianceMonitoringModule {}

