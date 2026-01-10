import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsObject, IsEnum, IsNumber, Min, Max } from 'class-validator';
import { FraudCaseType } from '../entities/fraud-case.entity';

export class CalculateFraudScoreDto {
  @ApiProperty({ description: 'Loan application ID' })
  @IsString()
  applicationId: string;

  @ApiPropertyOptional({ description: 'Device fingerprint data' })
  @IsObject()
  @IsOptional()
  deviceFingerprint?: {
    userAgent?: string;
    screenResolution?: string;
    timezone?: string;
    language?: string;
    platform?: string;
    cookieEnabled?: boolean;
    doNotTrack?: boolean;
    hardwareConcurrency?: number;
    deviceMemory?: number;
  };

  @ApiPropertyOptional({ description: 'IP address' })
  @IsString()
  @IsOptional()
  ipAddress?: string;

  @ApiPropertyOptional({ description: 'User agent string' })
  @IsString()
  @IsOptional()
  userAgent?: string;

  @ApiPropertyOptional({ description: 'Behavioral data (form fill time, mouse movements, etc.)' })
  @IsObject()
  @IsOptional()
  behavioralData?: Record<string, any>;
}

export class CreateFraudCaseDto {
  @ApiProperty({ description: 'Fraud alert ID' })
  @IsString()
  alertId: string;

  @ApiProperty({ description: 'Case type', enum: FraudCaseType })
  @IsEnum(FraudCaseType)
  caseType: FraudCaseType;

  @ApiProperty({ description: 'Case description' })
  @IsString()
  description: string;
}

export class FraudAnalyticsFiltersDto {
  @ApiPropertyOptional({ description: 'Start date' })
  @IsString()
  @IsOptional()
  fromDate?: string;

  @ApiPropertyOptional({ description: 'End date' })
  @IsString()
  @IsOptional()
  toDate?: string;

  @ApiPropertyOptional({ description: 'Company ID' })
  @IsString()
  @IsOptional()
  companyId?: string;
}

