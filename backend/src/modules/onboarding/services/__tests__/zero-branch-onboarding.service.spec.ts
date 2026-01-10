import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { ZeroBranchOnboardingService } from '../zero-branch-onboarding.service';
import { OnboardingProgress } from '../../entities/onboarding-progress.entity';
import { LoanApplication } from '../../../loan-application/entities/loan-application.entity';
import { ESignatureService } from '../../../e-signature/services/e-signature.service';
import {
  SaveProgressDto,
  ResumeProgressDto,
  BiometricMatchDto,
  CaptureSignatureDto,
  CompleteOnboardingDto,
  OnboardingStep,
  OnboardingStatus,
  BiometricMatchStatus,
  Platform,
} from '../../dto/zero-branch-onboarding.dto';

describe('ZeroBranchOnboardingService', () => {
  let service: ZeroBranchOnboardingService;
  let progressRepository: any;
  let applicationRepository: any;
  let eSignatureService: any;
  let configService: any;

  const mockApplication = {
    id: 'app-123',
    applicantId: 'customer-123',
    applicantName: 'John Doe',
    applicantEmailAddress: 'john@example.com',
    companyId: 'company-123',
  };

  beforeEach(async () => {
    const mockProgressRepo = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    };

    const mockApplicationRepo = {
      findOne: jest.fn(),
    };

    const mockESignatureService = {
      createSignatureRequest: jest.fn(),
      signDocument: jest.fn(),
      getSignatureStatus: jest.fn(),
    };

    const mockConfigService = {
      get: jest.fn((key: string) => {
        if (key === 'FACE_MATCH_API_URL') return undefined;
        return undefined;
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ZeroBranchOnboardingService,
        {
          provide: getRepositoryToken(OnboardingProgress),
          useValue: mockProgressRepo,
        },
        {
          provide: getRepositoryToken(LoanApplication),
          useValue: mockApplicationRepo,
        },
        {
          provide: ESignatureService,
          useValue: mockESignatureService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<ZeroBranchOnboardingService>(ZeroBranchOnboardingService);
    progressRepository = module.get(getRepositoryToken(OnboardingProgress));
    applicationRepository = module.get(getRepositoryToken(LoanApplication));
    eSignatureService = module.get(ESignatureService);
    configService = module.get(ConfigService);

    // Setup default mocks
    applicationRepository.findOne.mockResolvedValue(mockApplication);
    progressRepository.findOne.mockResolvedValue(null);
    progressRepository.create.mockImplementation((data) => ({ ...data, id: 'progress-123' }));
    progressRepository.save.mockImplementation((data) => Promise.resolve(data));
  });

  describe('Mobile Optimization', () => {
    it('should support iOS platform', async () => {
      const dto: SaveProgressDto = {
        applicationId: 'app-123',
        currentStep: OnboardingStep.PROFILE,
        formData: { name: 'John Doe' },
        platform: Platform.IOS,
      };

      const result = await service.saveProgress(dto);
      expect(result.platform).toBe(Platform.IOS);
    });

    it('should support Android platform', async () => {
      const dto: SaveProgressDto = {
        applicationId: 'app-123',
        currentStep: OnboardingStep.PROFILE,
        formData: { name: 'John Doe' },
        platform: Platform.ANDROID,
      };

      const result = await service.saveProgress(dto);
      expect(result.platform).toBe(Platform.ANDROID);
    });

    it('should support Web platform', async () => {
      const dto: SaveProgressDto = {
        applicationId: 'app-123',
        currentStep: OnboardingStep.PROFILE,
        formData: { name: 'John Doe' },
        platform: Platform.WEB,
      };

      const result = await service.saveProgress(dto);
      expect(result.platform).toBe(Platform.WEB);
    });
  });

  describe('Progress Saving', () => {
    it('should save progress', async () => {
      const dto: SaveProgressDto = {
        applicationId: 'app-123',
        currentStep: OnboardingStep.PROFILE,
        formData: { name: 'John Doe', email: 'john@example.com' },
        platform: Platform.WEB,
      };

      const result = await service.saveProgress(dto);

      expect(result.applicationId).toBe('app-123');
      expect(result.currentStep).toBe(OnboardingStep.PROFILE);
      expect(result.formData).toEqual(dto.formData);
      expect(result.status).toBe(OnboardingStatus.IN_PROGRESS);
      expect(progressRepository.save).toHaveBeenCalled();
    });

    it('should resume saved progress', async () => {
      const savedProgress = {
        id: 'progress-123',
        applicationId: 'app-123',
        currentStep: OnboardingStep.ID_VERIFICATION,
        status: OnboardingStatus.PAUSED,
        completionPercentage: 30,
        formData: { name: 'John Doe' },
        createdAt: new Date(),
        lastSavedAt: new Date(),
      };

      progressRepository.findOne.mockResolvedValue(savedProgress);

      const dto: ResumeProgressDto = {
        applicationId: 'app-123',
      };

      const result = await service.resumeProgress(dto);

      expect(result.applicationId).toBe('app-123');
      expect(result.currentStep).toBe(OnboardingStep.ID_VERIFICATION);
      expect(result.formData).toEqual({ name: 'John Doe' });
    });

    it('should handle pause and resume', async () => {
      const progress = {
        id: 'progress-123',
        applicationId: 'app-123',
        status: OnboardingStatus.IN_PROGRESS,
      };

      progressRepository.findOne.mockResolvedValue(progress);

      await service.pauseOnboarding('app-123');

      expect(progress.status).toBe(OnboardingStatus.PAUSED);
      expect(progressRepository.save).toHaveBeenCalled();
    });
  });

  describe('Biometric Match', () => {
    it('should match faces successfully', async () => {
      const dto: BiometricMatchDto = {
        applicationId: 'app-123',
        selfieImage: 'data:image/jpeg;base64,valid-image',
        idPhotoUrl: 'https://example.com/id-photo.jpg',
        platform: Platform.IOS,
      };

      const result = await service.performBiometricMatch(dto);

      expect(result.applicationId).toBe('app-123');
      expect(result.matchStatus).toBe(BiometricMatchStatus.MATCHED);
      expect(result.isMatch).toBe(true);
      expect(result.matchConfidence).toBeGreaterThan(0.7);
    });

    it('should detect mismatched faces', async () => {
      const dto: BiometricMatchDto = {
        applicationId: 'app-123',
        selfieImage: 'data:image/jpeg;base64,mismatch',
        idPhotoUrl: 'https://example.com/id-photo-mismatch.jpg',
        platform: Platform.ANDROID,
      };

      const result = await service.performBiometricMatch(dto);

      expect(result.matchStatus).toBe(BiometricMatchStatus.MISMATCHED);
      expect(result.isMatch).toBe(false);
      expect(result.requiresReview).toBe(true);
    });

    it('should flag mismatched selfie for review', async () => {
      const dto: BiometricMatchDto = {
        applicationId: 'app-123',
        selfieImage: 'data:image/jpeg;base64,mismatch',
        idPhotoUrl: 'https://example.com/id-photo.jpg',
      };

      const result = await service.performBiometricMatch(dto);

      expect(result.requiresReview).toBe(true);
      expect(result.matchStatus).toBe(BiometricMatchStatus.MISMATCHED);
    });
  });

  describe('E-signature', () => {
    it('should capture and store signature', async () => {
      eSignatureService.createSignatureRequest.mockResolvedValue({
        id: 'sig-123',
        signatureUrl: 'https://example.com/sign',
      });

      eSignatureService.signDocument.mockResolvedValue({});
      eSignatureService.getSignatureStatus.mockResolvedValue({
        signedDocumentUrl: 'https://example.com/signed-doc.pdf',
      });

      const dto: CaptureSignatureDto = {
        applicationId: 'app-123',
        signatureData: 'data:image/png;base64,signature-data',
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
        platform: Platform.WEB,
      };

      const result = await service.captureSignature(dto);

      expect(result.applicationId).toBe('app-123');
      expect(result.signatureId).toBe('sig-123');
      expect(result.isLegallyBinding).toBe(true);
      expect(result.signatureUrl).toBeDefined();
    });

    it('should mark signature as legally binding', async () => {
      eSignatureService.createSignatureRequest.mockResolvedValue({
        id: 'sig-123',
        signatureUrl: 'https://example.com/sign',
      });

      eSignatureService.signDocument.mockResolvedValue({});
      eSignatureService.getSignatureStatus.mockResolvedValue({
        signedDocumentUrl: 'https://example.com/signed-doc.pdf',
      });

      const dto: CaptureSignatureDto = {
        applicationId: 'app-123',
        signatureData: 'data:image/png;base64,signature',
      };

      const result = await service.captureSignature(dto);

      expect(result.isLegallyBinding).toBe(true);
    });
  });

  describe('No Physical Requirements', () => {
    it('should mark onboarding as remote', async () => {
      const dto: SaveProgressDto = {
        applicationId: 'app-123',
        currentStep: OnboardingStep.PROFILE,
        formData: {},
      };

      await service.saveProgress(dto);

      expect(progressRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          isRemote: true,
          requiresBranchVisit: false,
        }),
      );
    });

    it('should complete onboarding remotely', async () => {
      const progress = {
        id: 'progress-123',
        applicationId: 'app-123',
        currentStep: OnboardingStep.SIGNATURE,
        status: OnboardingStatus.IN_PROGRESS,
        completionPercentage: 95,
        formData: { name: 'John Doe' },
        biometricData: {
          matchStatus: BiometricMatchStatus.MATCHED,
          matchConfidence: 0.95,
        },
        signatureData: {
          signatureId: 'sig-123',
          signatureUrl: 'https://example.com/sig.png',
        },
        isRemote: true,
        requiresBranchVisit: false,
        createdAt: new Date(),
        lastSavedAt: new Date(),
      };

      progressRepository.findOne.mockResolvedValue(progress);

      const dto: CompleteOnboardingDto = {
        applicationId: 'app-123',
        finalData: {},
      };

      const result = await service.completeOnboarding(dto);

      expect(result.status).toBe(OnboardingStatus.COMPLETED);
      expect(result.completionPercentage).toBe(100);
      expect(progress.isRemote).toBe(true);
      expect(progress.requiresBranchVisit).toBe(false);
    });
  });

  describe('Error Handling', () => {
    it('should handle application not found', async () => {
      applicationRepository.findOne.mockResolvedValue(null);

      const dto: SaveProgressDto = {
        applicationId: 'non-existent',
        currentStep: OnboardingStep.PROFILE,
        formData: {},
      };

      await expect(service.saveProgress(dto)).rejects.toThrow('not found');
    });

    it('should handle progress not found on resume', async () => {
      progressRepository.findOne.mockResolvedValue(null);

      const dto: ResumeProgressDto = {
        applicationId: 'app-123',
      };

      await expect(service.resumeProgress(dto)).rejects.toThrow('No saved progress found');
    });
  });
});

