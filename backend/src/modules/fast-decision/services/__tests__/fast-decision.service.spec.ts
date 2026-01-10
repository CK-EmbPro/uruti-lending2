import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { FastDecisionService } from '../fast-decision.service';
import { DecisionProgress } from '../../entities/decision-progress.entity';
import { AIDocumentProcessorService } from '../../../ai/services/ai-document-processor.service';
import { InstantKYCAMLService } from '../../../compliance/services/instant-kyc-aml.service';
import { WeightedCreditScoringService } from '../../../credit-scoring-engine/services/weighted-credit-scoring.service';
import { LoanApplicationService } from '../../../loan-application/loan-application.service';
import { NotificationService } from '../../../notification/services/notification.service';
import { NotificationGateway } from '../../../notification/gateways/notification.gateway';
import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';
import { DecisionStep, DecisionStatus } from '../../dto/fast-decision.dto';

describe('FastDecisionService', () => {
  let service: FastDecisionService;
  let progressRepository: Repository<DecisionProgress>;
  let documentProcessor: AIDocumentProcessorService;
  let kycAmlService: InstantKYCAMLService;
  let scoringService: WeightedCreditScoringService;
  let loanApplicationService: LoanApplicationService;
  let notificationService: NotificationService;
  let notificationGateway: NotificationGateway;

  const mockRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  const mockDocumentProcessor = {
    processDocument: jest.fn(),
  };

  const mockKYCAMLService = {
    performInstantChecks: jest.fn(),
  };

  const mockScoringService = {
    calculateWeightedScore: jest.fn(),
  };

  const mockLoanApplicationService = {
    findOne: jest.fn(),
    approve: jest.fn(),
  };

  const mockNotificationService = {
    sendNotification: jest.fn(),
  };

  const mockNotificationGateway = {
    sendNotificationToUser: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FastDecisionService,
        {
          provide: getRepositoryToken(DecisionProgress),
          useValue: mockRepository,
        },
        {
          provide: AIDocumentProcessorService,
          useValue: mockDocumentProcessor,
        },
        {
          provide: InstantKYCAMLService,
          useValue: mockKYCAMLService,
        },
        {
          provide: WeightedCreditScoringService,
          useValue: mockScoringService,
        },
        {
          provide: LoanApplicationService,
          useValue: mockLoanApplicationService,
        },
        {
          provide: NotificationService,
          useValue: mockNotificationService,
        },
        {
          provide: NotificationGateway,
          useValue: mockNotificationGateway,
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<FastDecisionService>(FastDecisionService);
    progressRepository = module.get<Repository<DecisionProgress>>(
      getRepositoryToken(DecisionProgress),
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('initiateFastDecision', () => {
    it('should create progress record and start processing', async () => {
      const dto = {
        applicationId: 'app-123',
        autoApprove: true,
        autoApproveThreshold: 700,
      };

      const mockApplication = {
        id: 'app-123',
        applicantId: 'user-123',
        requestedAmount: 10000,
        rateOfInterest: 12,
      };

      mockLoanApplicationService.findOne.mockResolvedValue(mockApplication);
      mockRepository.create.mockReturnValue({
        id: 'progress-123',
        applicationId: 'app-123',
        currentStep: DecisionStep.DOCUMENT_VERIFICATION,
        status: DecisionStatus.IN_PROGRESS,
      });
      mockRepository.save.mockResolvedValue({
        id: 'progress-123',
        applicationId: 'app-123',
      });

      const result = await service.initiateFastDecision(dto, 'company-123', 'user-123');

      expect(result).toBeDefined();
      expect(result.applicationId).toBe('app-123');
      expect(mockRepository.create).toHaveBeenCalled();
      expect(mockRepository.save).toHaveBeenCalled();
    });
  });

  describe('getProgress', () => {
    it('should return progress for application', async () => {
      const mockProgress = {
        id: 'progress-123',
        applicationId: 'app-123',
        currentStep: DecisionStep.KYC_AML,
        status: DecisionStatus.IN_PROGRESS,
      };

      mockRepository.findOne.mockResolvedValue(mockProgress);

      const result = await service.getProgress('app-123');

      expect(result).toEqual(mockProgress);
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { applicationId: 'app-123' },
        order: { createdAt: 'DESC' },
      });
    });
  });

  describe('getSLAStatistics', () => {
    it('should calculate SLA statistics', async () => {
      const mockProgresses = [
        {
          id: '1',
          elapsedTime: 300000, // 5 minutes
          slaCompliant: true,
          steps: {
            [DecisionStep.DOCUMENT_VERIFICATION]: { duration: 25000 },
            [DecisionStep.KYC_AML]: { duration: 40000 },
            [DecisionStep.SCORING]: { duration: 1500 },
            [DecisionStep.APPROVAL]: { duration: 12000 },
          },
        },
        {
          id: '2',
          elapsedTime: 650000, // 10.8 minutes
          slaCompliant: false,
          steps: {
            [DecisionStep.DOCUMENT_VERIFICATION]: { duration: 35000 },
            [DecisionStep.KYC_AML]: { duration: 50000 },
            [DecisionStep.SCORING]: { duration: 2000 },
            [DecisionStep.APPROVAL]: { duration: 20000 },
          },
        },
      ];

      const mockQueryBuilder = {
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(mockProgresses),
      };

      mockRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await service.getSLAStatistics();

      expect(result.total).toBe(2);
      expect(result.slaCompliant).toBe(1);
      expect(result.slaViolated).toBe(1);
      expect(result.averageTime).toBe(475000);
      expect(result.stepStatistics).toBeDefined();
    });
  });
});

