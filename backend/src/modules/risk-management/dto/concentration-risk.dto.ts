import { IsDateString, IsOptional, IsString, IsEnum, IsNumber, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ConcentrationType } from '../entities/concentration-risk.entity';

export class AssessConcentrationRiskDto {
  @ApiProperty({
    description: 'Concentration type',
    enum: ConcentrationType,
    example: ConcentrationType.GEOGRAPHY,
  })
  @IsEnum(ConcentrationType)
  concentrationType: ConcentrationType;

  @ApiProperty({ description: 'Assessment date (ISO 8601)', example: '2024-12-31' })
  @IsDateString()
  @IsOptional()
  assessmentDate?: string;

  @ApiPropertyOptional({ description: 'Company ID' })
  @IsString()
  @IsOptional()
  companyId?: string;

  @ApiPropertyOptional({ description: 'Include loan breakdown', default: true })
  @IsBoolean()
  @IsOptional()
  includeLoanBreakdown?: boolean;
}

export class SetConcentrationLimitDto {
  @ApiProperty({ description: 'Concentration type', enum: ConcentrationType })
  @IsEnum(ConcentrationType)
  concentrationType: ConcentrationType;

  @ApiProperty({ description: 'Segment identifier' })
  @IsString()
  segmentIdentifier: string;

  @ApiPropertyOptional({ description: 'Limit percentage' })
  @IsNumber()
  @IsOptional()
  limitPercentage?: number;

  @ApiPropertyOptional({ description: 'Limit amount' })
  @IsNumber()
  @IsOptional()
  limitAmount?: number;
}

export class TakeCorrectiveActionDto {
  @ApiProperty({ description: 'Corrective action description' })
  @IsString()
  correctiveAction: string;

  @ApiPropertyOptional({ description: 'Remarks' })
  @IsString()
  @IsOptional()
  remarks?: string;
}

