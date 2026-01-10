import { IsDateString, IsOptional, IsString, IsEnum, IsNumber, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { RevaluationType } from '../entities/collateral-revaluation.entity';

export class InitiateRevaluationDto {
  @ApiProperty({ description: 'Loan ID' })
  @IsString()
  loanId: string;

  @ApiPropertyOptional({ description: 'Security ID (if specific security)' })
  @IsString()
  @IsOptional()
  securityId?: string;

  @ApiProperty({
    description: 'Revaluation type',
    enum: RevaluationType,
    example: RevaluationType.AUTOMATED,
  })
  @IsEnum(RevaluationType)
  @IsOptional()
  revaluationType?: RevaluationType;

  @ApiPropertyOptional({ description: 'Revaluation date (ISO 8601)' })
  @IsDateString()
  @IsOptional()
  revaluationDate?: string;
}

export class UpdateValuationDto {
  @ApiProperty({ description: 'New valuation amount' })
  @IsNumber()
  newValuation: number;

  @ApiProperty({ description: 'Valuation effective date (ISO 8601)' })
  @IsDateString()
  valuationEffectiveDate: string;

  @ApiPropertyOptional({ description: 'Valuation source' })
  @IsString()
  @IsOptional()
  valuationSource?: string;

  @ApiPropertyOptional({ description: 'Valuation reference' })
  @IsString()
  @IsOptional()
  valuationReference?: string;

  @ApiPropertyOptional({ description: 'Valuation notes' })
  @IsString()
  @IsOptional()
  valuationNotes?: string;

  @ApiPropertyOptional({ description: 'Appraisal details (JSON)' })
  @IsOptional()
  appraisalDetails?: any;
}

export class TakeRevaluationActionDto {
  @ApiProperty({ description: 'Required action description' })
  @IsString()
  requiredAction: string;

  @ApiPropertyOptional({ description: 'Remarks' })
  @IsString()
  @IsOptional()
  remarks?: string;
}

