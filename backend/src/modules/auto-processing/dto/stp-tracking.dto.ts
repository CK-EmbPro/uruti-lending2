import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsEnum, IsNumber, IsOptional, IsBoolean, IsDateString, IsArray } from 'class-validator';

export enum ProcessingType {
  AUTO_APPROVAL = 'AUTO_APPROVAL',
  AUTO_DISBURSEMENT = 'AUTO_DISBURSEMENT',
  AUTO_REPAYMENT = 'AUTO_REPAYMENT',
  MANUAL_REVIEW = 'MANUAL_REVIEW',
}

export enum ManualTrigger {
  FRAUD = 'FRAUD',
  GREY_ZONE = 'GREY_ZONE',
  QUALITY_ISSUE = 'QUALITY_ISSUE',
  LARGE_AMOUNT = 'LARGE_AMOUNT',
  ACCOUNT_VERIFICATION_FAILED = 'ACCOUNT_VERIFICATION_FAILED',
  DISBURSEMENT_FAILED = 'DISBURSEMENT_FAILED',
}

export enum CustomerSegment {
  REPEAT_BORROWER = 'REPEAT_BORROWER',
  NEW_STRONG_PROFILE = 'NEW_STRONG_PROFILE',
  NEW_WEAK_PROFILE = 'NEW_WEAK_PROFILE',
}

export enum QueuePriority {
  URGENT = 'URGENT',
  HIGH = 'HIGH',
  MEDIUM = 'MEDIUM',
  LOW = 'LOW',
}

export class STPMetricsDto {
  @ApiProperty({ description: 'Total applications processed' })
  totalProcessed: number;

  @ApiProperty({ description: 'Auto-processed applications' })
  autoProcessed: number;

  @ApiProperty({ description: 'STP rate percentage' })
  stpRate: number;

  @ApiProperty({ description: 'Segment-specific STP rates' })
  segmentRates: Record<CustomerSegment, number>;

  @ApiProperty({ description: 'Time period start' })
  periodStart: Date;

  @ApiProperty({ description: 'Time period end' })
  periodEnd: Date;
}

export class ManualReviewQueueItemDto {
  @ApiProperty({ description: 'Queue item ID' })
  id: string;

  @ApiProperty({ description: 'Application or loan ID' })
  entityId: string;

  @ApiProperty({ description: 'Processing type', enum: ProcessingType })
  processingType: ProcessingType;

  @ApiProperty({ description: 'Manual triggers', enum: ManualTrigger, isArray: true })
  triggers: ManualTrigger[];

  @ApiProperty({ description: 'Priority', enum: QueuePriority })
  priority: QueuePriority;

  @ApiProperty({ description: 'Priority score' })
  priorityScore: number;

  @ApiProperty({ description: 'Created timestamp' })
  createdAt: Date;

  @ApiPropertyOptional({ description: 'Assigned reviewer ID' })
  assignedTo?: string;

  @ApiPropertyOptional({ description: 'Review started timestamp' })
  reviewStartedAt?: Date;

  @ApiPropertyOptional({ description: 'Review completed timestamp' })
  reviewCompletedAt?: Date;
}

export class SLAMetricsDto {
  @ApiProperty({ description: 'Total reviews' })
  totalReviews: number;

  @ApiProperty({ description: 'Reviews within SLA' })
  withinSLA: number;

  @ApiProperty({ description: 'SLA compliance percentage' })
  complianceRate: number;

  @ApiProperty({ description: 'Average review time (minutes)' })
  averageReviewTime: number;

  @ApiProperty({ description: 'Time period' })
  period: { start: Date; end: Date };
}

