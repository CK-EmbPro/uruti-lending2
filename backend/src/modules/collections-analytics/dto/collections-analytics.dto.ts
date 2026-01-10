import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum, IsDateString, IsNumber } from 'class-validator';

export enum CollectionStrategy {
  EARLY_STAGE = 'EARLY_STAGE',
  MODERATE_STAGE = 'MODERATE_STAGE',
  SERIOUS_STAGE = 'SERIOUS_STAGE',
  SEVERE_STAGE = 'SEVERE_STAGE',
  LEGAL = 'LEGAL',
}

export enum ContactChannel {
  EMAIL = 'EMAIL',
  SMS = 'SMS',
  PHONE = 'PHONE',
  LETTER = 'LETTER',
  IN_PERSON = 'IN_PERSON',
}

export class PaymentProbabilityPrediction {
  @ApiProperty({ description: 'Loan ID', example: 'uuid' })
  loanId: string;

  @ApiProperty({ description: 'Customer ID', example: 'uuid' })
  customerId: string;

  @ApiProperty({ description: 'Payment probability (0-1)', example: 0.75 })
  paymentProbability: number;

  @ApiProperty({ description: 'Optimal contact time', example: '14:00-16:00' })
  optimalContactTime: string;

  @ApiProperty({ description: 'Optimal channel', enum: ContactChannel })
  optimalChannel: ContactChannel;

  @ApiProperty({ description: 'Recommended strategy', enum: CollectionStrategy })
  recommendedStrategy: CollectionStrategy;

  @ApiProperty({ description: 'Risk factors', type: [String] })
  riskFactors: string[];

  @ApiProperty({ description: 'Confidence level', example: 0.85 })
  confidenceLevel: number;
}

export class CollectionEffectivenessAnalysis {
  @ApiProperty({ description: 'Channel effectiveness', type: Object })
  channelEffectiveness: Record<ContactChannel, {
    successRate: number;
    averageResponseTime: number;
    costPerContact: number;
    totalContacts: number;
  }>;

  @ApiProperty({ description: 'Time effectiveness', type: Object })
  timeEffectiveness: Record<string, {
    successRate: number;
    averageResponseTime: number;
    totalContacts: number;
  }>;

  @ApiProperty({ description: 'Strategy effectiveness', type: Object })
  strategyEffectiveness: Record<CollectionStrategy, {
    successRate: number;
    averageRecoveryAmount: number;
    averageDaysToRecovery: number;
  }>;

  @ApiProperty({ description: 'Collector performance', type: [Object] })
  collectorPerformance: Array<{
    collectorId: string;
    successRate: number;
    averageRecoveryAmount: number;
    totalRecovered: number;
  }>;
}

export class CollectionOptimizationRecommendation {
  @ApiProperty({ description: 'Loan ID', example: 'uuid' })
  loanId: string;

  @ApiProperty({ description: 'Recommended action', example: 'CONTACT_PHONE' })
  recommendedAction: string;

  @ApiProperty({ description: 'Recommended time', example: '2024-01-16T14:00:00Z' })
  recommendedTime: string;

  @ApiProperty({ description: 'Recommended channel', enum: ContactChannel })
  recommendedChannel: ContactChannel;

  @ApiProperty({ description: 'Expected success probability', example: 0.65 })
  expectedSuccessProbability: number;

  @ApiProperty({ description: 'Expected recovery amount', example: 5000 })
  expectedRecoveryAmount: number;

  @ApiProperty({ description: 'Reasoning', example: 'Customer historically responds well to phone calls in afternoon' })
  reasoning: string;
}

export class SettlementOffer {
  @ApiProperty({ description: 'Loan ID', example: 'uuid' })
  loanId: string;

  @ApiProperty({ description: 'Original amount', example: 10000 })
  originalAmount: number;

  @ApiProperty({ description: 'Settlement amount', example: 7500 })
  settlementAmount: number;

  @ApiProperty({ description: 'Discount percentage', example: 25 })
  discountPercentage: number;

  @ApiProperty({ description: 'Valid until', example: '2024-02-15T00:00:00Z' })
  validUntil: string;

  @ApiProperty({ description: 'Payment terms', example: '3 installments' })
  paymentTerms: string;

  @ApiProperty({ description: 'Acceptance probability', example: 0.7 })
  acceptanceProbability: number;
}

export class GetCollectionAnalyticsDto {
  @ApiPropertyOptional({ description: 'Start date (ISO format)', example: '2024-01-01' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'End date (ISO format)', example: '2024-12-31' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ description: 'Collection stage', enum: CollectionStrategy })
  @IsOptional()
  @IsEnum(CollectionStrategy)
  stage?: CollectionStrategy;
}

