import { IsDateString, IsOptional, IsString, IsEnum, IsBoolean, IsNumber, IsObject } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ScreeningType, ScreeningStatus, MatchSeverity } from '../entities/kyc-screening.entity';

export class PerformScreeningDto {
  @ApiProperty({ description: 'Application ID' })
  @IsString()
  applicationId: string;

  @ApiProperty({
    description: 'Screening type',
    enum: ScreeningType,
    example: ScreeningType.OFAC,
  })
  @IsEnum(ScreeningType)
  @IsOptional()
  screeningType?: ScreeningType;

  @ApiPropertyOptional({ description: 'Screening date (ISO 8601)' })
  @IsDateString()
  @IsOptional()
  screeningDate?: string;
}

export class InvestigateMatchDto {
  @ApiProperty({ description: 'Investigation notes' })
  @IsString()
  investigationNotes: string;

  @ApiPropertyOptional({ description: 'Requires SAR filing', default: false })
  @IsBoolean()
  @IsOptional()
  requiresSAR?: boolean;
}

export class FileSARDto {
  @ApiProperty({ description: 'SAR reference number' })
  @IsString()
  sarReference: string;

  @ApiPropertyOptional({ description: 'SAR notes' })
  @IsString()
  @IsOptional()
  sarNotes?: string;
}

export class ResolveScreeningDto {
  @ApiProperty({ description: 'Resolution notes' })
  @IsString()
  resolutionNotes: string;

  @ApiPropertyOptional({ description: 'Remarks' })
  @IsString()
  @IsOptional()
  remarks?: string;
}

