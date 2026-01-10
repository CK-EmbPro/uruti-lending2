import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum, IsUUID, IsNumber, Min, Max } from 'class-validator';
import { PredictionType } from '../entities/prediction-result.entity';

export class PredictDefaultProbabilityDto {
  @ApiProperty({ description: 'Loan ID or Application ID' })
  @IsString()
  entityId: string;

  @ApiPropertyOptional({ description: 'Entity type', enum: ['loan', 'application'], default: 'loan' })
  @IsString()
  @IsOptional()
  entityType?: 'loan' | 'application';

  @ApiPropertyOptional({ description: 'Time horizon in days', default: 90 })
  @IsNumber()
  @Min(1)
  @Max(365)
  @IsOptional()
  timeHorizon?: number;
}

export class PredictCustomerLifetimeValueDto {
  @ApiProperty({ description: 'Customer ID' })
  @IsString()
  customerId: string;

  @ApiPropertyOptional({ description: 'Time horizon in months', default: 36 })
  @IsNumber()
  @Min(1)
  @Max(120)
  @IsOptional()
  timeHorizon?: number;
}

export class PredictChurnRiskDto {
  @ApiProperty({ description: 'Customer ID' })
  @IsString()
  customerId: string;
}

export class PredictOptimalPricingDto {
  @ApiProperty({ description: 'Loan Application ID' })
  @IsString()
  applicationId: string;

  @ApiPropertyOptional({ description: 'Requested loan amount' })
  @IsNumber()
  @IsOptional()
  requestedAmount?: number;

  @ApiPropertyOptional({ description: 'Loan term in months' })
  @IsNumber()
  @IsOptional()
  loanTerm?: number;
}

export class BatchPredictionDto {
  @ApiProperty({ description: 'Prediction type', enum: PredictionType })
  @IsEnum(PredictionType)
  predictionType: PredictionType;

  @ApiProperty({ description: 'Array of entity IDs' })
  @IsString({ each: true })
  entityIds: string[];

  @ApiPropertyOptional({ description: 'Entity type', enum: ['loan', 'customer', 'application'] })
  @IsString()
  @IsOptional()
  entityType?: string;
}

