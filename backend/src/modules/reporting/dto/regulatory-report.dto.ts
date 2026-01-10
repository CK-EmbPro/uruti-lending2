import { IsDateString, IsOptional, IsString, IsEnum, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { RegulatoryReportType } from '../entities/regulatory-report.entity';

export class GenerateRegulatoryReportDto {
  @ApiProperty({
    description: 'Report type',
    enum: RegulatoryReportType,
    example: RegulatoryReportType.HMDA,
  })
  @IsEnum(RegulatoryReportType)
  reportType: RegulatoryReportType;

  @ApiProperty({ description: 'Report date (ISO 8601)', example: '2024-12-31' })
  @IsDateString()
  reportDate: string;

  @ApiPropertyOptional({ description: 'Period start date (ISO 8601)' })
  @IsDateString()
  @IsOptional()
  periodStartDate?: string;

  @ApiPropertyOptional({ description: 'Period end date (ISO 8601)' })
  @IsDateString()
  @IsOptional()
  periodEndDate?: string;

  @ApiPropertyOptional({ description: 'Company ID' })
  @IsString()
  @IsOptional()
  companyId?: string;
}

export class ReviewRegulatoryReportDto {
  @ApiPropertyOptional({ description: 'Review remarks' })
  @IsString()
  @IsOptional()
  remarks?: string;

  @ApiPropertyOptional({ description: 'Mark as reviewed', default: true })
  @IsBoolean()
  @IsOptional()
  reviewed?: boolean;
}

export class SubmitRegulatoryReportDto {
  @ApiProperty({ description: 'Regulator name' })
  @IsString()
  regulatorName: string;

  @ApiPropertyOptional({ description: 'Submission reference number' })
  @IsString()
  @IsOptional()
  submissionReference?: string;

  @ApiPropertyOptional({ description: 'Submission remarks' })
  @IsString()
  @IsOptional()
  remarks?: string;
}

