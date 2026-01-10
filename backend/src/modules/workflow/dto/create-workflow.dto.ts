import {
  IsString,
  IsBoolean,
  IsOptional,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateWorkflowStateDto {
  @ApiProperty({ description: 'State name', example: 'Draft' })
  @IsString()
  state: string;

  @ApiProperty({ description: 'Document status (0=Draft, 1=Submitted)', example: 0 })
  docStatus: number;

  @ApiPropertyOptional({ description: 'Is optional state', example: false })
  @IsBoolean()
  @IsOptional()
  isOptionalState?: boolean;

  @ApiPropertyOptional({ description: 'Allow editing in this state', example: true })
  @IsBoolean()
  @IsOptional()
  allowEdit?: boolean;

  @ApiPropertyOptional({ description: 'Message to show', example: 'Application is under review' })
  @IsString()
  @IsOptional()
  message?: string;

  @ApiPropertyOptional({ description: 'Send email on state entry', example: false })
  @IsBoolean()
  @IsOptional()
  sendEmail?: boolean;
}

export class CreateWorkflowTransitionDto {
  @ApiProperty({ description: 'Current state', example: 'Draft' })
  @IsString()
  state: string;

  @ApiProperty({ description: 'Action name', example: 'Initiate' })
  @IsString()
  action: string;

  @ApiProperty({ description: 'Next state', example: 'Initiated' })
  @IsString()
  nextState: string;

  @ApiProperty({ description: 'Allowed roles (comma-separated)', example: 'Loan Officer,Loan Processor' })
  @IsString()
  allowed: string;

  @ApiPropertyOptional({ description: 'Allow self approval', example: true })
  @IsBoolean()
  @IsOptional()
  allowSelfApproval?: boolean;

  @ApiPropertyOptional({ description: 'Condition expression', example: null })
  @IsString()
  @IsOptional()
  condition?: string;

  @ApiPropertyOptional({ description: 'Send email to creator', example: false })
  @IsBoolean()
  @IsOptional()
  sendEmailToCreator?: boolean;
}

export class CreateWorkflowDto {
  @ApiProperty({ description: 'Workflow name', example: 'Loan Application Workflow' })
  @IsString()
  workflowName: string;

  @ApiProperty({ description: 'Document type', example: 'Loan Application' })
  @IsString()
  documentType: string;

  @ApiPropertyOptional({ description: 'Is active', example: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiPropertyOptional({ description: 'Description' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ description: 'Workflow states', type: [CreateWorkflowStateDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateWorkflowStateDto)
  states: CreateWorkflowStateDto[];

  @ApiProperty({ description: 'Workflow transitions', type: [CreateWorkflowTransitionDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateWorkflowTransitionDto)
  transitions: CreateWorkflowTransitionDto[];
}

