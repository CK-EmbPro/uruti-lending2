import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum, IsBoolean, IsObject, IsNumber, IsArray } from 'class-validator';

export enum AIModelType {
  PREDICTIVE = 'PREDICTIVE',
  CLASSIFICATION = 'CLASSIFICATION',
  NLP = 'NLP',
  COMPUTER_VISION = 'COMPUTER_VISION',
  RECOMMENDATION = 'RECOMMENDATION',
}

export enum PredictionType {
  DEFAULT_PROBABILITY = 'DEFAULT_PROBABILITY',
  PAYMENT_PROBABILITY = 'PAYMENT_PROBABILITY',
  FRAUD_PROBABILITY = 'FRAUD_PROBABILITY',
  CHURN_PROBABILITY = 'CHURN_PROBABILITY',
  APPROVAL_PROBABILITY = 'APPROVAL_PROBABILITY',
}

export class CreateAIModelDto {
  @ApiProperty({ description: 'Model name', example: 'Default Prediction v3.0' })
  @IsString()
  modelName: string;

  @ApiProperty({ description: 'Model type', enum: AIModelType })
  @IsEnum(AIModelType)
  modelType: AIModelType;

  @ApiProperty({ description: 'Model version', example: '3.0.0' })
  @IsString()
  modelVersion: string;

  @ApiPropertyOptional({ description: 'Model description', example: 'Advanced ML model for default prediction' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Model configuration', type: Object })
  @IsOptional()
  @IsObject()
  modelConfig?: Record<string, any>;
}

export class PredictDto {
  @ApiProperty({ description: 'Model ID', example: 'uuid' })
  @IsString()
  modelId: string;

  @ApiProperty({ description: 'Input features', type: Object })
  @IsObject()
  features: Record<string, any>;

  @ApiPropertyOptional({ description: 'Entity ID (if applicable)', example: 'uuid' })
  @IsOptional()
  @IsString()
  entityId?: string;
}

export class AIModelPrediction {
  @ApiProperty({ description: 'Prediction ID', example: 'uuid' })
  id: string;

  @ApiProperty({ description: 'Model ID', example: 'uuid' })
  modelId: string;

  @ApiProperty({ description: 'Prediction value', example: 0.85 })
  prediction: number;

  @ApiProperty({ description: 'Confidence', example: 0.92 })
  confidence: number;

  @ApiProperty({ description: 'Prediction type', enum: PredictionType })
  predictionType: PredictionType;

  @ApiProperty({ description: 'Input features', type: Object })
  inputFeatures: Record<string, any>;

  @ApiProperty({ description: 'Created date', example: '2024-01-15T00:00:00Z' })
  createdAt: Date;
}

export class AISentimentAnalysis {
  @ApiProperty({ description: 'Sentiment', example: 'POSITIVE' })
  sentiment: string;

  @ApiProperty({ description: 'Sentiment score', example: 0.85 })
  score: number;

  @ApiProperty({ description: 'Key phrases', type: [String] })
  keyPhrases: string[];

  @ApiProperty({ description: 'Entities', type: [Object] })
  entities: Array<{
    text: string;
    type: string;
    confidence: number;
  }>;
}

