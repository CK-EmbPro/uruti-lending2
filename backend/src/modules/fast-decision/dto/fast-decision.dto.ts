import { IsString, IsOptional, IsEnum, IsNumber, IsBoolean, IsObject, IsArray } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum DecisionStep {
  DOCUMENT_VERIFICATION = 'DOCUMENT_VERIFICATION',
  KYC_AML = 'KYC_AML',
  SCORING = 'SCORING',
  APPROVAL = 'APPROVAL',
  COMPLETED = 'COMPLETED',
}

export enum StepStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  SKIPPED = 'SKIPPED',
}

export enum DecisionStatus {
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  TIMEOUT = 'TIMEOUT',
}

export class InitiateFastDecisionDto {
  @ApiProperty({ description: 'Application ID', example: 'app-123' })
  @IsString()
  applicationId: string;

  @ApiPropertyOptional({ description: 'Skip document verification', example: false })
  @IsOptional()
  @IsBoolean()
  skipDocumentVerification?: boolean;

  @ApiPropertyOptional({ description: 'Skip KYC/AML checks', example: false })
  @IsOptional()
  @IsBoolean()
  skipKYCAML?: boolean;

  @ApiPropertyOptional({ description: 'Auto-approve if score meets threshold', example: true })
  @IsOptional()
  @IsBoolean()
  autoApprove?: boolean;

  @ApiPropertyOptional({ description: 'Minimum score for auto-approval', example: 700 })
  @IsOptional()
  @IsNumber()
  autoApproveThreshold?: number;
}

export class DecisionProgressDto {
  @ApiProperty({ description: 'Progress ID' })
  id: string;

  @ApiProperty({ description: 'Application ID' })
  applicationId: string;

  @ApiProperty({ description: 'Current step', enum: DecisionStep })
  currentStep: DecisionStep;

  @ApiProperty({ description: 'Overall status', enum: DecisionStatus })
  status: DecisionStatus;

  @ApiProperty({ description: 'Progress percentage (0-100)' })
  progressPercentage: number;

  @ApiProperty({ description: 'Elapsed time in milliseconds' })
  elapsedTime: number;

  @ApiProperty({ description: 'Estimated time remaining in milliseconds' })
  estimatedTimeRemaining: number;

  @ApiProperty({ description: 'Step details', type: Object })
  steps: Record<DecisionStep, StepDetailDto>;

  @ApiProperty({ description: 'SLA compliance status' })
  slaCompliant: boolean;

  @ApiProperty({ description: 'SLA violations', type: [String] })
  slaViolations: string[];

  @ApiProperty({ description: 'Created at' })
  createdAt: Date;

  @ApiProperty({ description: 'Updated at' })
  updatedAt: Date;
}

export class StepDetailDto {
  @ApiProperty({ description: 'Step name', enum: DecisionStep })
  step: DecisionStep;

  @ApiProperty({ description: 'Step status', enum: StepStatus })
  status: StepStatus;

  @ApiProperty({ description: 'Start time' })
  startTime?: Date;

  @ApiProperty({ description: 'End time' })
  endTime?: Date;

  @ApiProperty({ description: 'Duration in milliseconds' })
  duration?: number;

  @ApiProperty({ description: 'SLA target in milliseconds' })
  slaTarget: number;

  @ApiProperty({ description: 'SLA met' })
  slaMet: boolean;

  @ApiProperty({ description: 'Step result data', type: Object })
  result?: Record<string, any>;

  @ApiProperty({ description: 'Error message if failed' })
  error?: string;
}

export class FastDecisionResultDto {
  @ApiProperty({ description: 'Application ID' })
  applicationId: string;

  @ApiProperty({ description: 'Decision outcome' })
  approved: boolean;

  @ApiProperty({ description: 'Approved amount' })
  approvedAmount?: number;

  @ApiProperty({ description: 'Approved interest rate' })
  approvedInterestRate?: number;

  @ApiProperty({ description: 'Total processing time in milliseconds' })
  totalProcessingTime: number;

  @ApiProperty({ description: 'SLA compliant' })
  slaCompliant: boolean;

  @ApiProperty({ description: 'Progress details', type: DecisionProgressDto })
  progress: DecisionProgressDto;

  @ApiProperty({ description: 'Decision rationale' })
  rationale?: string;

  @ApiProperty({ description: 'Conditions if approved' })
  conditions?: string[];
}

