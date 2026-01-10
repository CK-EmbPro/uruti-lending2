import { IsDateString, IsOptional, IsString, IsEnum, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SignalType, SignalStatus } from '../entities/early-warning-signal.entity';

export class DetectEarlyWarningSignalsDto {
  @ApiPropertyOptional({ description: 'Loan ID (if specific loan)' })
  @IsString()
  @IsOptional()
  loanId?: string;

  @ApiPropertyOptional({ description: 'Signal type filter', enum: SignalType })
  @IsEnum(SignalType)
  @IsOptional()
  signalType?: SignalType;

  @ApiPropertyOptional({ description: 'Analysis date (ISO 8601)' })
  @IsDateString()
  @IsOptional()
  analysisDate?: string;

  @ApiPropertyOptional({ description: 'Company ID' })
  @IsString()
  @IsOptional()
  companyId?: string;
}

export class InvestigateSignalDto {
  @ApiProperty({ description: 'Investigation notes' })
  @IsString()
  investigationNotes: string;

  @ApiPropertyOptional({ description: 'Requires action', default: false })
  @IsBoolean()
  @IsOptional()
  requiresAction?: boolean;

  @ApiPropertyOptional({ description: 'Recommended action' })
  @IsString()
  @IsOptional()
  recommendedAction?: string;
}

export class ResolveSignalDto {
  @ApiProperty({ description: 'Resolution notes' })
  @IsString()
  resolutionNotes: string;

  @ApiPropertyOptional({ description: 'Remarks' })
  @IsString()
  @IsOptional()
  remarks?: string;
}

