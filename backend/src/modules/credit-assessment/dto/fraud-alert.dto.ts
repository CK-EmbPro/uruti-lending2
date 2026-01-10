import { IsString, IsOptional, IsEnum, IsBoolean, IsObject } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { FraudAlertStatus, FraudAlertSeverity } from '../entities/fraud-alert.entity';

export class CreateFraudAlertDto {
  @ApiProperty({ description: 'Loan application ID', example: 'uuid-application-1' })
  @IsString()
  applicationId: string;

  @ApiProperty({ description: 'Alert type', example: 'Identity Mismatch' })
  @IsString()
  alertType: string;

  @ApiProperty({ description: 'Alert description', example: 'Name on application does not match ID document' })
  @IsString()
  description: string;

  @ApiProperty({ description: 'Detected patterns', example: { nameMismatch: true, addressMismatch: false } })
  @IsObject()
  detectedPatterns: Record<string, any>;

  @ApiPropertyOptional({ description: 'Alert severity', enum: FraudAlertSeverity, default: FraudAlertSeverity.MEDIUM })
  @IsEnum(FraudAlertSeverity)
  @IsOptional()
  severity?: FraudAlertSeverity;
}

export class UpdateFraudAlertDto {
  @ApiPropertyOptional({ description: 'Assigned to user ID', example: 'uuid-user-1' })
  @IsString()
  @IsOptional()
  assignedTo?: string;

  @ApiPropertyOptional({ description: 'Investigation notes', example: 'Verified identity documents' })
  @IsString()
  @IsOptional()
  investigationNotes?: string;

  @ApiPropertyOptional({ description: 'Resolution', example: 'False positive - documents verified' })
  @IsString()
  @IsOptional()
  resolution?: string;

  @ApiPropertyOptional({ description: 'Identity verified', default: false })
  @IsBoolean()
  @IsOptional()
  identityVerified?: boolean;

  @ApiPropertyOptional({ description: 'Reported to law enforcement', default: false })
  @IsBoolean()
  @IsOptional()
  reportedToLawEnforcement?: boolean;

  @ApiPropertyOptional({ description: 'Alert status', enum: FraudAlertStatus })
  @IsEnum(FraudAlertStatus)
  @IsOptional()
  status?: FraudAlertStatus;

  @ApiPropertyOptional({ description: 'Evidence collected', example: { documents: ['id1', 'id2'] } })
  @IsObject()
  @IsOptional()
  evidence?: Record<string, any>;
}

