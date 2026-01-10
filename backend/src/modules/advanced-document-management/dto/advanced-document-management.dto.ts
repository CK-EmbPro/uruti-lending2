import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum, IsBoolean, IsArray, IsObject } from 'class-validator';

export enum DocumentCategory {
  LOAN_APPLICATION = 'LOAN_APPLICATION',
  LOAN_DOCUMENT = 'LOAN_DOCUMENT',
  CUSTOMER_DOCUMENT = 'CUSTOMER_DOCUMENT',
  COMPLIANCE = 'COMPLIANCE',
  CONTRACT = 'CONTRACT',
  STATEMENT = 'STATEMENT',
  OTHER = 'OTHER',
}

export enum DocumentAccessLevel {
  PRIVATE = 'PRIVATE',
  INTERNAL = 'INTERNAL',
  SHARED = 'SHARED',
  PUBLIC = 'PUBLIC',
}

export class BulkDocumentOperationDto {
  @ApiProperty({ description: 'Document IDs', type: [String] })
  @IsArray()
  @IsString({ each: true })
  documentIds: string[];

  @ApiProperty({ description: 'Operation', enum: ['DELETE', 'ARCHIVE', 'DOWNLOAD', 'SHARE', 'TAG'] })
  @IsEnum(['DELETE', 'ARCHIVE', 'DOWNLOAD', 'SHARE', 'TAG'])
  operation: string;

  @ApiPropertyOptional({ description: 'Operation parameters', type: Object })
  @IsOptional()
  @IsObject()
  parameters?: Record<string, any>;
}

export class ShareDocumentDto {
  @ApiProperty({ description: 'Document ID', example: 'uuid' })
  @IsString()
  documentId: string;

  @ApiProperty({ description: 'User IDs to share with', type: [String] })
  @IsArray()
  @IsString({ each: true })
  userIds: string[];

  @ApiPropertyOptional({ description: 'Access level', enum: DocumentAccessLevel, default: DocumentAccessLevel.SHARED })
  @IsOptional()
  @IsEnum(DocumentAccessLevel)
  accessLevel?: DocumentAccessLevel;

  @ApiPropertyOptional({ description: 'Expiry date (ISO format)', example: '2024-12-31' })
  @IsOptional()
  @IsString()
  expiryDate?: string;

  @ApiPropertyOptional({ description: 'Can download', default: true })
  @IsOptional()
  @IsBoolean()
  canDownload?: boolean;
}

export class DocumentSearchDto {
  @ApiPropertyOptional({ description: 'Search query', example: 'loan agreement' })
  @IsOptional()
  @IsString()
  query?: string;

  @ApiPropertyOptional({ description: 'Category', enum: DocumentCategory })
  @IsOptional()
  @IsEnum(DocumentCategory)
  category?: DocumentCategory;

  @ApiPropertyOptional({ description: 'File type', example: 'application/pdf' })
  @IsOptional()
  @IsString()
  fileType?: string;

  @ApiPropertyOptional({ description: 'Tags', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({ description: 'Start date (ISO format)', example: '2024-01-01' })
  @IsOptional()
  @IsString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'End date (ISO format)', example: '2024-12-31' })
  @IsOptional()
  @IsString()
  endDate?: string;
}

export class DocumentVersion {
  @ApiProperty({ description: 'Version ID', example: 'uuid' })
  id: string;

  @ApiProperty({ description: 'Version number', example: 1 })
  version: number;

  @ApiProperty({ description: 'File path', example: '/documents/v1/file.pdf' })
  filePath: string;

  @ApiProperty({ description: 'File size (bytes)', example: 1048576 })
  fileSize: number;

  @ApiProperty({ description: 'Created at', example: '2024-01-15T10:30:00Z' })
  createdAt: string;

  @ApiProperty({ description: 'Created by', example: 'uuid' })
  createdBy: string;

  @ApiProperty({ description: 'Change description', example: 'Updated terms and conditions' })
  changeDescription: string;
}

export class DocumentMetadata {
  @ApiProperty({ description: 'Document ID', example: 'uuid' })
  id: string;

  @ApiProperty({ description: 'Document name', example: 'Loan Agreement.pdf' })
  name: string;

  @ApiProperty({ description: 'Category', enum: DocumentCategory })
  category: DocumentCategory;

  @ApiProperty({ description: 'File type', example: 'application/pdf' })
  fileType: string;

  @ApiProperty({ description: 'File size (bytes)', example: 1048576 })
  fileSize: number;

  @ApiProperty({ description: 'Tags', type: [String] })
  tags: string[];

  @ApiProperty({ description: 'Access level', enum: DocumentAccessLevel })
  accessLevel: DocumentAccessLevel;

  @ApiProperty({ description: 'Versions', type: [DocumentVersion] })
  versions: DocumentVersion[];

  @ApiProperty({ description: 'Shared with', type: [String] })
  sharedWith: string[];

  @ApiProperty({ description: 'Created at', example: '2024-01-15T10:30:00Z' })
  createdAt: string;

  @ApiProperty({ description: 'Created by', example: 'uuid' })
  createdBy: string;
}

