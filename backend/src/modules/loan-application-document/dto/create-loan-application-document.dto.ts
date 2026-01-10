import {
  IsString,
  IsEnum,
  IsDateString,
  IsBoolean,
  IsOptional,
  IsNumber,
  IsUrl,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DocumentStatus } from '../entities/loan-application-document.entity';

export class CreateLoanApplicationDocumentDto {
  @ApiProperty({
    description: 'Loan Application ID',
    example: 'application-uuid',
  })
  @IsString()
  loanApplicationId: string;

  @ApiProperty({
    description: 'Document Type code',
    example: 'PAN',
  })
  @IsString()
  documentType: string;

  @ApiProperty({
    description: 'Document name',
    example: 'PAN Card',
  })
  @IsString()
  documentName: string;

  @ApiPropertyOptional({
    description: 'Document number',
    example: 'ABCDE1234F',
  })
  @IsOptional()
  @IsString()
  documentNumber?: string;

  @ApiPropertyOptional({
    description: 'File path',
    example: '/uploads/documents/pan-card.pdf',
  })
  @IsOptional()
  @IsString()
  filePath?: string;

  @ApiPropertyOptional({
    description: 'File URL',
    example: 'https://example.com/documents/pan-card.pdf',
  })
  @IsOptional()
  @IsUrl()
  fileUrl?: string;

  @ApiPropertyOptional({
    description: 'File type (MIME type)',
    example: 'application/pdf',
  })
  @IsOptional()
  @IsString()
  fileType?: string;

  @ApiPropertyOptional({
    description: 'File size in bytes',
    example: 102400,
  })
  @IsOptional()
  @IsNumber()
  fileSize?: number;

  @ApiPropertyOptional({
    description: 'Document status',
    enum: DocumentStatus,
    default: DocumentStatus.PENDING,
  })
  @IsOptional()
  @IsEnum(DocumentStatus)
  status?: DocumentStatus;

  @ApiPropertyOptional({
    description: 'Issue date',
    example: '2024-01-01',
  })
  @IsOptional()
  @IsDateString()
  issueDate?: string;

  @ApiPropertyOptional({
    description: 'Expiry date',
    example: '2025-01-01',
  })
  @IsOptional()
  @IsDateString()
  expiryDate?: string;

  @ApiPropertyOptional({
    description: 'Is required',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  isRequired?: boolean;
}

