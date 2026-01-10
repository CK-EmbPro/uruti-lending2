import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum, IsBoolean, IsObject, IsNumber, IsArray, Min, Max } from 'class-validator';

export enum ModelType {
  DEFAULT_PREDICTION = 'DEFAULT_PREDICTION',
  RISK_SCORING = 'RISK_SCORING',
  FRAUD_DETECTION = 'FRAUD_DETECTION',
  PRICING_OPTIMIZATION = 'PRICING_OPTIMIZATION',
  COLLECTIONS_PREDICTION = 'COLLECTIONS_PREDICTION',
}

export enum ModelStatus {
  TRAINING = 'TRAINING',
  ACTIVE = 'ACTIVE',
  DEPRECATED = 'DEPRECATED',
  ARCHIVED = 'ARCHIVED',
}

export enum RiskLevel {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

export class CreateRiskModelDto {
  @ApiProperty({ description: 'Model name', example: 'Default Prediction v2.1' })
  @IsString()
  modelName: string;

  @ApiProperty({ description: 'Model type', enum: ModelType })
  @IsEnum(ModelType)
  modelType: ModelType;

  @ApiProperty({ description: 'Model version', example: '2.1.0' })
  @IsString()
  modelVersion: string;

  @ApiPropertyOptional({ description: 'Model description', example: 'ML model for predicting loan defaults' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Model configuration', type: Object })
  @IsOptional()
  @IsObject()
  modelConfig?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Feature list', type: [String] })
  @IsOptional()
  @IsArray()
  features?: string[];
}

export class TrainModelDto {
  @ApiProperty({ description: 'Model ID', example: 'uuid' })
  @IsString()
  modelId: string;

  @ApiPropertyOptional({ description: 'Training data start date (ISO format)', example: '2023-01-01T00:00:00Z' })
  @IsOptional()
  @IsString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'Training data end date (ISO format)', example: '2024-01-01T00:00:00Z' })
  @IsOptional()
  @IsString()
  endDate?: string;

  @ApiPropertyOptional({ description: 'Training parameters', type: Object })
  @IsOptional()
  @IsObject()
  trainingParams?: Record<string, any>;
}

export class PredictRiskDto {
  @ApiProperty({ description: 'Model ID', example: 'uuid' })
  @IsString()
  modelId: string;

  @ApiProperty({ description: 'Input features', type: Object })
  @IsObject()
  features: Record<string, any>;

  @ApiPropertyOptional({ description: 'Loan ID (if applicable)', example: 'uuid' })
  @IsOptional()
  @IsString()
  loanId?: string;

  @ApiPropertyOptional({ description: 'Customer ID (if applicable)', example: 'uuid' })
  @IsOptional()
  @IsString()
  customerId?: string;
}

export class RiskScore {
  @ApiProperty({ description: 'Risk score', example: 0.75 })
  riskScore: number;

  @ApiProperty({ description: 'Risk level', enum: RiskLevel })
  riskLevel: RiskLevel;

  @ApiProperty({ description: 'Confidence', example: 0.92 })
  confidence: number;

  @ApiProperty({ description: 'Risk factors', type: [Object] })
  riskFactors: Array<{
    factor: string;
    impact: number;
    description: string;
  }>;

  @ApiProperty({ description: 'Recommendations', type: [String] })
  recommendations: string[];
}

export class ModelPerformance {
  @ApiProperty({ description: 'Accuracy', example: 0.92 })
  accuracy: number;

  @ApiProperty({ description: 'Precision', example: 0.89 })
  precision: number;

  @ApiProperty({ description: 'Recall', example: 0.91 })
  recall: number;

  @ApiProperty({ description: 'F1 Score', example: 0.90 })
  f1Score: number;

  @ApiProperty({ description: 'AUC-ROC', example: 0.94 })
  aucRoc: number;

  @ApiProperty({ description: 'Confusion matrix', type: Object })
  confusionMatrix: {
    truePositive: number;
    trueNegative: number;
    falsePositive: number;
    falseNegative: number;
  };
}

export class EarlyWarningIndicator {
  @ApiProperty({ description: 'Indicator ID', example: 'uuid' })
  id: string;

  @ApiProperty({ description: 'Indicator name', example: 'Payment Pattern Change' })
  name: string;

  @ApiProperty({ description: 'Severity', enum: RiskLevel })
  severity: RiskLevel;

  @ApiProperty({ description: 'Description', example: 'Customer payment pattern has changed significantly' })
  description: string;

  @ApiProperty({ description: 'Triggered date', example: '2024-01-15T00:00:00Z' })
  triggeredDate: Date;

  @ApiProperty({ description: 'Loan ID', example: 'uuid' })
  loanId: string;
}

