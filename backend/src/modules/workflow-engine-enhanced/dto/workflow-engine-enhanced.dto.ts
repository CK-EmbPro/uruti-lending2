import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum, IsObject, IsArray, IsBoolean } from 'class-validator';

export enum WorkflowNodeType {
  START = 'START',
  END = 'END',
  TASK = 'TASK',
  DECISION = 'DECISION',
  PARALLEL = 'PARALLEL',
  LOOP = 'LOOP',
  SUB_WORKFLOW = 'SUB_WORKFLOW',
}

export enum WorkflowExecutionStatus {
  PENDING = 'PENDING',
  RUNNING = 'RUNNING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
}

export class CreateWorkflowEnhancedDto {
  @ApiProperty({ description: 'Workflow name', example: 'Loan Approval Workflow' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ description: 'Description', example: 'Automated loan approval process' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'Workflow definition', type: Object })
  @IsObject()
  definition: {
    nodes: Array<{
      id: string;
      type: WorkflowNodeType;
      name: string;
      config?: Record<string, any>;
    }>;
    edges: Array<{
      from: string;
      to: string;
      condition?: string;
    }>;
  };

  @ApiPropertyOptional({ description: 'Variables', type: Object })
  @IsOptional()
  @IsObject()
  variables?: Record<string, any>;
}

export class ExecuteWorkflowEnhancedDto {
  @ApiProperty({ description: 'Input data', type: Object })
  @IsObject()
  inputData: Record<string, any>;

  @ApiPropertyOptional({ description: 'Context', type: Object })
  @IsOptional()
  @IsObject()
  context?: Record<string, any>;
}

