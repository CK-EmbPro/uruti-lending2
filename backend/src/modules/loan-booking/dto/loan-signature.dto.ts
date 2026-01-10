import { IsString, IsOptional, IsEnum, IsDateString, IsEmail } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SignatureType, SignatureStatus } from '../entities/loan-signature.entity';

export class CreateLoanSignatureDto {
  @ApiProperty({ description: 'Document ID', example: 'uuid-document-1' })
  @IsString()
  documentId: string;

  @ApiProperty({ description: 'Signature type', enum: SignatureType })
  @IsEnum(SignatureType)
  signatureType: SignatureType;

  @ApiProperty({ description: 'Signer ID', example: 'uuid-borrower-1' })
  @IsString()
  signerId: string;

  @ApiProperty({ description: 'Signer name', example: 'John Doe' })
  @IsString()
  signerName: string;

  @ApiPropertyOptional({ description: 'Signer email', example: 'john.doe@example.com' })
  @IsEmail()
  @IsOptional()
  signerEmail?: string;

  @ApiPropertyOptional({ description: 'Signer phone', example: '+1234567890' })
  @IsString()
  @IsOptional()
  signerPhone?: string;

  @ApiPropertyOptional({ description: 'Signature expiry date', example: '2024-12-31' })
  @IsDateString()
  @IsOptional()
  expiryDate?: string;
}

export class SignDocumentDto {
  @ApiProperty({ description: 'Signature data (Base64 encoded)', example: 'data:image/png;base64,...' })
  @IsString()
  signatureData: string;

  @ApiPropertyOptional({ description: 'IP address' })
  @IsString()
  @IsOptional()
  ipAddress?: string;

  @ApiPropertyOptional({ description: 'User agent' })
  @IsString()
  @IsOptional()
  userAgent?: string;
}

export class NotarizeDocumentDto {
  @ApiProperty({ description: 'Notary name', example: 'Jane Smith' })
  @IsString()
  notaryName: string;

  @ApiProperty({ description: 'Notary license number', example: 'NOT-12345' })
  @IsString()
  notaryLicenseNumber: string;

  @ApiPropertyOptional({ description: 'Notarization date', example: '2024-01-15' })
  @IsDateString()
  @IsOptional()
  notarizedDate?: string;

  @ApiPropertyOptional({ description: 'Remarks' })
  @IsString()
  @IsOptional()
  remarks?: string;
}

export class UpdateLoanSignatureDto {
  @ApiPropertyOptional({ description: 'Signature status', enum: SignatureStatus })
  @IsEnum(SignatureStatus)
  @IsOptional()
  status?: SignatureStatus;

  @ApiPropertyOptional({ description: 'Rejection reason' })
  @IsString()
  @IsOptional()
  rejectionReason?: string;

  @ApiPropertyOptional({ description: 'Remarks' })
  @IsString()
  @IsOptional()
  remarks?: string;
}

