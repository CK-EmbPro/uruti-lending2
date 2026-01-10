import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum, IsObject, IsArray, IsBoolean } from 'class-validator';

export enum ImportType {
  LOANS = 'LOANS',
  LOAN_APPLICATIONS = 'LOAN_APPLICATIONS',
  CUSTOMERS = 'CUSTOMERS',
  REPAYMENTS = 'REPAYMENTS',
  PRODUCTS = 'PRODUCTS',
}

export enum ExportType {
  LOANS = 'LOANS',
  LOAN_APPLICATIONS = 'LOAN_APPLICATIONS',
  CUSTOMERS = 'CUSTOMERS',
  REPAYMENTS = 'REPAYMENTS',
  PORTFOLIO = 'PORTFOLIO',
  REPORTS = 'REPORTS',
}

export enum ExportFormat {
  CSV = 'CSV',
  EXCEL = 'EXCEL',
  JSON = 'JSON',
  PDF = 'PDF',
}

export class ImportDataDto {
  @ApiProperty({ description: 'Import type', enum: ImportType })
  @IsEnum(ImportType)
  importType: ImportType;

  @ApiProperty({ description: 'File URL or base64 data', example: 'https://example.com/data.csv' })
  @IsString()
  fileUrl: string;

  @ApiPropertyOptional({ description: 'File format', enum: ['CSV', 'EXCEL'], default: 'CSV' })
  @IsOptional()
  @IsString()
  fileFormat?: string;

  @ApiPropertyOptional({ description: 'Field mappings', type: Object })
  @IsOptional()
  @IsObject()
  fieldMappings?: Record<string, string>;

  @ApiPropertyOptional({ description: 'Skip header row', default: true })
  @IsOptional()
  @IsBoolean()
  skipHeader?: boolean;

  @ApiPropertyOptional({ description: 'Validation rules', type: Object })
  @IsOptional()
  @IsObject()
  validationRules?: Record<string, any>;
}

export class ImportResult {
  @ApiProperty({ description: 'Import ID', example: 'uuid' })
  id: string;

  @ApiProperty({ description: 'Total records', example: 100 })
  totalRecords: number;

  @ApiProperty({ description: 'Successfully imported', example: 95 })
  successCount: number;

  @ApiProperty({ description: 'Failed imports', example: 5 })
  failedCount: number;

  @ApiProperty({ description: 'Import errors', type: [Object] })
  errors: Array<{
    row: number;
    field: string;
    error: string;
    data: any;
  }>;

  @ApiProperty({ description: 'Import status', example: 'COMPLETED' })
  status: string;

  @ApiProperty({ description: 'Imported entity IDs', type: [String] })
  importedIds: string[];
}

export class ExportDataDto {
  @ApiProperty({ description: 'Export type', enum: ExportType })
  @IsEnum(ExportType)
  exportType: ExportType;

  @ApiProperty({ description: 'Export format', enum: ExportFormat })
  @IsEnum(ExportFormat)
  format: ExportFormat;

  @ApiPropertyOptional({ description: 'Filters', type: Object })
  @IsOptional()
  @IsObject()
  filters?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Fields to include', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  fields?: string[];

  @ApiPropertyOptional({ description: 'Start date (ISO format)', example: '2024-01-01' })
  @IsOptional()
  @IsString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'End date (ISO format)', example: '2024-12-31' })
  @IsOptional()
  @IsString()
  endDate?: string;
}

export class ExportResult {
  @ApiProperty({ description: 'Export ID', example: 'uuid' })
  id: string;

  @ApiProperty({ description: 'Export URL', example: 'https://app.example.com/exports/uuid.csv' })
  exportUrl: string;

  @ApiProperty({ description: 'File name', example: 'loans_export_2024-01-15.csv' })
  fileName: string;

  @ApiProperty({ description: 'File size (bytes)', example: 1024000 })
  fileSize: number;

  @ApiProperty({ description: 'Total records exported', example: 150 })
  recordCount: number;

  @ApiProperty({ description: 'Export status', example: 'COMPLETED' })
  status: string;

  @ApiProperty({ description: 'Generated at', example: '2024-01-15T10:30:00Z' })
  generatedAt: string;

  @ApiProperty({ description: 'Expires at', example: '2024-01-22T10:30:00Z' })
  expiresAt: string;
}

export class BulkOperationDto {
  @ApiProperty({ description: 'Operation type', example: 'UPDATE_STATUS' })
  @IsString()
  operationType: string;

  @ApiProperty({ description: 'Entity type', example: 'Loan' })
  @IsString()
  entityType: string;

  @ApiProperty({ description: 'Entity IDs', type: [String] })
  @IsArray()
  @IsString({ each: true })
  entityIds: string[];

  @ApiProperty({ description: 'Operation data', type: Object })
  @IsObject()
  operationData: Record<string, any>;
}

export class BulkOperationResult {
  @ApiProperty({ description: 'Operation ID', example: 'uuid' })
  id: string;

  @ApiProperty({ description: 'Total processed', example: 100 })
  totalProcessed: number;

  @ApiProperty({ description: 'Success count', example: 95 })
  successCount: number;

  @ApiProperty({ description: 'Failed count', example: 5 })
  failedCount: number;

  @ApiProperty({ description: 'Operation results', type: [Object] })
  results: Array<{
    entityId: string;
    success: boolean;
    error?: string;
  }>;
}

