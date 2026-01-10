import { IsString, IsOptional, IsArray, IsNumber, IsBoolean, ValidateNested } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class DuplicateCheckRequestDto {
  @ApiProperty({ description: 'Application ID', example: 'app-123' })
  @IsString()
  applicationId: string;

  @ApiPropertyOptional({ description: 'National ID number', example: 'ABC123456' })
  @IsOptional()
  @IsString()
  idNumber?: string;

  @ApiPropertyOptional({ description: 'Phone number', example: '+1234567890' })
  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @ApiPropertyOptional({ description: 'Email address', example: 'user@example.com' })
  @IsOptional()
  @IsString()
  email?: string;

  @ApiPropertyOptional({ description: 'Device fingerprint', example: 'device-fingerprint-hash' })
  @IsOptional()
  @IsString()
  deviceFingerprint?: string;

  @ApiPropertyOptional({ description: 'Biometric hash (face, fingerprint)', example: 'biometric-hash' })
  @IsOptional()
  @IsString()
  biometricHash?: string;

  @ApiPropertyOptional({ description: 'Bank account number', example: '1234567890' })
  @IsOptional()
  @IsString()
  bankAccountNumber?: string;

  @ApiPropertyOptional({ description: 'Full name for fuzzy matching', example: 'John Smith' })
  @IsOptional()
  @IsString()
  fullName?: string;
}

export class DuplicateMatchDto {
  @ApiProperty({ description: 'Type of duplicate match', example: 'ID_NUMBER' })
  matchType: 'ID_NUMBER' | 'PHONE' | 'EMAIL' | 'DEVICE' | 'BIOMETRIC' | 'BANK_ACCOUNT' | 'NAME_FUZZY';

  @ApiProperty({ description: 'Matched value', example: 'ABC123456' })
  matchedValue: string;

  @ApiProperty({ description: 'Matched application IDs', example: ['app-456', 'app-789'] })
  @IsArray()
  matchedApplicationIds: string[];

  @ApiProperty({ description: 'Similarity score (0-100)', example: 95 })
  @IsNumber()
  similarityScore: number;

  @ApiProperty({ description: 'Whether this is an exact match', example: true })
  @IsBoolean()
  isExactMatch: boolean;
}

export class SuspiciousPatternDto {
  @ApiProperty({ description: 'Pattern type', example: 'SAME_DEVICE_MULTIPLE_ACCOUNTS' })
  patternType: 'SAME_DEVICE_MULTIPLE_ACCOUNTS' | 'SAME_BANK_MULTIPLE_ACCOUNTS' | 'ID_NUMBER_VARIATIONS';

  @ApiProperty({ description: 'Pattern description', example: 'Same device used for 5+ accounts' })
  description: string;

  @ApiProperty({ description: 'Count of occurrences', example: 7 })
  @IsNumber()
  count: number;

  @ApiProperty({ description: 'Threshold that was exceeded', example: 5 })
  @IsNumber()
  threshold: number;

  @ApiProperty({ description: 'Related application IDs', example: ['app-1', 'app-2', 'app-3'] })
  @IsArray()
  relatedApplicationIds: string[];
}

export class IdentityDuplicationResultDto {
  @ApiProperty({ description: 'Application ID', example: 'app-123' })
  applicationId: string;

  @ApiProperty({ description: 'Whether duplicates were found', example: true })
  @IsBoolean()
  hasDuplicates: boolean;

  @ApiProperty({ description: 'Duplicate matches found', type: [DuplicateMatchDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DuplicateMatchDto)
  duplicates: DuplicateMatchDto[];

  @ApiProperty({ description: 'Suspicious patterns detected', type: [SuspiciousPatternDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SuspiciousPatternDto)
  suspiciousPatterns: SuspiciousPatternDto[];

  @ApiProperty({ description: 'Overall risk score (0-100)', example: 75 })
  @IsNumber()
  riskScore: number;

  @ApiProperty({ description: 'Whether flagged for review', example: true })
  @IsBoolean()
  flaggedForReview: boolean;
}

