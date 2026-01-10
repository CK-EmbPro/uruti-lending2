import { IsDateString, IsOptional, IsString, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AnalysisType } from '../entities/roll-rate-analysis.entity';

export class RollRateAnalysisDto {
  @ApiProperty({
    description: 'Analysis type',
    enum: AnalysisType,
    example: AnalysisType.ROLL_RATE,
  })
  @IsEnum(AnalysisType)
  @IsOptional()
  analysisType?: AnalysisType;

  @ApiProperty({ description: 'Analysis date (ISO 8601)', example: '2024-12-31' })
  @IsDateString()
  @IsOptional()
  analysisDate?: string;

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

  @ApiPropertyOptional({ description: 'Loan Product ID' })
  @IsString()
  @IsOptional()
  loanProductId?: string;

  @ApiPropertyOptional({ description: 'Include forecast', default: true })
  @IsOptional()
  includeForecast?: boolean;

  @ApiPropertyOptional({ description: 'Include vintage analysis', default: false })
  @IsOptional()
  includeVintage?: boolean;

  @ApiPropertyOptional({ description: 'Include cohort analysis', default: false })
  @IsOptional()
  includeCohort?: boolean;
}

