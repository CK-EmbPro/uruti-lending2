import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsObject, IsNumber, IsArray, ValidateNested, IsEnum, Min, Max, MinLength } from 'class-validator';
import { Type } from 'class-transformer';

export enum ModelType {
  CREDIT_SCORE = 'credit_score',
  FRAUD_DETECTION = 'fraud_detection',
  DEFAULT_PREDICTION = 'default_prediction',
}

export class TrainingSampleDto {
  @ApiProperty({ description: 'Feature values' })
  @IsObject()
  features: Record<string, any>;

  @ApiProperty({ description: 'Target credit score (300-850)' })
  @IsNumber()
  @Min(300, { message: 'Target score must be at least 300' })
  @Max(850, { message: 'Target score must be at most 850' })
  target: number;
}

export class TrainModelDto {
  @ApiProperty({ description: 'Training samples (minimum 10 recommended, 100+ for best results)', type: [TrainingSampleDto] })
  @IsArray()
  @MinLength(1, { message: 'At least one training sample is required' })
  @ValidateNested({ each: true })
  @Type(() => TrainingSampleDto)
  samples: TrainingSampleDto[];

  @ApiPropertyOptional({ description: 'Feature names' })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  featureNames?: string[];

  @ApiPropertyOptional({ description: 'Model type', enum: ModelType, default: ModelType.CREDIT_SCORE })
  @IsEnum(ModelType)
  @IsOptional()
  modelType?: ModelType;

  @ApiPropertyOptional({ description: 'Hyperparameters' })
  @IsObject()
  @IsOptional()
  hyperparameters?: {
    maxDepth?: number;
    learningRate?: number;
    nEstimators?: number;
    subsample?: number;
    colsampleByTree?: number;
  };
}

export class ActivateModelDto {
  @ApiProperty({ description: 'Model version ID' })
  @IsString()
  versionId: string;

  @ApiPropertyOptional({ description: 'Traffic percentage (0-100)', default: 100 })
  @IsNumber()
  @Min(0, { message: 'Traffic percentage must be at least 0' })
  @Max(100, { message: 'Traffic percentage must be at most 100' })
  @IsOptional()
  trafficPercentage?: number;
}

export class ModelVersionDto {
  @ApiProperty({ description: 'Model version ID' })
  id: string;

  @ApiProperty({ description: 'Model type', enum: ModelType })
  modelType: ModelType;

  @ApiProperty({ description: 'Version string' })
  version: string;

  @ApiProperty({ description: 'Model metrics' })
  metrics: {
    accuracy: number;
    mae: number;
    rmse: number;
    r2: number;
  };

  @ApiProperty({ description: 'Hyperparameters' })
  hyperparameters: Record<string, any>;

  @ApiProperty({ description: 'Is active' })
  isActive: boolean;

  @ApiProperty({ description: 'Traffic percentage' })
  trafficPercentage: number;

  @ApiProperty({ description: 'Created at' })
  createdAt: Date;

  @ApiPropertyOptional({ description: 'Activated at' })
  activatedAt?: Date;

  @ApiProperty({ description: 'Prediction count' })
  predictionCount: number;

  @ApiProperty({ description: 'Last updated' })
  lastUpdated: Date;
}

export class ModelMetricsDto {
  @ApiProperty({ description: 'Accuracy' })
  accuracy: number;

  @ApiProperty({ description: 'Mean Absolute Error' })
  mae: number;

  @ApiProperty({ description: 'Root Mean Squared Error' })
  rmse: number;

  @ApiProperty({ description: 'R-squared' })
  r2: number;

  @ApiPropertyOptional({ description: 'Prediction count' })
  predictionCount?: number;

  @ApiPropertyOptional({ description: 'Last updated' })
  lastUpdated?: Date;
}

export class ModelComparisonDto {
  @ApiProperty({ description: 'Version 1 info' })
  version1: {
    id: string;
    metrics: ModelMetricsDto;
    predictionCount: number;
  };

  @ApiProperty({ description: 'Version 2 info' })
  version2: {
    id: string;
    metrics: ModelMetricsDto;
    predictionCount: number;
  };

  @ApiProperty({ description: 'Winner version ID' })
  winner: string;

  @ApiProperty({ description: 'Improvement metrics' })
  improvement: {
    rmseImprovement: number;
    r2Improvement: number;
    accuracyImprovement: number;
    overallImprovement: number;
  };
}

