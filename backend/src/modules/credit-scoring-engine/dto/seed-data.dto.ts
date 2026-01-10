import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsObject, Min, Max, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';

export class GenerateSeedDataDto {
  @ApiProperty({ description: 'Number of training samples to generate', default: 1000 })
  @IsNumber()
  @Min(10, { message: 'Minimum 10 samples required' })
  @Max(100000, { message: 'Maximum 100,000 samples allowed' })
  @Type(() => Number)
  sampleCount: number;

  @ApiPropertyOptional({ description: 'Include high-risk samples', default: true })
  @IsOptional()
  includeHighRisk?: boolean;

  @ApiPropertyOptional({ description: 'Include low-risk samples', default: true })
  @IsOptional()
  includeLowRisk?: boolean;

  @ApiPropertyOptional({ description: 'Include medium-risk samples', default: true })
  @IsOptional()
  includeMediumRisk?: boolean;

  @ApiPropertyOptional({ description: 'Date range for historical data' })
  @IsOptional()
  @IsObject()
  dateRange?: {
    start: string; // ISO date string
    end: string; // ISO date string
  };

  @ApiPropertyOptional({ description: 'Risk distribution (percentages)', default: { high: 0.2, medium: 0.4, low: 0.4 } })
  @IsOptional()
  @IsObject()
  riskDistribution?: {
    high: number;
    medium: number;
    low: number;
  };
}

export class GenerateAndTrainDto {
  @ApiProperty({ description: 'Number of training samples to generate', default: 1000 })
  @IsNumber()
  @Min(10)
  @Max(100000)
  @Type(() => Number)
  sampleCount: number;

  @ApiPropertyOptional({ description: 'Model type', default: 'credit_score' })
  @IsOptional()
  modelType?: string;

  @ApiPropertyOptional({ description: 'Hyperparameters' })
  @IsOptional()
  @IsObject()
  hyperparameters?: {
    maxDepth?: number;
    learningRate?: number;
    nEstimators?: number;
    subsample?: number;
    colsampleByTree?: number;
  };

  @ApiPropertyOptional({ description: 'Auto-activate model after training', default: false })
  @IsOptional()
  autoActivate?: boolean;

  @ApiPropertyOptional({ description: 'Traffic percentage if auto-activating', default: 0 })
  @IsOptional()
  @Min(0)
  @Max(100)
  trafficPercentage?: number;
}

