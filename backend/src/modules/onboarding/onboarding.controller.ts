import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { ZeroBranchOnboardingService } from './services/zero-branch-onboarding.service';
import {
  SaveProgressDto,
  ResumeProgressDto,
  BiometricMatchDto,
  CaptureSignatureDto,
  CompleteOnboardingDto,
  OnboardingProgressDto,
  BiometricMatchResultDto,
  SignatureResultDto,
} from './dto/zero-branch-onboarding.dto';

@ApiTags('onboarding')
@ApiBearerAuth()
@Controller('onboarding')
export class OnboardingController {
  constructor(
    private readonly onboardingService: ZeroBranchOnboardingService,
  ) {}

  @Post('save-progress')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Save onboarding progress (pause and resume)',
    description: `
Saves the current onboarding progress, allowing users to pause and resume later.

## Features:
- **Progress Saving**: User can pause and resume onboarding at any step
- **Cross-platform**: Works on iOS, Android, and Web
- **Auto-save**: Progress automatically saved on each step
- **Resume Anytime**: Users can exit mid-flow and return later

## Supported Platforms:
- iOS
- Android
- Web (responsive)

Progress is stored securely and can be resumed from any device.
    `.trim(),
  })
  @ApiResponse({
    status: 200,
    description: 'Progress saved successfully',
    type: OnboardingProgressDto,
  })
  async saveProgress(
    @Body() dto: SaveProgressDto,
    @Request() req: any,
  ): Promise<OnboardingProgressDto> {
    return await this.onboardingService.saveProgress(dto, req.user?.id);
  }

  @Post('resume-progress')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Resume onboarding progress',
    description: 'Resumes previously saved onboarding progress from where user left off.',
  })
  @ApiResponse({
    status: 200,
    description: 'Progress resumed successfully',
    type: OnboardingProgressDto,
  })
  @ApiResponse({ status: 404, description: 'No saved progress found' })
  async resumeProgress(
    @Body() dto: ResumeProgressDto,
  ): Promise<OnboardingProgressDto> {
    return await this.onboardingService.resumeProgress(dto);
  }

  @Get('progress/:applicationId')
  @ApiOperation({
    summary: 'Get onboarding progress',
    description: 'Retrieves current onboarding progress for an application.',
  })
  @ApiResponse({
    status: 200,
    description: 'Progress retrieved successfully',
    type: OnboardingProgressDto,
  })
  async getProgress(
    @Param('applicationId') applicationId: string,
  ): Promise<OnboardingProgressDto> {
    return await this.onboardingService.getProgress(applicationId);
  }

  @Post('biometric-match')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Perform biometric match (selfie vs ID photo)',
    description: `
Performs face matching between selfie and ID document photo.

## Features:
- **Biometric Verification**: Selfie matches ID photo
- **Face Recognition**: Advanced face matching technology
- **Mismatch Detection**: Flags mismatched photos for review
- **Cross-platform**: Works on iOS, Android, and Web

## Expected Behavior:
- Matching photos: Returns MATCHED status
- Mismatched photos: Returns MISMATCHED status and requires review
- Low confidence: Requires manual review

## Test:
- Submit mismatched selfie
- Expected: Flagged, requires review
    `.trim(),
  })
  @ApiResponse({
    status: 200,
    description: 'Biometric match completed',
    type: BiometricMatchResultDto,
  })
  async performBiometricMatch(
    @Body() dto: BiometricMatchDto,
  ): Promise<BiometricMatchResultDto> {
    return await this.onboardingService.performBiometricMatch(dto);
  }

  @Post('capture-signature')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Capture and store digital signature',
    description: `
Captures digital signature and stores it as legally binding.

## Features:
- **E-signature**: Digital signature captured and stored
- **Legally Binding**: Signatures are legally binding
- **Secure Storage**: Signatures stored securely with audit trail
- **Cross-platform**: Works on iOS, Android, and Web

## Test:
- Sign digitally, verify storage
- Expected: Signature legally binding and stored

## Legal Compliance:
- E-signatures are legally binding in most jurisdictions
- Includes IP address and user agent for audit trail
- Timestamped and stored securely
    `.trim(),
  })
  @ApiResponse({
    status: 200,
    description: 'Signature captured successfully',
    type: SignatureResultDto,
  })
  async captureSignature(
    @Body() dto: CaptureSignatureDto,
    @Request() req: any,
  ): Promise<SignatureResultDto> {
    // Add IP and user agent if not provided
    if (!dto.ipAddress) {
      dto.ipAddress = req.ip || req.headers['x-forwarded-for'] || 'unknown';
    }
    if (!dto.userAgent) {
      dto.userAgent = req.headers['user-agent'] || 'unknown';
    }

    return await this.onboardingService.captureSignature(dto);
  }

  @Post('complete')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Complete onboarding',
    description: `
Completes the onboarding process. Verifies all steps are complete.

## Features:
- **Zero-Branch**: Entire flow completable remotely
- **No Physical Requirements**: No branch visit needed
- **Fully Remote**: Complete onboarding from anywhere

## Test:
- Complete from different location
- Expected: No branch visit needed

## Requirements:
- All steps must be completed
- Biometric match must be successful
- Signature must be captured
    `.trim(),
  })
  @ApiResponse({
    status: 200,
    description: 'Onboarding completed successfully',
    type: OnboardingProgressDto,
  })
  @ApiResponse({ status: 400, description: 'Not all steps are complete' })
  async completeOnboarding(
    @Body() dto: CompleteOnboardingDto,
  ): Promise<OnboardingProgressDto> {
    return await this.onboardingService.completeOnboarding(dto);
  }

  @Post('pause')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Pause onboarding',
    description: 'Pauses the onboarding process. User can resume later.',
  })
  @ApiResponse({ status: 200, description: 'Onboarding paused successfully' })
  async pauseOnboarding(@Body() body: { applicationId: string }): Promise<{ message: string }> {
    await this.onboardingService.pauseOnboarding(body.applicationId);
    return { message: 'Onboarding paused successfully' };
  }
}

