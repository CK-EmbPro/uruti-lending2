import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum, IsObject, IsArray, IsDateString } from 'class-validator';

export enum JourneyStage {
  AWARENESS = 'AWARENESS',
  INTEREST = 'INTEREST',
  CONSIDERATION = 'CONSIDERATION',
  APPLICATION = 'APPLICATION',
  APPROVAL = 'APPROVAL',
  DISBURSEMENT = 'DISBURSEMENT',
  ACTIVE_LOAN = 'ACTIVE_LOAN',
  REPAYMENT = 'REPAYMENT',
  CLOSURE = 'CLOSURE',
  RETENTION = 'RETENTION',
}

export enum TouchpointType {
  WEBSITE_VISIT = 'WEBSITE_VISIT',
  CALCULATOR_USE = 'CALCULATOR_USE',
  APPLICATION_START = 'APPLICATION_START',
  APPLICATION_SUBMIT = 'APPLICATION_SUBMIT',
  DOCUMENT_UPLOAD = 'DOCUMENT_UPLOAD',
  APPROVAL_NOTIFICATION = 'APPROVAL_NOTIFICATION',
  LOAN_DISBURSEMENT = 'LOAN_DISBURSEMENT',
  PAYMENT = 'PAYMENT',
  SUPPORT_CONTACT = 'SUPPORT_CONTACT',
  PORTAL_LOGIN = 'PORTAL_LOGIN',
}

export class GetCustomerJourneyDto {
  @ApiProperty({ description: 'Customer ID', example: 'uuid' })
  @IsString()
  customerId: string;

  @ApiPropertyOptional({ description: 'Start date (ISO format)', example: '2024-01-01' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'End date (ISO format)', example: '2024-12-31' })
  @IsOptional()
  @IsDateString()
  endDate?: string;
}

export class CustomerJourneyResult {
  @ApiProperty({ description: 'Customer ID', example: 'uuid' })
  customerId: string;

  @ApiProperty({ description: 'Current stage', enum: JourneyStage })
  currentStage: JourneyStage;

  @ApiProperty({ description: 'Journey timeline', type: [Object] })
  timeline: Array<{
    date: string;
    stage: JourneyStage;
    touchpoint: TouchpointType;
    description: string;
    metadata: Record<string, any>;
  }>;

  @ApiProperty({ description: 'Time in each stage (days)', type: Object })
  timeInStages: Record<JourneyStage, number>;

  @ApiProperty({ description: 'Total journey duration (days)', example: 45 })
  totalDuration: number;

  @ApiProperty({ description: 'Conversion rate', example: 0.75 })
  conversionRate: number;

  @ApiProperty({ description: 'Drop-off points', type: [Object] })
  dropOffPoints: Array<{
    stage: JourneyStage;
    date: string;
    reason: string;
  }>;

  @ApiProperty({ description: 'Engagement score (0-100)', example: 85 })
  engagementScore: number;

  @ApiProperty({ description: 'Next recommended actions', type: [String] })
  recommendedActions: string[];
}

export class JourneyAnalytics {
  @ApiProperty({ description: 'Average time in each stage', type: Object })
  averageTimeInStages: Record<JourneyStage, number>;

  @ApiProperty({ description: 'Stage conversion rates', type: Object })
  stageConversionRates: Record<JourneyStage, number>;

  @ApiProperty({ description: 'Drop-off analysis', type: Object })
  dropOffAnalysis: {
    highestDropOffStage: JourneyStage;
    dropOffRate: number;
    reasons: Array<{ stage: JourneyStage; count: number; percentage: number }>;
  };

  @ApiProperty({ description: 'Touchpoint effectiveness', type: [Object] })
  touchpointEffectiveness: Array<{
    touchpoint: TouchpointType;
    count: number;
    conversionRate: number;
    averageTimeToNext: number;
  }>;

  @ApiProperty({ description: 'Journey paths', type: [Object] })
  journeyPaths: Array<{
    path: JourneyStage[];
    count: number;
    percentage: number;
    averageDuration: number;
  }>;
}

