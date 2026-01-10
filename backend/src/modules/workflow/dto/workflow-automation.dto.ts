import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsEnum,
  IsBoolean,
  IsObject,
  IsUUID,
  IsInt,
  Min,
  Max,
} from 'class-validator';
import { TriggerType, EventType, ScheduleType } from '../entities/workflow-trigger.entity';

export class CreateWorkflowTriggerDto {
  @ApiProperty({ description: 'Workflow ID' })
  @IsUUID()
  workflowId: string;

  @ApiProperty({ description: 'Trigger type', enum: TriggerType })
  @IsEnum(TriggerType)
  triggerType: TriggerType;

  @ApiPropertyOptional({ description: 'Event type (for EVENT triggers)', enum: EventType })
  @IsEnum(EventType)
  @IsOptional()
  eventType?: EventType;

  @ApiPropertyOptional({ description: 'Schedule type (for SCHEDULE triggers)', enum: ScheduleType })
  @IsEnum(ScheduleType)
  @IsOptional()
  scheduleType?: ScheduleType;

  @ApiPropertyOptional({ description: 'Cron expression (for custom schedules)' })
  @IsString()
  @IsOptional()
  cronExpression?: string;

  @ApiPropertyOptional({ description: 'Schedule time (HH:mm format)' })
  @IsString()
  @IsOptional()
  scheduleTime?: string;

  @ApiPropertyOptional({ description: 'Trigger conditions' })
  @IsObject()
  @IsOptional()
  conditions?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Additional parameters' })
  @IsObject()
  @IsOptional()
  parameters?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Is active', default: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class ExecuteWorkflowDto {
  @ApiProperty({ description: 'Workflow ID' })
  @IsUUID()
  workflowId: string;

  @ApiProperty({ description: 'Document type' })
  @IsString()
  documentType: string;

  @ApiProperty({ description: 'Document ID' })
  @IsString()
  documentId: string;

  @ApiPropertyOptional({ description: 'Initial state' })
  @IsString()
  @IsOptional()
  initialState?: string;

  @ApiPropertyOptional({ description: 'Input data' })
  @IsObject()
  @IsOptional()
  inputData?: Record<string, any>;
}

export class GetWorkflowExecutionsDto {
  @ApiPropertyOptional({ description: 'Workflow ID' })
  @IsUUID()
  @IsOptional()
  workflowId?: string;

  @ApiPropertyOptional({ description: 'Document type' })
  @IsString()
  @IsOptional()
  documentType?: string;

  @ApiPropertyOptional({ description: 'Document ID' })
  @IsString()
  @IsOptional()
  documentId?: string;

  @ApiPropertyOptional({ description: 'Status' })
  @IsString()
  @IsOptional()
  status?: string;

  @ApiPropertyOptional({ description: 'Page number', minimum: 1, default: 1 })
  @IsInt()
  @Min(1)
  @IsOptional()
  page?: number;

  @ApiPropertyOptional({ description: 'Results per page', minimum: 1, maximum: 100, default: 20 })
  @IsInt()
  @Min(1)
  @Max(100)
  @IsOptional()
  limit?: number;
}

