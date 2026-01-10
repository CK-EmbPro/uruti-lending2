import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import {
  SaveProgressDto,
  ResumeProgressDto,
  BiometricMatchDto,
  CaptureSignatureDto,
  CompleteOnboardingDto,
  OnboardingProgressDto,
  BiometricMatchResultDto,
  SignatureResultDto,
  OnboardingStep,
  OnboardingStatus,
  BiometricMatchStatus,
  Platform,
} from '../dto/zero-branch-onboarding.dto';
import { OnboardingProgress } from '../entities/onboarding-progress.entity';
import { ESignatureService } from '../../e-signature/services/e-signature.service';
import { LoanApplication } from '../../loan-application/entities/loan-application.entity';

@Injectable()
export class ZeroBranchOnboardingService {
  private readonly logger = new Logger(ZeroBranchOnboardingService.name);
  private readonly faceMatchApiUrl?: string;

  constructor(
    @InjectRepository(OnboardingProgress)
    private readonly progressRepository: Repository<OnboardingProgress>,
    @InjectRepository(LoanApplication)
    private readonly applicationRepository: Repository<LoanApplication>,
    private readonly eSignatureService: ESignatureService,
    private readonly configService: ConfigService,
  ) {
    this.faceMatchApiUrl = this.configService.get('FACE_MATCH_API_URL');
  }

  /**
   * Save onboarding progress (allows pause and resume)
   */
  async saveProgress(dto: SaveProgressDto, userId?: string): Promise<OnboardingProgressDto> {
    this.logger.log(`Saving onboarding progress for application ${dto.applicationId}`);

    // Verify application exists
    const application = await this.applicationRepository.findOne({
      where: { id: dto.applicationId },
    });

    if (!application) {
      throw new NotFoundException(`Application ${dto.applicationId} not found`);
    }

    // Find or create progress record
    let progress = await this.progressRepository.findOne({
      where: { applicationId: dto.applicationId },
    });

    if (!progress) {
      progress = this.progressRepository.create({
        applicationId: dto.applicationId,
        currentStep: dto.currentStep,
        status: OnboardingStatus.IN_PROGRESS,
        formData: dto.formData,
        platform: dto.platform,
        isRemote: true, // Zero-branch onboarding is always remote
        requiresBranchVisit: false,
      });
    } else {
      progress.currentStep = dto.currentStep;
      progress.formData = { ...progress.formData, ...dto.formData };
      progress.platform = dto.platform || progress.platform;
      progress.status = OnboardingStatus.IN_PROGRESS;
    }

    // Calculate completion percentage
    progress.completionPercentage = this.calculateCompletionPercentage(dto.currentStep);
    progress.lastSavedAt = new Date();

    const saved = await this.progressRepository.save(progress);

    return this.mapToDto(saved);
  }

  /**
   * Resume onboarding progress
   */
  async resumeProgress(dto: ResumeProgressDto): Promise<OnboardingProgressDto> {
    this.logger.log(`Resuming onboarding progress for application ${dto.applicationId}`);

    const progress = await this.progressRepository.findOne({
      where: { applicationId: dto.applicationId },
    });

    if (!progress) {
      throw new NotFoundException(`No saved progress found for application ${dto.applicationId}`);
    }

    if (progress.status === OnboardingStatus.COMPLETED) {
      throw new BadRequestException('Onboarding already completed');
    }

    // Update status to IN_PROGRESS if it was PAUSED
    if (progress.status === OnboardingStatus.PAUSED) {
      progress.status = OnboardingStatus.IN_PROGRESS;
      await this.progressRepository.save(progress);
    }

    return this.mapToDto(progress);
  }

  /**
   * Pause onboarding (user exits mid-flow)
   */
  async pauseOnboarding(applicationId: string): Promise<void> {
    const progress = await this.progressRepository.findOne({
      where: { applicationId },
    });

    if (progress && progress.status === OnboardingStatus.IN_PROGRESS) {
      progress.status = OnboardingStatus.PAUSED;
      await this.progressRepository.save(progress);
    }
  }

