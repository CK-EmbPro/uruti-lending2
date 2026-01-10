import { IsString, IsOptional, IsEnum, IsBoolean, IsNumber, IsArray, ValidateNested, IsObject } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export enum OnboardingStep {
  PROFILE = 'PROFILE',
  ID_VERIFICATION = 'ID_VERIFICATION',
  BIOMETRIC = 'BIOMETRIC',
  DOCUMENTS = 'DOCUMENTS',
  REVIEW = 'REVIEW',
  SIGNATURE = 'SIGNATURE',
  COMPLETE = 'COMPLETE',
}

export enum OnboardingStatus {
  IN_PROGRESS = 'IN_PROGRESS',
  PAUSED = 'PAUSED',
  COMPLETED = 'COMPLETED',
  ABANDONED = 'ABANDONED',
}

export enum BiometricMatchStatus {
  PENDING = 'PENDING',
  MATCHED = 'MATCHED',
  MISMATCHED = 'MISMATCHED',
  REQUIRES_REVIEW = 'REQUIRES_REVIEW',
}

export enum Platform {
  IOS = 'IOS',
  ANDROID = 'ANDROID',
  WEB = 'WEB',
}

export class SaveProgressDto {
  @ApiProperty({ description: 'Application ID', example: 'app-123' })
  @IsString()
  applicationId: string;

  @ApiProperty({ description: 'Current step', enum: OnboardingStep, example: OnboardingStep.PROFILE })
  @IsEnum(OnboardingStep)
  currentStep: OnboardingStep;

  @ApiProperty({ description: 'Form data as JSON object', type: Object })
  @IsObject()
  formData: Record<string, any>;

  @ApiPropertyOptional({ description: 'Platform (iOS, Android, Web)', enum: Platform })
  @IsOptional()
  @IsEnum(Platform)
  platform?: Platform;
}

export class ResumeProgressDto {
  @ApiProperty({ description: 'Application ID', example: 'app-123' })
  @IsString()
  applicationId: string;
}

export class BiometricMatchDto {
  @ApiProperty({ description: 'Application ID', example: 'app-123' })
  @IsString()
  applicationId: string;

  @ApiProperty({ description: 'Selfie image (base64 or URL)', example: 'data:image/jpeg;base64,...' })
  @IsString()
  selfieImage: string;

  @ApiProperty({ description: 'ID document photo URL or base64', example: 'https://example.com/id-photo.jpg' })
  @IsString()
  idPhotoUrl: string;

  @ApiPropertyOptional({ description: 'Platform (iOS, Android, Web)', enum: Platform })
  @IsOptional()
  @IsEnum(Platform)
  platform?: Platform;
}

export class CaptureSignatureDto {
  @ApiProperty({ description: 'Application ID', example: 'app-123' })
  @IsString()
  applicationId: string;

  @ApiProperty({ description: 'Signature data (base64 image)', example: 'data:image/png;base64,...' })
  @IsString()
  signatureData: string;

  @ApiPropertyOptional({ description: 'IP address', example: '192.168.1.1' })
  @IsOptional()
  @IsString()
  ipAddress?: string;

  @ApiPropertyOptional({ description: 'User agent', example: 'Mozilla/5.0...' })
  @IsOptional()
  @IsString()
  userAgent?: string;

  @ApiPropertyOptional({ description: 'Platform (iOS, Android, Web)', enum: Platform })
  @IsOptional()
  @IsEnum(Platform)
  platform?: Platform;
}

export class OnboardingProgressDto {
  @ApiProperty({ description: 'Application ID', example: 'app-123' })
  applicationId: string;

  @ApiProperty({ description: 'Current step', enum: OnboardingStep })
  currentStep: OnboardingStep;

  @ApiProperty({ description: 'Onboarding status', enum: OnboardingStatus })
  status: OnboardingStatus;

  @ApiProperty({ description: 'Completion percentage (0-100)', example: 45, minimum: 0, maximum: 100 })
  completionPercentage: number;

  @ApiProperty({ description: 'Saved form data', type: Object })
  formData: Record<string, any>;

  @ApiPropertyOptional({ description: 'Platform', enum: Platform })
  platform?: Platform;

  @ApiProperty({ description: 'Last saved timestamp', example: '2024-01-15T10:30:00Z' })
  lastSavedAt: string;

  @ApiProperty({ description: 'Created timestamp', example: '2024-01-15T10:00:00Z' })
  createdAt: string;
}

export class BiometricMatchResultDto {
  @ApiProperty({ description: 'Application ID', example: 'app-123' })
  applicationId: string;

  @ApiProperty({ description: 'Match status', enum: BiometricMatchStatus })
  matchStatus: BiometricMatchStatus;

  @ApiProperty({ description: 'Match confidence (0-1)', example: 0.95, minimum: 0, maximum: 1 })
  matchConfidence: number;

  @ApiProperty({ description: 'Whether faces match', example: true })
  isMatch: boolean;

  @ApiPropertyOptional({ description: 'Review required', example: false })
  requiresReview?: boolean;

  @ApiPropertyOptional({ description: 'Match details', type: Object })
  matchDetails?: Record<string, any>;
}

export class SignatureResultDto {
  @ApiProperty({ description: 'Application ID', example: 'app-123' })
  applicationId: string;

  @ApiProperty({ description: 'Signature ID', example: 'sig-123' })
  signatureId: string;

  @ApiProperty({ description: 'Whether signature is legally binding', example: true })
  isLegallyBinding: boolean;

  @ApiProperty({ description: 'Signature URL', example: 'https://example.com/signatures/sig-123.png' })
  signatureUrl: string;

  @ApiProperty({ description: 'Signed timestamp', example: '2024-01-15T10:30:00Z' })
  signedAt: string;
}

export class CompleteOnboardingDto {
  @ApiProperty({ description: 'Application ID', example: 'app-123' })
  @IsString()
  applicationId: string;

  @ApiProperty({ description: 'Final form data', type: Object })
  @IsObject()
  finalData: Record<string, any>;
}

