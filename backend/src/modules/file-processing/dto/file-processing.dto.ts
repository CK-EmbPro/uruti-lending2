import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum, IsObject, IsArray } from 'class-validator';

export enum ProcessingType {
  OCR = 'OCR',
  TEXT_EXTRACTION = 'TEXT_EXTRACTION',
  IMAGE_ANALYSIS = 'IMAGE_ANALYSIS',
  DOCUMENT_CLASSIFICATION = 'DOCUMENT_CLASSIFICATION',
  DATA_EXTRACTION = 'DATA_EXTRACTION',
}

export enum ProcessingStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

export class ProcessFileDto {
  @ApiProperty({ description: 'File ID', example: 'file-uuid' })
  @IsString()
  fileId: string;

  @ApiProperty({ description: 'Processing type', enum: ProcessingType })
  @IsEnum(ProcessingType)
  processingType: ProcessingType;

  @ApiPropertyOptional({ description: 'Options', type: Object })
  @IsOptional()
  @IsObject()
  options?: Record<string, any>;
}

export class ProcessingResult {
  @ApiProperty({ description: 'Processing ID', example: 'uuid' })
  id: string;

  @ApiProperty({ description: 'File ID', example: 'file-uuid' })
  fileId: string;

  @ApiProperty({ description: 'Processing type', enum: ProcessingType })
  processingType: ProcessingType;

  @ApiProperty({ description: 'Status', enum: ProcessingStatus })
  status: ProcessingStatus;

  @ApiProperty({ description: 'Extracted text', example: 'Document content...' })
  extractedText?: string;

  @ApiProperty({ description: 'Extracted data', type: Object })
  extractedData?: Record<string, any>;

  @ApiProperty({ description: 'Confidence score', example: 0.95 })
  confidence?: number;

  @ApiProperty({ description: 'Created date', example: '2024-01-15T00:00:00Z' })
  createdAt: Date;
}

