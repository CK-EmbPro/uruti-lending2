import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum, IsObject, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export enum TriggerType {
  EVENT = 'EVENT',
  SCHEDULE = 'SCHEDULE',
  CONDITION = 'CONDITION',
}

export enum EventType {
  LOAN_APPLICATION_SUBMITTED = 'LOAN_APPLICATION_SUBMITTED',
  LOAN_APPLICATION_APPROVED = 'LOAN_APPLICATION_APPROVED',
  LOAN_APPLICATION_REJECTED = 'LOAN_APPLICATION_REJECTED',
  LOAN_DISBURSED = 'LOAN_DISBURSED',
  PAYMENT_MISSED = 'PAYMENT_MISSED',
  PAYMENT_RECEIVED = 'PAYMENT_RECEIVED',
  DOCUMENT_UPLOADED = 'DOCUMENT_UPLOADED',
  DOCUMENT_VERIFIED = 'DOCUMENT_VERIFIED',
  LOAN_CLOSED = 'LOAN_CLOSED',
  LOAN_NPA = 'LOAN_NPA',
  CUSTOMER_CREATED = 'CUSTOMER_CREATED',
}

export enum ScheduleFrequency {
  DAILY = 'DAILY',
  WEEKLY = 'WEEKLY',
  MONTHLY = 'MONTHLY',
  CUSTOM = 'CUSTOM',
}

export class ConditionDto {
  @ApiProperty({ description: 'Field to check', example: 'loanAmount' })
  @IsString()
  field: string;

  @ApiProperty({ description: 'Operator', example: '>', enum: ['>', '<', '>=', '<=', '==', '!=', 'in', 'contains'] })
  @IsString()
  operator: string;

  @ApiProperty({ description: 'Value to compare', example: 100000 })
  value: any;
}

export class CreateWorkflowTriggerDto {
  @ApiProperty({ description: 'Workflow ID', example: 'uuid' })
  @IsString()
  workflowId: string;

  @ApiProperty({ description: 'Trigger name', example: 'Auto-route High-Value Applications' })
  @IsString()
  triggerName: string;

  @ApiProperty({ description: 'Trigger type', enum: TriggerType })
  @IsEnum(TriggerType)
  triggerType: TriggerType;

  @ApiPropertyOptional({ description: 'Event type (if EVENT trigger)', enum: EventType })
  @IsOptional()
  @IsEnum(EventType)
  eventType?: EventType;

  @ApiPropertyOptional({ description: 'Entity type filter', example: 'LoanApplication' })
  @IsOptional()
  @IsString()
  entityType?: string;

  @ApiPropertyOptional({ description: 'Schedule frequency (if SCHEDULE trigger)', enum: ScheduleFrequency })
  @IsOptional()
  @IsEnum(ScheduleFrequency)
  scheduleFrequency?: ScheduleFrequency;

  @ApiPropertyOptional({ description: 'Schedule time (HH:mm format)', example: '09:00' })
  @IsOptional()
  @IsString()
  scheduleTime?: string;

  @ApiPropertyOptional({ description: 'Schedule days (for WEEKLY)', example: ['MONDAY', 'WEDNESDAY'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  scheduleDays?: string[];

  @ApiPropertyOptional({ description: 'Conditions (if CONDITION trigger)', type: [ConditionDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ConditionDto)
  conditions?: ConditionDto[];

  @ApiPropertyOptional({ description: 'Is active', default: true })
  @IsOptional()
  isActive?: boolean;
}

export class WorkflowTriggerResult {
  @ApiProperty({ description: 'Trigger ID', example: 'uuid' })
  id: string;

  @ApiProperty({ description: 'Trigger name', example: 'Auto-route High-Value Applications' })
  triggerName: string;

  @ApiProperty({ description: 'Trigger type', enum: TriggerType })
  triggerType: TriggerType;

  @ApiProperty({ description: 'Is active', example: true })
  isActive: boolean;

  @ApiProperty({ description: 'Execution count', example: 150 })
  executionCount: number;

  @ApiProperty({ description: 'Last executed at', example: '2024-01-15T10:30:00Z' })
  lastExecutedAt?: string;

  @ApiProperty({ description: 'Next execution at', example: '2024-01-16T09:00:00Z' })
  nextExecutionAt?: string;
}

export class WorkflowExecutionResult {
  @ApiProperty({ description: 'Execution ID', example: 'uuid' })
  id: string;

  @ApiProperty({ description: 'Trigger ID', example: 'uuid' })
  triggerId: string;

  @ApiProperty({ description: 'Entity type', example: 'LoanApplication' })
  entityType: string;

  @ApiProperty({ description: 'Entity ID', example: 'uuid' })
  entityId: string;

  @ApiProperty({ description: 'Status', example: 'SUCCESS', enum: ['SUCCESS', 'FAILED', 'PENDING'] })
  status: string;

  @ApiProperty({ description: 'Execution time (ms)', example: 150 })
  executionTimeMs: number;

  @ApiProperty({ description: 'Error message (if failed)', example: null })
  errorMessage?: string;

  @ApiProperty({ description: 'Executed at', example: '2024-01-15T10:30:00Z' })
  executedAt: string;
}