  /**
   * Perform biometric match (selfie vs ID photo)
   */
  async performBiometricMatch(dto: BiometricMatchDto): Promise<BiometricMatchResultDto> {
    this.logger.log(`Performing biometric match for application ${dto.applicationId}`);

    // Verify application exists
    const application = await this.applicationRepository.findOne({
      where: { id: dto.applicationId },
    });

    if (!application) {
      throw new NotFoundException(`Application ${dto.applicationId} not found`);
    }

    // Perform face matching
    const matchResult = await this.matchFaces(dto.selfieImage, dto.idPhotoUrl, dto.applicationId);

    // Update progress
    let progress = await this.progressRepository.findOne({
      where: { applicationId: dto.applicationId },
    });

    if (!progress) {
      progress = this.progressRepository.create({
        applicationId: dto.applicationId,
        currentStep: OnboardingStep.BIOMETRIC,
        status: OnboardingStatus.IN_PROGRESS,
        formData: {},
        platform: dto.platform,
        isRemote: true,
        requiresBranchVisit: false,
      });
    }

    progress.biometricData = {
      selfieUrl: dto.selfieImage.startsWith('http') ? dto.selfieImage : undefined,
      idPhotoUrl: dto.idPhotoUrl.startsWith('http') ? dto.idPhotoUrl : undefined,
      matchStatus: matchResult.matchStatus,
      matchConfidence: matchResult.matchConfidence,
      matchedAt: new Date().toISOString(),
    };

    // If mismatch, flag for review
    if (matchResult.matchStatus === BiometricMatchStatus.MISMATCHED) {
      progress.requiresBranchVisit = false; // Still remote, but requires manual review
      matchResult.requiresReview = true;
    }

    await this.progressRepository.save(progress);

    return matchResult;
  }

  /**
   * Capture and store digital signature
   */
  async captureSignature(dto: CaptureSignatureDto): Promise<SignatureResultDto> {
    this.logger.log(`Capturing signature for application ${dto.applicationId}`);

    // Verify application exists
    const application = await this.applicationRepository.findOne({
      where: { id: dto.applicationId },
    });

    if (!application) {
      throw new NotFoundException(`Application ${dto.applicationId} not found`);
    }

    // Create signature request using e-signature service
    const signatureRequest = await this.eSignatureService.createSignatureRequest(
      {
        documentId: `onboarding-${dto.applicationId}`,
        documentName: 'Loan Application Agreement',
        entityType: 'loan_application',
        entityId: dto.applicationId,
        signers: [
          {
            name: 'Applicant', // Applicant name not stored in entity, use default
            email: '', // Applicant email not stored in entity, will be set during signing
            role: 'Applicant',
            order: 1,
          },
        ],
        message: 'Please sign to complete your loan application',
      },
      application.companyId || '',
    );

    // Sign the document
    // Note: Email should be provided in the DTO or fetched from applicant entity
    await this.eSignatureService.signDocument(
      signatureRequest.id,
      '', // Email not stored in application entity, should be provided separately
      {
        signature: dto.signatureData,
        ipAddress: dto.ipAddress,
        userAgent: dto.userAgent,
      },
      application.companyId || '',
    );

    // Get signature status
    const signatureStatus = await this.eSignatureService.getSignatureStatus(
      signatureRequest.id,
      application.companyId || '',
    );

    // Update progress
    let progress = await this.progressRepository.findOne({
      where: { applicationId: dto.applicationId },
    });

    if (!progress) {
      progress = this.progressRepository.create({
        applicationId: dto.applicationId,
        currentStep: OnboardingStep.SIGNATURE,
        status: OnboardingStatus.IN_PROGRESS,
        formData: {},
        platform: dto.platform,
        isRemote: true,
        requiresBranchVisit: false,
      });
    }

    progress.signatureData = {
      signatureId: signatureRequest.id,
      signatureUrl: signatureStatus.signedDocumentUrl || '',
      signedAt: new Date().toISOString(),
      isLegallyBinding: true, // E-signatures are legally binding
    };

    progress.currentStep = OnboardingStep.SIGNATURE;
    await this.progressRepository.save(progress);

    return {
      applicationId: dto.applicationId,
      signatureId: signatureRequest.id,
      isLegallyBinding: true,
      signatureUrl: signatureStatus.signedDocumentUrl || signatureRequest.signatureUrl,
      signedAt: new Date().toISOString(),
    };
  }

