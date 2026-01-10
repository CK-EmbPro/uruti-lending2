import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Loan } from '../loan/entities/loan.entity';
import { LoanRepayment } from '../loan-repayment/entities/loan-repayment.entity';
import { LoanDisbursement } from '../loan-disbursement/entities/loan-disbursement.entity';
import { LoanApplication } from '../loan-application/entities/loan-application.entity';
import { DelinquencyRecord } from '../collections/entities/delinquency-record.entity';
import { PortfolioMetrics } from './entities/portfolio-metrics.entity';
import { RegulatoryReport } from './entities/regulatory-report.entity';
import { RollRateAnalysis } from './entities/roll-rate-analysis.entity';
import { FairLendingAnalysis } from './entities/fair-lending-analysis.entity';
import { ReportingService } from './reporting.service';
import { ReportingAnalyticsService } from './reporting-analytics.service';
import { ReportingExportService } from './reporting-export.service';
import { ReportingController } from './reporting.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Loan,
      LoanRepayment,
      LoanDisbursement,
      LoanApplication,
      DelinquencyRecord,
      PortfolioMetrics,
      RegulatoryReport,
      RollRateAnalysis,
      FairLendingAnalysis,
    ]),
  ],
  controllers: [ReportingController],
  providers: [ReportingService, ReportingAnalyticsService, ReportingExportService],
  exports: [ReportingService, ReportingAnalyticsService, ReportingExportService],
})
export class ReportingModule {}

