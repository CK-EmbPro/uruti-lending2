import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsNumber, Min, Max } from 'class-validator';

export class ClassifyDocumentDto {
  @ApiProperty({ description: 'Document file URL', example: 'https://example.com/document.pdf' })
  @IsString()
  fileUrl: string;

  @ApiPropertyOptional({ description: 'Document file path (if available)', example: '/uploads/document.pdf' })
  @IsOptional()
  @IsString()
  filePath?: string;

  @ApiPropertyOptional({ description: 'MIME type', example: 'application/pdf' })
  @IsOptional()
  @IsString()
  mimeType?: string;

  @ApiPropertyOptional({ description: 'File name', example: 'document.pdf' })
  @IsOptional()
  @IsString()
  fileName?: string;

  @ApiPropertyOptional({ description: 'File size in bytes', example: 1024000 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  fileSize?: number;

  @ApiPropertyOptional({ description: 'Application ID (if classifying for application)', example: 'uuid' })
  @IsOptional()
  @IsString()
  applicationId?: string;
}

export class DocumentClassificationResult {
  @ApiProperty({ description: 'Classified document type', example: 'ID_CARD' })
  documentType: string;

  @ApiProperty({ description: 'Document category', example: 'Identity' })
  category: string;

  @ApiProperty({ description: 'Confidence score (0-1)', example: 0.95 })
  confidence: number;

  @ApiProperty({ description: 'Is this document required for loan application', example: true })
  isRequired: boolean;

  @ApiProperty({ description: 'Suggested document type code', example: 'PAN' })
  suggestedTypeCode: string;

  @ApiProperty({ description: 'Extracted metadata', type: Object })
  metadata: {
    documentNumber?: string;
    issueDate?: string;
    expiryDate?: string;
    issuer?: string;
    [key: string]: any;
  };

  @ApiProperty({ description: 'Validation status', enum: ['VALID', 'INVALID', 'NEEDS_REVIEW'] })
  validationStatus: 'VALID' | 'INVALID' | 'NEEDS_REVIEW';

  @ApiProperty({ description: 'Validation errors', type: [String] })
  validationErrors: string[];

  @ApiProperty({ description: 'Suggestions for user', type: [String] })
  suggestions: string[];
}

