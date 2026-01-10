import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum, IsObject, IsArray, IsBoolean, IsDateString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export enum CampaignType {
  EMAIL = 'EMAIL',
  SMS = 'SMS',
  PUSH = 'PUSH',
  IN_APP = 'IN_APP',
  MULTI_CHANNEL = 'MULTI_CHANNEL',
}

export enum CampaignStatus {
  DRAFT = 'DRAFT',
  SCHEDULED = 'SCHEDULED',
  RUNNING = 'RUNNING',
  PAUSED = 'PAUSED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export enum TriggerEvent {
  CUSTOMER_CREATED = 'CUSTOMER_CREATED',
  APPLICATION_SUBMITTED = 'APPLICATION_SUBMITTED',
  APPLICATION_APPROVED = 'APPLICATION_APPROVED',
  APPLICATION_REJECTED = 'APPLICATION_REJECTED',
  LOAN_DISBURSED = 'LOAN_DISBURSED',
  PAYMENT_MISSED = 'PAYMENT_MISSED',
  PAYMENT_RECEIVED = 'PAYMENT_RECEIVED',
  LOAN_CLOSED = 'LOAN_CLOSED',
  DOCUMENT_UPLOADED = 'DOCUMENT_UPLOADED',
  CUSTOM = 'CUSTOM',
}

export class SegmentCriteria {
  @ApiProperty({ description: 'Field name', example: 'creditScore' })
  @IsString()
  field: string;

  @ApiProperty({ description: 'Operator', example: '>=', enum: ['>', '<', '>=', '<=', '==', '!=', 'in', 'contains'] })
  @IsString()
  operator: string;

  @ApiProperty({ description: 'Value', example: 700 })
  value: any;
}

export class CreateCampaignDto {
  @ApiProperty({ description: 'Campaign name', example: 'Welcome Email Series' })
  @IsString()
  campaignName: string;

  @ApiProperty({ description: 'Campaign type', enum: CampaignType })
  @IsEnum(CampaignType)
  campaignType: CampaignType;

  @ApiProperty({ description: 'Campaign description', example: 'Welcome series for new customers' })
  @IsString()
  description: string;

  @ApiPropertyOptional({ description: 'Subject line (for email)', example: 'Welcome to Uruti Lending!' })
  @IsOptional()
  @IsString()
  subject?: string;

  @ApiProperty({ description: 'Message content', example: 'Welcome to our platform...' })
  @IsString()
  content: string;

  @ApiPropertyOptional({ description: 'Trigger event (if automated)', enum: TriggerEvent })
  @IsOptional()
  @IsEnum(TriggerEvent)
  triggerEvent?: TriggerEvent;

  @ApiPropertyOptional({ description: 'Scheduled send date (ISO format)', example: '2024-01-20T10:00:00Z' })
  @IsOptional()
  @IsDateString()
  scheduledDate?: string;

  @ApiPropertyOptional({ description: 'Segment criteria', type: [SegmentCriteria] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SegmentCriteria)
  segmentCriteria?: SegmentCriteria[];

  @ApiPropertyOptional({ description: 'Customer IDs (if manual)', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  customerIds?: string[];

  @ApiPropertyOptional({ description: 'Is A/B test', default: false })
  @IsOptional()
  @IsBoolean()
  isABTest?: boolean;

  @ApiPropertyOptional({ description: 'A/B test variants', type: [Object] })
  @IsOptional()
  @IsArray()
  abTestVariants?: Array<{
    variant: string;
    subject?: string;
    content: string;
    percentage: number;
  }>;
}

export class CampaignResult {
  @ApiProperty({ description: 'Campaign ID', example: 'uuid' })
  id: string;

  @ApiProperty({ description: 'Campaign name', example: 'Welcome Email Series' })
  campaignName: string;

  @ApiProperty({ description: 'Campaign type', enum: CampaignType })
  campaignType: CampaignType;

  @ApiProperty({ description: 'Status', enum: CampaignStatus })
  status: CampaignStatus;

  @ApiProperty({ description: 'Total recipients', example: 150 })
  totalRecipients: number;

  @ApiProperty({ description: 'Sent count', example: 150 })
  sentCount: number;

  @ApiProperty({ description: 'Delivered count', example: 145 })
  deliveredCount: number;

  @ApiProperty({ description: 'Opened count', example: 120 })
  openedCount: number;

  @ApiProperty({ description: 'Clicked count', example: 80 })
  clickedCount: number;

  @ApiProperty({ description: 'Conversion count', example: 25 })
  conversionCount: number;

  @ApiProperty({ description: 'Open rate (%)', example: 80 })
  openRate: number;

  @ApiProperty({ description: 'Click rate (%)', example: 53.33 })
  clickRate: number;

  @ApiProperty({ description: 'Conversion rate (%)', example: 16.67 })
  conversionRate: number;
}

export class CampaignAnalytics {
  @ApiProperty({ description: 'Campaign ID', example: 'uuid' })
  campaignId: string;

  @ApiProperty({ description: 'Performance metrics', type: Object })
  metrics: {
    totalRecipients: number;
    sent: number;
    delivered: number;
    opened: number;
    clicked: number;
    converted: number;
    bounced: number;
    unsubscribed: number;
  };

  @ApiProperty({ description: 'Rates (%)', type: Object })
  rates: {
    deliveryRate: number;
    openRate: number;
    clickRate: number;
    conversionRate: number;
    bounceRate: number;
    unsubscribeRate: number;
  };

  @ApiProperty({ description: 'Time-series data', type: [Object] })
  timeSeries: Array<{
    date: string;
    sent: number;
    opened: number;
    clicked: number;
    converted: number;
  }>;
}

