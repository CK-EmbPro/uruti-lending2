import { IsDateString, IsOptional, IsString, IsEnum, IsNumber, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { RetentionCategory, RetentionStatus, HoldType } from '../entities/document-retention.entity';

export class CreateRetentionRecordDto {
  @ApiPropertyOptional({ description: 'Document ID (if linked to LoanApplicationDocument)' })
  @IsString()
  @IsOptional()
  documentId?: string;

  @ApiPropertyOptional({ description: 'Document type (if not linked)' })
  @IsString()
  @IsOptional()
  documentType?: string;

  @ApiPropertyOptional({ description: 'Document path (if not linked)' })
  @IsString()
  @IsOptional()
  documentPath?: string;

  @ApiProperty({
    description: 'Retention category',
    enum: RetentionCategory,
  })
  @IsEnum(RetentionCategory)
  retentionCategory: RetentionCategory;

  @ApiProperty({ description: 'Document date (ISO 8601)' })
  @IsDateString()
  documentDate: string;

  @ApiProperty({ description: 'Retention period in years' })
  @IsNumber()
  retentionPeriodYears: number;
}

export class PlaceLegalHoldDto {
  @ApiProperty({
    description: 'Hold type',
    enum: HoldType,
  })
  @IsEnum(HoldType)
  holdType: HoldType;

  @ApiProperty({ description: 'Hold reason' })
  @IsString()
  holdReason: string;

  @ApiPropertyOptional({ description: 'Hold expiry date (ISO 8601)' })
  @IsDateString()
  @IsOptional()
  holdExpiryDate?: string;
}

export class ReleaseLegalHoldDto {
  @ApiPropertyOptional({ description: 'Remarks' })
  @IsString()
  @IsOptional()
  remarks?: string;
}

export class ArchiveDocumentDto {
  @ApiProperty({ description: 'Archive location' })
  @IsString()
  archiveLocation: string;

  @ApiPropertyOptional({ description: 'Remarks' })
  @IsString()
  @IsOptional()
  remarks?: string;
}

export class PurgeDocumentDto {
  @ApiProperty({ description: 'Purge confirmation' })
  @IsString()
  purgeConfirmation: string;

  @ApiPropertyOptional({ description: 'Remarks' })
  @IsString()
  @IsOptional()
  remarks?: string;
}

