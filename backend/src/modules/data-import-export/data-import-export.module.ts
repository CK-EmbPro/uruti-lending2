import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataImportExportService } from './services/data-import-export.service';
import { DataImportExportController } from './data-import-export.controller';
import { Loan } from '../loan/entities/loan.entity';
import { LoanApplication } from '../loan-application/entities/loan-application.entity';
import { LoanRepayment } from '../loan-repayment/entities/loan-repayment.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Loan, LoanApplication, LoanRepayment])],
  controllers: [DataImportExportController],
  providers: [DataImportExportService],
  exports: [DataImportExportService],
})
export class DataImportExportModule {}

