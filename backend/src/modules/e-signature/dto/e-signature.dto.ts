import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsEmail, IsOptional, IsArray, IsEnum, IsDateString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export enum SignatureStatus {
  DRAFT = 'DRAFT',
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  DECLINED = 'DECLINED',
  EXPIRED = 'EXPIRED',
  CANCELLED = 'CANCELLED',
}

export class SignerDto {
  @ApiProperty({ description: 'Signer name', example: 'John Doe' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Signer email', example: 'john@example.com' })
  @IsEmail()
  email: string;

  @ApiPropertyOptional({ description: 'Signer phone', example: '+1234567890' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ description: 'Signer role', example: 'Borrower' })
  @IsString()
  role: string; // e.g., 'Borrower', 'Co-Borrower', 'Guarantor'

  @ApiPropertyOptional({ description: 'Signing order (1-based)', example: 1 })
  @IsOptional()
  order?: number;
}

export class CreateSignatureRequestDto {
  @ApiProperty({ description: 'Document ID to sign', example: 'uuid' })
  @IsString()
  documentId: string;

  @ApiProperty({ description: 'Document name', example: 'Loan Agreement' })
  @IsString()
  documentName: string;

  @ApiProperty({ description: 'Entity type (loan, application, etc.)', example: 'loan' })
  @IsString()
  entityType: string;

  @ApiProperty({ description: 'Entity ID', example: 'uuid' })
  @IsString()
  entityId: string;

  @ApiProperty({ description: 'Signers', type: [SignerDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SignerDto)
  signers: SignerDto[];

  @ApiPropertyOptional({ description: 'Message to signers', example: 'Please review and sign the loan agreement' })
  @IsOptional()
  @IsString()
  message?: string;

  @ApiPropertyOptional({ description: 'Expiry date (ISO format)', example: '2024-12-31' })
  @IsOptional()
  @IsDateString()
  expiryDate?: string;

  @ApiPropertyOptional({ description: 'Require all signers', default: true })
  @IsOptional()
  requireAllSigners?: boolean;
}

export class SignatureRequestResult {
  @ApiProperty({ description: 'Signature request ID', example: 'uuid' })
  id: string;

  @ApiProperty({ description: 'Status', enum: SignatureStatus })
  status: SignatureStatus;

  @ApiProperty({ description: 'Signature request URL', example: 'https://app.example.com/sign/uuid' })
  signatureUrl: string;

  @ApiProperty({ description: 'Signers status', type: [Object] })
  signers: Array<{
    name: string;
    email: string;
    role: string;
    status: string;
    signedAt?: string;
  }>;
}

export class SignatureStatusResult {
  @ApiProperty({ description: 'Signature request ID', example: 'uuid' })
  id: string;

  @ApiProperty({ description: 'Status', enum: SignatureStatus })
  status: SignatureStatus;

  @ApiProperty({ description: 'Completion percentage', example: 75 })
  completionPercentage: number;

  @ApiProperty({ description: 'Signers status', type: [Object] })
  signers: Array<{
    name: string;
    email: string;
    role: string;
    status: string;
    signedAt?: string;
    ipAddress?: string;
  }>;

  @ApiProperty({ description: 'Signed document URL', example: 'https://app.example.com/documents/signed/uuid.pdf' })
  signedDocumentUrl?: string;

  @ApiProperty({ description: 'Completed at', example: '2024-01-15T10:30:00Z' })
  completedAt?: string;
}

