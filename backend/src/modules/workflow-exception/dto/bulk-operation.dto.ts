import { IsString, IsEnum, IsOptional, IsObject, IsInt, IsBoolean, IsDateString } from 'class-validator';
import { BulkOperationType } from '../../../common/enums/bulk-operation-type.enum';

export class CreateBulkOperationDto {
  @IsString()
  operationName: string;

  @IsEnum(BulkOperationType)
  operationType: BulkOperationType;

  @IsObject()
  selectionCriteria: Record<string, any>;

  @IsObject()
  operationDetails: Record<string, any>;

  @IsOptional()
  @IsString()
  operationDescription?: string;

  @IsOptional()
  @IsString()
  remarks?: string;
}

export class PreviewBulkOperationDto {
  @IsString()
  bulkOperationId: string;

  @IsOptional()
  @IsInt()
  sampleSize?: number; // Number of sample records to return
}

export class ApproveBulkOperationDto {
  @IsOptional()
  @IsString()
  approvalNotes?: string;
}

export class ExecuteBulkOperationDto {
  @IsOptional()
  @IsBoolean()
  generateReport?: boolean;

  @IsOptional()
  @IsString()
  remarks?: string;
}

export class QueryBulkOperationsDto {
  @IsOptional()
  @IsEnum(BulkOperationType)
  operationType?: BulkOperationType;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  createdBy?: string;

  @IsOptional()
  @IsDateString()
  fromDate?: string;

  @IsOptional()
  @IsDateString()
  toDate?: string;
}