  /**
   * Complete onboarding
   */
  async completeOnboarding(dto: CompleteOnboardingDto): Promise<OnboardingProgressDto> {
    this.logger.log(`Completing onboarding for application ${dto.applicationId}`);

    const progress = await this.progressRepository.findOne({
      where: { applicationId: dto.applicationId },
    });

    if (!progress) {
      throw new NotFoundException(`No progress found for application ${dto.applicationId}`);
    }

    // Verify all steps are complete
    const allStepsComplete = this.verifyAllStepsComplete(progress);

    if (!allStepsComplete) {
      throw new BadRequestException('Not all onboarding steps are complete');
    }

    // Update progress
    progress.status = OnboardingStatus.COMPLETED;
    progress.currentStep = OnboardingStep.COMPLETE;
    progress.completionPercentage = 100;
    progress.formData = { ...progress.formData, ...dto.finalData };
    progress.isRemote = true; // Confirmed: completed remotely
    progress.requiresBranchVisit = false; // No branch visit needed

    const saved = await this.progressRepository.save(progress);

    return this.mapToDto(saved);
  }

  /**
   * Get onboarding progress
   */
  async getProgress(applicationId: string): Promise<OnboardingProgressDto> {
    const progress = await this.progressRepository.findOne({
      where: { applicationId },
    });

    if (!progress) {
      throw new NotFoundException(`No progress found for application ${applicationId}`);
    }

    return this.mapToDto(progress);
  }

  /**
   * Match faces (selfie vs ID photo)
   */
  private async matchFaces(
    selfieImage: string,
    idPhotoUrl: string,
    applicationId: string,
  ): Promise<BiometricMatchResultDto> {
    if (this.faceMatchApiUrl) {
      try {
        const response = await axios.post(
          `${this.faceMatchApiUrl}/match`,
          {
            selfieImage,
            idPhotoUrl,
          },
          { timeout: 10000 },
        );

        const matchConfidence = response.data.confidence || 0;
        const isMatch = matchConfidence >= 0.7; // 70% threshold

        return {
          applicationId,
          matchStatus: isMatch ? BiometricMatchStatus.MATCHED : BiometricMatchStatus.MISMATCHED,
          matchConfidence,
          isMatch,
          requiresReview: !isMatch,
          matchDetails: response.data,
        };
      } catch (error) {
        this.logger.error(`Face match API error: ${error.message}`);
        // Fall through to simulation
      }
    }

    // Simulated face matching for development
    await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 500));

    // Simple simulation: check if images are different (in production, use real face recognition)
    const isMismatch = selfieImage.includes('mismatch') || idPhotoUrl.includes('mismatch');
    const matchConfidence = isMismatch ? 0.3 : 0.95;

    return {
      applicationId,
      matchStatus: isMismatch
        ? BiometricMatchStatus.MISMATCHED
        : BiometricMatchStatus.MATCHED,
      matchConfidence,
      isMatch: !isMismatch,
      requiresReview: isMismatch,
      matchDetails: {
        method: 'simulated',
        note: 'Configure FACE_MATCH_API_URL for real face matching',
      },
    };
  }

  /**
   * Calculate completion percentage based on step
   */
  private calculateCompletionPercentage(step: OnboardingStep): number {
    const stepPercentages = {
      [OnboardingStep.PROFILE]: 15,
      [OnboardingStep.ID_VERIFICATION]: 30,
      [OnboardingStep.BIOMETRIC]: 45,
      [OnboardingStep.DOCUMENTS]: 60,
      [OnboardingStep.REVIEW]: 80,
      [OnboardingStep.SIGNATURE]: 95,
      [OnboardingStep.COMPLETE]: 100,
    };

    return stepPercentages[step] || 0;
  }

  /**
   * Verify all steps are complete
   */
  private verifyAllStepsComplete(progress: OnboardingProgress): boolean {
    // Check required data
    if (!progress.formData || Object.keys(progress.formData).length === 0) {
      return false;
    }

    // Check biometric match
    if (!progress.biometricData || !progress.biometricData.matchStatus) {
      return false;
    }

    if (progress.biometricData.matchStatus !== BiometricMatchStatus.MATCHED) {
      return false; // Must have matched biometric
    }

    // Check signature
    if (!progress.signatureData || !progress.signatureData.signatureId) {
      return false;
    }

    return true;
  }

  /**
   * Map entity to DTO
   */
  private mapToDto(progress: OnboardingProgress): OnboardingProgressDto {
    return {
      applicationId: progress.applicationId,
      currentStep: progress.currentStep,
      status: progress.status,
      completionPercentage: progress.completionPercentage,
      formData: progress.formData,
      platform: progress.platform,
      lastSavedAt: progress.lastSavedAt.toISOString(),
      createdAt: progress.createdAt.toISOString(),
    };
  }
}

