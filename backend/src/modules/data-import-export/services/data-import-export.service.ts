import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Loan } from '../../loan/entities/loan.entity';
import { LoanApplication } from '../../loan-application/entities/loan-application.entity';
import { LoanRepayment } from '../../loan-repayment/entities/loan-repayment.entity';
import {
  ImportDataDto,
  ImportResult,
  ExportDataDto,
  ExportResult,
  BulkOperationDto,
  BulkOperationResult,
  ImportType,
  ExportType,
  ExportFormat,
} from '../dto/data-import-export.dto';
import { LoanStatus } from '../../../common/enums/loan-status.enum';

@Injectable()
export class DataImportExportService {
  private readonly logger = new Logger(DataImportExportService.name);

  constructor(
    @InjectRepository(Loan)
    private readonly loanRepository: Repository<Loan>,
    @InjectRepository(LoanApplication)
    private readonly applicationRepository: Repository<LoanApplication>,
    @InjectRepository(LoanRepayment)
    private readonly repaymentRepository: Repository<LoanRepayment>,
  ) {}

  /**
   * Import data from file
   */
  async importData(
    dto: ImportDataDto,
    companyId: string,
  ): Promise<ImportResult> {
    this.logger.log(`Importing ${dto.importType} data for company ${companyId}`);

    // In production, this would:
    // 1. Download/read the file
    // 2. Parse CSV/Excel
    // 3. Validate data
    // 4. Map fields
    // 5. Import records

    // For now, simulate import
    const importId = `import-${Date.now()}`;
    const errors: Array<{ row: number; field: string; error: string; data: any }> = [];
    const importedIds: string[] = [];

    // Simulate parsing and validation
    const totalRecords = 100; // Would come from actual file
    let successCount = 0;
    let failedCount = 0;

    // Process records (simplified)
    for (let i = 0; i < totalRecords; i++) {
      try {
        // Validate and import record
        const entityId = await this.importRecord(dto, i, companyId);
        if (entityId) {
          importedIds.push(entityId);
          successCount++;
        } else {
          failedCount++;
          errors.push({
            row: i + 1,
            field: 'general',
            error: 'Failed to import record',
            data: {},
          });
        }
      } catch (error: any) {
        failedCount++;
        errors.push({
          row: i + 1,
          field: 'general',
          error: error.message,
          data: {},
        });
      }
    }

    return {
      id: importId,
      totalRecords,
      successCount,
      failedCount,
      errors: errors.slice(0, 50), // Limit errors
      status: failedCount === 0 ? 'COMPLETED' : 'COMPLETED_WITH_ERRORS',
      importedIds,
    };
  }

