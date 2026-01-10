import { IsString, IsOptional, IsEnum, IsDateString, IsObject } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DocumentType, DocumentStatus } from '../entities/loan-document.entity';

export class CreateLoanDocumentDto {
  @ApiProperty({ description: 'Loan ID', example: 'uuid-loan-1' })
  @IsString()
  loanId: string;

  @ApiProperty({ description: 'Document type', enum: DocumentType })
  @IsEnum(DocumentType)
  documentType: DocumentType;

  @ApiProperty({ description: 'Document name', example: 'Loan Agreement - 2024' })
  @IsString()
  documentName: string;

  @ApiPropertyOptional({ description: 'Template ID used to generate document' })
  @IsString()
  @IsOptional()
  templateId?: string;

  @ApiPropertyOptional({ description: 'Template data', example: { borrowerName: 'John Doe', amount: 50000 } })
  @IsObject()
  @IsOptional()
  templateData?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Document expiry date', example: '2024-12-31' })
  @IsDateString()
  @IsOptional()
  expiryDate?: string;

  @ApiPropertyOptional({ description: 'Remarks', example: 'Standard loan agreement' })
  @IsString()
  @IsOptional()
  remarks?: string;
}

export class UpdateLoanDocumentDto {
  @ApiPropertyOptional({ description: 'Document status', enum: DocumentStatus })
  @IsEnum(DocumentStatus)
  @IsOptional()
  status?: DocumentStatus;

  @ApiPropertyOptional({ description: 'File path' })
  @IsString()
  @IsOptional()
  filePath?: string;

  @ApiPropertyOptional({ description: 'File URL' })
  @IsString()
  @IsOptional()
  fileUrl?: string;

  @ApiPropertyOptional({ description: 'Remarks' })
  @IsString()
  @IsOptional()
  remarks?: string;
}

