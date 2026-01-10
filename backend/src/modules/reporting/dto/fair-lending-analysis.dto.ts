import { IsDateString, IsOptional, IsString, IsEnum, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { FairLendingAnalysisType } from '../entities/fair-lending-analysis.entity';

export class FairLendingAnalysisDto {
  @ApiProperty({
    description: 'Analysis type',
    enum: FairLendingAnalysisType,
    example: FairLendingAnalysisType.APPROVAL_RATE,
  })
  @IsEnum(FairLendingAnalysisType)
  @IsOptional()
  analysisType?: FairLendingAnalysisType;

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
}

export class ReviewFairLendingAnalysisDto {
  @ApiPropertyOptional({ description: 'Review remarks' })
  @IsString()
  @IsOptional()
  remarks?: string;

  @ApiPropertyOptional({ description: 'Mark as reviewed', default: true })
  @IsBoolean()
  @IsOptional()
  reviewed?: boolean;

  @ApiPropertyOptional({ description: 'Corrective action required', default: false })
  @IsBoolean()
  @IsOptional()
  correctiveActionRequired?: boolean;

  @ApiPropertyOptional({ description: 'Corrective action plan' })
  @IsString()
  @IsOptional()
  correctiveActionPlan?: string;
}