  /**
   * Export data
   */
  async exportData(
    dto: ExportDataDto,
    companyId: string,
  ): Promise<ExportResult> {
    this.logger.log(`Exporting ${dto.exportType} data for company ${companyId}`);

    // Get data based on export type
    const data = await this.getExportData(dto, companyId);

    // Generate file
    const exportId = `export-${Date.now()}`;
    const fileName = this.generateFileName(dto.exportType, dto.format);
    const fileUrl = await this.generateExportFile(data, dto.format, fileName);

    // Calculate file size (simplified)
    const fileSize = JSON.stringify(data).length;

    // Set expiry (7 days from now)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    return {
      id: exportId,
      exportUrl: fileUrl,
      fileName,
      fileSize,
      recordCount: Array.isArray(data) ? data.length : 1,
      status: 'COMPLETED',
      generatedAt: new Date().toISOString(),
      expiresAt: expiresAt.toISOString(),
    };
  }

  /**
   * Perform bulk operation
   */
  async performBulkOperation(
    dto: BulkOperationDto,
    companyId: string,
  ): Promise<BulkOperationResult> {
    this.logger.log(`Performing bulk operation: ${dto.operationType} on ${dto.entityType}`);

    const operationId = `bulk-${Date.now()}`;
    const results: Array<{ entityId: string; success: boolean; error?: string }> = [];
    let successCount = 0;
    let failedCount = 0;

    // Perform operation on each entity
    for (const entityId of dto.entityIds) {
      try {
        await this.performOperation(dto, entityId, companyId);
        results.push({ entityId, success: true });
        successCount++;
      } catch (error: any) {
        results.push({ entityId, success: false, error: error.message });
        failedCount++;
      }
    }

    return {
      id: operationId,
      totalProcessed: dto.entityIds.length,
      successCount,
      failedCount,
      results,
    };
  }

  /**
   * Get import template
   */
  async getImportTemplate(importType: ImportType): Promise<{
    templateUrl: string;
    fields: string[];
    sampleData: any[];
  }> {
    const fields = this.getTemplateFields(importType);
    const sampleData = this.getSampleData(importType);

    // Generate template file (in production, would create actual CSV/Excel)
    const templateUrl = `/templates/${importType.toLowerCase()}_template.csv`;

    return {
      templateUrl,
      fields,
      sampleData,
    };
  }

  // Private helper methods

  private async importRecord(
    dto: ImportDataDto,
    rowIndex: number,
    companyId: string,
  ): Promise<string | null> {
    // In production, would parse actual row data and create entity
    // This is a simplified version

    switch (dto.importType) {
      case ImportType.LOAN_APPLICATIONS:
        // Create loan application
        // const application = this.applicationRepository.create({ ...data, companyId });
        // return (await this.applicationRepository.save(application)).id;
        return `app-${rowIndex}`;

      case ImportType.LOANS:
        // Create loan
        // const loan = this.loanRepository.create({ ...data, companyId });
        // return (await this.loanRepository.save(loan)).id;
        return `loan-${rowIndex}`;

      case ImportType.REPAYMENTS:
        // Create repayment
        // const repayment = this.repaymentRepository.create({ ...data, companyId });
        // return (await this.repaymentRepository.save(repayment)).id;
        return `repayment-${rowIndex}`;

      default:
        return null;
    }
  }

  private async getExportData(dto: ExportDataDto, companyId: string): Promise<any> {
    const where: any = { companyId };

    // Apply filters
    if (dto.filters) {
      Object.assign(where, dto.filters);
    }

    // Apply date range
    if (dto.startDate || dto.endDate) {
      where.createdAt = {};
      if (dto.startDate) {
        where.createdAt.$gte = new Date(dto.startDate);
      }
      if (dto.endDate) {
        where.createdAt.$lte = new Date(dto.endDate);
      }
    }

    switch (dto.exportType) {
      case ExportType.LOANS:
        return await this.loanRepository.find({ where });

      case ExportType.LOAN_APPLICATIONS:
        return await this.applicationRepository.find({ where });

      case ExportType.REPAYMENTS:
        return await this.repaymentRepository.find({ where });

      case ExportType.PORTFOLIO:
        // Generate portfolio summary
        const loans = await this.loanRepository.find({ where: { companyId } });
        return {
          totalLoans: loans.length,
          totalPortfolioValue: loans.reduce((sum, loan) => sum + (loan.loanAmount || 0), 0),
          activeLoans: loans.filter((loan) => loan.status === LoanStatus.ACTIVE).length,
        };

      default:
        return [];
    }
  }

  private async generateExportFile(
    data: any,
    format: ExportFormat,
    fileName: string,
  ): Promise<string> {
    // In production, would generate actual file
    // For CSV: Use csv-writer or similar
    // For Excel: Use exceljs or similar
    // For PDF: Use pdfkit or similar
    // For JSON: JSON.stringify

    const baseUrl = process.env.FRONTEND_URL || 'https://app.example.com';
    return `${baseUrl}/exports/${fileName}`;
  }

  private generateFileName(exportType: ExportType, format: ExportFormat): string {
    const date = new Date().toISOString().split('T')[0];
    const extension = format.toLowerCase();
    return `${exportType.toLowerCase()}_export_${date}.${extension}`;
  }

  private async performOperation(
    dto: BulkOperationDto,
    entityId: string,
    companyId: string,
  ): Promise<void> {
    switch (dto.entityType) {
      case 'Loan':
        const loan = await this.loanRepository.findOne({
          where: { id: entityId, companyId },
        });
        if (!loan) {
          throw new Error(`Loan ${entityId} not found`);
        }

        if (dto.operationType === 'UPDATE_STATUS') {
          loan.status = dto.operationData.status as LoanStatus;
          await this.loanRepository.save(loan);
        }
        break;

      case 'LoanApplication':
        const application = await this.applicationRepository.findOne({
          where: { id: entityId, companyId },
        });
        if (!application) {
          throw new Error(`Application ${entityId} not found`);
        }

        if (dto.operationType === 'UPDATE_STATUS') {
          application.status = dto.operationData.status as any;
          await this.applicationRepository.save(application);
        }
        break;

      default:
        throw new Error(`Unsupported entity type: ${dto.entityType}`);
    }
  }

  private getTemplateFields(importType: ImportType): string[] {
    switch (importType) {
      case ImportType.LOAN_APPLICATIONS:
        return ['applicantId', 'loanProductId', 'requestedAmount', 'applicationDate', 'remarks'];
      case ImportType.LOANS:
        return ['loanNumber', 'loanProductId', 'loanAmount', 'applicantId', 'postingDate'];
      case ImportType.REPAYMENTS:
        return ['loanId', 'amountPaid', 'postingDate', 'repaymentType'];
      case ImportType.CUSTOMERS:
        return ['firstName', 'lastName', 'email', 'phone', 'address'];
      default:
        return [];
    }
  }

  private getSampleData(importType: ImportType): any[] {
    switch (importType) {
      case ImportType.LOAN_APPLICATIONS:
        return [
          {
            applicantId: 'customer-1',
            loanProductId: 'product-1',
            requestedAmount: 100000,
            applicationDate: '2024-01-15',
            remarks: 'Sample application',
          },
        ];
      default:
        return [];
    }
  }
}

