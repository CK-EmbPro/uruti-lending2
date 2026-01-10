import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum, IsNumber, Min, Max } from 'class-validator';
import { ApplicantType } from '../../../common/enums/applicant-type.enum';

export enum OnboardingStep {
  PROFILE = 'PROFILE',
  INCOME = 'INCOME',
  DOCUMENTS = 'DOCUMENTS',
  PRODUCT_SELECTION = 'PRODUCT_SELECTION',
  APPLICATION = 'APPLICATION',
  VERIFICATION = 'VERIFICATION',
  COMPLETE = 'COMPLETE',
}

export class GetOnboardingGuideDto {
  @ApiProperty({ description: 'Applicant ID', example: 'uuid' })
  @IsString()
  applicantId: string;

  @ApiProperty({ description: 'Applicant type', enum: ApplicantType })
  @IsEnum(ApplicantType)
  applicantType: ApplicantType;

  @ApiPropertyOptional({ description: 'Current step', enum: OnboardingStep })
  @IsOptional()
  @IsEnum(OnboardingStep)
  currentStep?: OnboardingStep;
}

export class OnboardingGuideResult {
  @ApiProperty({ description: 'Current step', enum: OnboardingStep })
  currentStep: OnboardingStep;

  @ApiProperty({ description: 'Completion percentage (0-100)', example: 45 })
  completionPercentage: number;

  @ApiProperty({ description: 'Next step', enum: OnboardingStep })
  nextStep: OnboardingStep;

  @ApiProperty({ description: 'Steps information', type: [Object] })
  steps: Array<{
    step: OnboardingStep;
    title: string;
    description: string;
    isCompleted: boolean;
    isCurrent: boolean;
    isRequired: boolean;
    estimatedTime: number; // minutes
    fields: string[];
  }>;

  @ApiProperty({ description: 'Recommended actions', type: [String] })
  recommendedActions: string[];

  @ApiProperty({ description: 'Missing requirements', type: [String] })
  missingRequirements: string[];

  @ApiProperty({ description: 'Estimated time to complete (minutes)', example: 15 })
  estimatedTimeToComplete: number;
}

