import { IsString, IsOptional, IsEnum, IsBoolean, IsNumber, IsArray, ValidateNested } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export enum RiskLevel {
  GREEN = 'GREEN',
  YELLOW = 'YELLOW',
  RED = 'RED',
}

export enum CheckStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

export class NationalIDVerificationDto {
  @ApiProperty({ description: 'National ID number', example: 'ABC123456' })
  @IsString()
  idNumber: string;

  @ApiPropertyOptional({ description: 'Full name', example: 'John Doe' })
  @IsOptional()
  @IsString()
  fullName?: string;

  @ApiPropertyOptional({ description: 'Date of birth (YYYY-MM-DD)', example: '1990-01-15' })
  @IsOptional()
  @IsString()
  dateOfBirth?: string;

  @ApiPropertyOptional({ description: 'Country code', example: 'US' })
  @IsOptional()
  @IsString()
  countryCode?: string;
}

export class CreditBureauCheckDto {
  @ApiProperty({ description: 'Customer ID or Application ID', example: 'customer-123' })
  @IsString()
  customerId: string;

  @ApiPropertyOptional({ description: 'SSN or Tax ID', example: '123-45-6789' })
  @IsOptional()
  @IsString()
  ssn?: string;
}

export class SanctionsCheckDto {
  @ApiProperty({ description: 'Full name', example: 'John Doe' })
  @IsString()
  fullName: string;

  @ApiPropertyOptional({ description: 'Date of birth (YYYY-MM-DD)', example: '1990-01-15' })
  @IsOptional()
  @IsString()
  dateOfBirth?: string;

  @ApiPropertyOptional({ description: 'Country code', example: 'US' })
  @IsOptional()
  @IsString()
  countryCode?: string;

  @ApiPropertyOptional({ description: 'Check OFAC list', example: true, default: true })
  @IsOptional()
  @IsBoolean()
  checkOFAC?: boolean;

  @ApiPropertyOptional({ description: 'Check local sanctions lists', example: true, default: true })
  @IsOptional()
  @IsBoolean()
  checkLocal?: boolean;
}

export class AdverseMediaCheckDto {
  @ApiProperty({ description: 'Full name', example: 'John Doe' })
  @IsString()
  fullName: string;

  @ApiPropertyOptional({ description: 'Date of birth (YYYY-MM-DD)', example: '1990-01-15' })
  @IsOptional()
  @IsString()
  dateOfBirth?: string;

  @ApiPropertyOptional({ description: 'Country code', example: 'US' })
  @IsOptional()
  @IsString()
  countryCode?: string;
}

export class InstantKYCCheckRequestDto {
  @ApiProperty({ description: 'Application ID', example: 'app-123' })
  @IsString()
  applicationId: string;

  @ApiPropertyOptional({ description: 'National ID verification data', type: NationalIDVerificationDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => NationalIDVerificationDto)
  nationalId?: NationalIDVerificationDto;

  @ApiPropertyOptional({ description: 'Credit bureau check data', type: CreditBureauCheckDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => CreditBureauCheckDto)
  creditBureau?: CreditBureauCheckDto;

  @ApiPropertyOptional({ description: 'Sanctions check data', type: SanctionsCheckDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => SanctionsCheckDto)
  sanctions?: SanctionsCheckDto;

  @ApiPropertyOptional({ description: 'Adverse media check data', type: AdverseMediaCheckDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => AdverseMediaCheckDto)
  adverseMedia?: AdverseMediaCheckDto;
}

export class CheckResultDto {
  @ApiProperty({ description: 'Check name', example: 'National ID Verification' })
  checkName: string;

  @ApiProperty({ description: 'Check status', enum: CheckStatus, example: CheckStatus.COMPLETED })
  status: CheckStatus;

  @ApiProperty({ description: 'Whether check passed', example: true })
  passed: boolean;

  @ApiPropertyOptional({ description: 'Check result data', type: Object })
  result?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Error message if check failed' })
  error?: string;

  @ApiProperty({ description: 'Processing time in milliseconds', example: 250 })
  processingTime: number;
}

export class InstantKYCCheckResponseDto {
  @ApiProperty({ description: 'Application ID', example: 'app-123' })
  applicationId: string;

  @ApiProperty({ description: 'Overall risk level', enum: RiskLevel, example: RiskLevel.GREEN })
  riskLevel: RiskLevel;

  @ApiProperty({ description: 'Risk score (0-100)', example: 25, minimum: 0, maximum: 100 })
  riskScore: number;

  @ApiProperty({ description: 'Whether application is auto-rejected', example: false })
  autoRejected: boolean;

  @ApiPropertyOptional({ description: 'Rejection reason if auto-rejected' })
  rejectionReason?: string;

  @ApiProperty({ description: 'Individual check results', type: [CheckResultDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CheckResultDto)
  checks: CheckResultDto[];

  @ApiProperty({ description: 'Total processing time in milliseconds', example: 1250 })
  totalProcessingTime: number;

  @ApiProperty({ description: 'Whether all checks completed successfully', example: true })
  allChecksCompleted: boolean;

  @ApiProperty({ description: 'Timestamp of check execution', example: '2024-01-15T10:30:00Z' })
  timestamp: string;
}

