import {
  IsString,
  IsEnum,
  IsBoolean,
  IsNumber,
  IsOptional,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DocumentCategory } from '../entities/document-type.entity';

export class CreateDocumentTypeDto {
  @ApiProperty({
    description: 'Document type code (unique)',
    example: 'PAN',
  })
  @IsString()
  code: string;

  @ApiProperty({
    description: 'Document type name',
    example: 'PAN Card',
  })
  @IsString()
  name: string;

  @ApiProperty({
    description: 'Document category',
    enum: DocumentCategory,
  })
  @IsEnum(DocumentCategory)
  category: DocumentCategory;

  @ApiPropertyOptional({
    description: 'Description',
    example: 'Permanent Account Number card',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: 'Is required',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  isRequired?: boolean;

  @ApiPropertyOptional({
    description: 'Has expiry date',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  hasExpiry?: boolean;

  @ApiPropertyOptional({
    description: 'Validity period in months',
    example: 12,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  validityPeriodMonths?: number;

  @ApiPropertyOptional({
    description: 'Requires verification',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  requiresVerification?: boolean;

  @ApiPropertyOptional({
    description: 'Allowed file types (comma-separated MIME types)',
    example: 'application/pdf,image/jpeg,image/png',
  })
  @IsOptional()
  @IsString()
  allowedFileTypes?: string;

  @ApiPropertyOptional({
    description: 'Maximum file size in bytes',
    example: 5242880, // 5MB
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  maxFileSize?: number;

  @ApiPropertyOptional({
    description: 'Maximum number of documents of this type',
    default: 1,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  maxDocuments?: number;

  @ApiPropertyOptional({
    description: 'Is active',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

