import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum, IsDateString, IsNumber, IsArray, IsBoolean, Min, Max } from 'class-validator';

export enum TaskStatus {
  TODO = 'TODO',
  IN_PROGRESS = 'IN_PROGRESS',
  BLOCKED = 'BLOCKED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export enum TaskPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
}

export class CreateTaskDto {
  @ApiProperty({ description: 'Task title', example: 'Review loan application APP-2024-000001' })
  @IsString()
  title: string;

  @ApiProperty({ description: 'Task description', example: 'Review and approve loan application' })
  @IsString()
  description: string;

  @ApiPropertyOptional({ description: 'Assigned to user ID', example: 'uuid' })
  @IsOptional()
  @IsString()
  assignedTo?: string;

  @ApiProperty({ description: 'Priority', enum: TaskPriority, default: 'MEDIUM' })
  @IsEnum(TaskPriority)
  priority: TaskPriority;

  @ApiPropertyOptional({ description: 'Due date (ISO format)', example: '2024-01-20' })
  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @ApiPropertyOptional({ description: 'Related entity type', example: 'LoanApplication' })
  @IsOptional()
  @IsString()
  entityType?: string;

  @ApiPropertyOptional({ description: 'Related entity ID', example: 'uuid' })
  @IsOptional()
  @IsString()
  entityId?: string;

  @ApiPropertyOptional({ description: 'Task tags', type: [String], example: ['review', 'urgent'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({ description: 'Estimated hours', example: 2 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  estimatedHours?: number;

  @ApiPropertyOptional({ description: 'Dependent task IDs', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  dependsOn?: string[];
}

export class TaskResult {
  @ApiProperty({ description: 'Task ID', example: 'uuid' })
  id: string;

  @ApiProperty({ description: 'Task title', example: 'Review loan application' })
  title: string;

  @ApiProperty({ description: 'Status', enum: TaskStatus })
  status: TaskStatus;

  @ApiProperty({ description: 'Priority', enum: TaskPriority })
  priority: TaskPriority;

  @ApiProperty({ description: 'Assigned to', example: 'user-uuid' })
  assignedTo?: string;

  @ApiProperty({ description: 'Due date', example: '2024-01-20' })
  dueDate?: string;

  @ApiProperty({ description: 'Completion percentage (0-100)', example: 50 })
  completionPercentage: number;

  @ApiProperty({ description: 'Time spent (hours)', example: 1.5 })
  timeSpent: number;

  @ApiProperty({ description: 'Created at', example: '2024-01-15T10:30:00Z' })
  createdAt: string;
}

export class TaskAnalytics {
  @ApiProperty({ description: 'Total tasks', example: 100 })
  totalTasks: number;

  @ApiProperty({ description: 'Completed tasks', example: 75 })
  completedTasks: number;

  @ApiProperty({ description: 'In progress tasks', example: 15 })
  inProgressTasks: number;

  @ApiProperty({ description: 'Overdue tasks', example: 5 })
  overdueTasks: number;

  @ApiProperty({ description: 'Average completion time (hours)', example: 4.5 })
  averageCompletionTime: number;

  @ApiProperty({ description: 'Tasks by priority', type: Object })
  tasksByPriority: Record<TaskPriority, number>;

  @ApiProperty({ description: 'Tasks by status', type: Object })
  tasksByStatus: Record<TaskStatus, number>;

  @ApiProperty({ description: 'Team performance', type: [Object] })
  teamPerformance: Array<{
    userId: string;
    userName: string;
    completedTasks: number;
    averageTime: number;
    onTimeRate: number;
  }>;
}

