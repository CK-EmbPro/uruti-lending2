import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum, IsBoolean, IsObject, IsNumber, IsArray, IsDateString, Min, Max } from 'class-validator';

export enum ServicingTaskType {
  PAYMENT_PROCESSING = 'PAYMENT_PROCESSING',
  DELINQUENCY_MANAGEMENT = 'DELINQUENCY_MANAGEMENT',
  DOCUMENT_GENERATION = 'DOCUMENT_GENERATION',
  COMMUNICATION = 'COMMUNICATION',
  ESCALATION = 'ESCALATION',
  REVIEW = 'REVIEW',
  OTHER = 'OTHER',
}

export enum ServicingTaskStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
}

export enum EscalationLevel {
  LEVEL_1 = 'LEVEL_1',
  LEVEL_2 = 'LEVEL_2',
  LEVEL_3 = 'LEVEL_3',
  EXECUTIVE = 'EXECUTIVE',
}

export enum PaymentRetryStrategy {
  IMMEDIATE = 'IMMEDIATE',
  EXPONENTIAL_BACKOFF = 'EXPONENTIAL_BACKOFF',
  FIXED_INTERVAL = 'FIXED_INTERVAL',
  CUSTOM = 'CUSTOM',
}

export class CreateServicingTaskDto {
  @ApiProperty({ description: 'Loan ID', example: 'uuid' })
  @IsString()
  loanId: string;

  @ApiProperty({ description: 'Task type', enum: ServicingTaskType })
  @IsEnum(ServicingTaskType)
  taskType: ServicingTaskType;

  @ApiProperty({ description: 'Task description', example: 'Process payment for loan LN-2024-001' })
  @IsString()
  description: string;

  @ApiPropertyOptional({ description: 'Priority (1-10)', example: 5 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(10)
  priority?: number;

  @ApiPropertyOptional({ description: 'Due date (ISO format)', example: '2024-02-15T00:00:00Z' })
  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @ApiPropertyOptional({ description: 'Task configuration', type: Object })
  @IsOptional()
  @IsObject()
  config?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Assigned to user ID', example: 'uuid' })
  @IsOptional()
  @IsString()
  assignedTo?: string;
}

export class CreateAutoEscalationRuleDto {
  @ApiProperty({ description: 'Rule name', example: 'Delinquency Level 1 Escalation' })
  @IsString()
  ruleName: string;

  @ApiProperty({ description: 'Trigger condition', example: 'daysPastDue >= 30' })
  @IsString()
  triggerCondition: string;

  @ApiProperty({ description: 'Escalation level', enum: EscalationLevel })
  @IsEnum(EscalationLevel)
  escalationLevel: EscalationLevel;

  @ApiPropertyOptional({ description: 'Actions to execute', type: [String] })
  @IsOptional()
  @IsArray()
  actions?: string[];

  @ApiPropertyOptional({ description: 'Is active', example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class PaymentRetryConfigDto {
  @ApiProperty({ description: 'Maximum retry attempts', example: 3 })
  @IsNumber()
  @Min(1)
  @Max(10)
  maxRetries: number;

  @ApiProperty({ description: 'Retry strategy', enum: PaymentRetryStrategy })
  @IsEnum(PaymentRetryStrategy)
  retryStrategy: PaymentRetryStrategy;

  @ApiPropertyOptional({ description: 'Retry interval (minutes)', example: 60 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  retryInterval?: number;

  @ApiPropertyOptional({ description: 'Custom retry schedule', type: [Number] })
  @IsOptional()
  @IsArray()
  customSchedule?: number[];
}

export class ServicingTask {
  @ApiProperty({ description: 'Task ID', example: 'uuid' })
  id: string;

  @ApiProperty({ description: 'Loan ID', example: 'uuid' })
  loanId: string;

  @ApiProperty({ description: 'Task type', enum: ServicingTaskType })
  taskType: ServicingTaskType;

  @ApiProperty({ description: 'Status', enum: ServicingTaskStatus })
  status: ServicingTaskStatus;

  @ApiProperty({ description: 'Description' })
  description: string;

  @ApiProperty({ description: 'Priority', example: 5 })
  priority: number;

  @ApiProperty({ description: 'Due date', example: '2024-02-15T00:00:00Z' })
  dueDate: Date;

  @ApiProperty({ description: 'Created date', example: '2024-01-15T00:00:00Z' })
  createdAt: Date;

  @ApiProperty({ description: 'Completed date', example: '2024-01-16T00:00:00Z' })
  completedAt?: Date;
}

export class DelinquencySummary {
  @ApiProperty({ description: 'Total delinquent loans', example: 150 })
  totalDelinquentLoans: number;

  @ApiProperty({ description: 'Total delinquent amount', example: 2500000 })
  totalDelinquentAmount: number;

  @ApiProperty({ description: 'By days past due', type: Object })
  byDaysPastDue: {
    '1-30': { count: number; amount: number };
    '31-60': { count: number; amount: number };
    '61-90': { count: number; amount: number };
    '90+': { count: number; amount: number };
  };

  @ApiProperty({ description: 'Escalation breakdown', type: Object })
  escalationBreakdown: {
    [key: string]: { count: number; amount: number };
  };
}

