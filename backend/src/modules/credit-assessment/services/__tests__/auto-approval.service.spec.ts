import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { AutoApprovalService } from '../auto-approval.service';
import { LoanApplication } from '../../../loan-application/entities/loan-application.entity';
import { CreditDecision } from '../../entities/credit-decision.entity';
import { WeightedCreditScoringService } from '../../../credit-scoring-engine/services/weighted-credit-scoring.service';
import { InstantKYCAMLService } from '../../../compliance/services/instant-kyc-aml.service';
import { RiskTierService } from '../../../credit-scoring-engine/services/risk-tier.service';
import { AIDocumentProcessorService } from '../../../ai/services/ai-document-processor.service';
import { FraudDetectionService } from '../../../fraud-detection/services/fraud-detection.service';
import { AutoApprovalRequestDto, AutoApprovalStatus, RiskLevel } from '../../dto/auto-approval.dto';

describe('AutoApprovalService', () => {
  let service: AutoApprovalService;
  let applicationRepository: Repository<LoanApplication>;
  let creditDecisionRepository: Repository<CreditDecision>;
  let scoringService: WeightedCreditScoringService;
  let kycAmlService: InstantKYCAMLService;
  let riskTierService: RiskTierService;
  let fraudDetectionService: FraudDetectionService;

  const mockApplication: Partial<LoanApplication> = {
    id: 'app-123',
    applicantId: 'applicant-123',
    applicantType: 'INDIVIDUAL',
    requestedAmount: 30000,
    companyId: 'company-123',
    repaymentPeriods: 36,
  } as Partial<LoanApplication>;

  const mockScoringResult = {
    finalScore: 720,
    traditionalScore: 700,
    alternativeScore: 750,
    behavioralScore: 710,
    confidence: 0.95,
    riskTier: 'STANDARD',
    factors: {},
  };

  const mockKYCAMLResult = {
    checks: [
      { checkName: 'National ID', passed: true },
      { checkName: 'Credit Bureau', passed: true },
      { checkName: 'Sanctions', passed: true },
      { checkName: 'Adverse Media', passed: true },
    ],
    overallRiskLevel: 'GREEN',
    riskScore: 10,
  };

  const mockFraudResult = {
    riskLevel: 'LOW',
    riskScore: 20,
    isFlagged: false,
    indicators: [],
    factors: {},
    recommendations: [],
    requiresVerification: false,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AutoApprovalService,
        {
          provide: getRepositoryToken(LoanApplication),
          useValue: {
            findOne: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(CreditDecision),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: WeightedCreditScoringService,
          useValue: {
            calculateWeightedScore: jest.fn(),
          },
        },
        {
          provide: InstantKYCAMLService,
          useValue: {
            performInstantChecks: jest.fn(),
          },
        },
        {
          provide: RiskTierService,
          useValue: {
            assignRiskTier: jest.fn(),
            getTierInfo: jest.fn(),
          },
        },
        {
          provide: AIDocumentProcessorService,
          useValue: {},
        },
        {
          provide: FraudDetectionService,
          useValue: {
            checkFraud: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AutoApprovalService>(AutoApprovalService);
    applicationRepository = module.get<Repository<LoanApplication>>(
      getRepositoryToken(LoanApplication),
    );
    creditDecisionRepository = module.get<Repository<CreditDecision>>(
      getRepositoryToken(CreditDecision),
    );
    scoringService = module.get<WeightedCreditScoringService>(
      WeightedCreditScoringService,
    );
    kycAmlService = module.get<InstantKYCAMLService>(InstantKYCAMLService);
    riskTierService = module.get<RiskTierService>(RiskTierService);
    fraudDetectionService = module.get<FraudDetectionService>(
      FraudDetectionService,
    );
  });

  describe('evaluateAutoApproval', () => {
    it('should return ELIGIBLE status for low risk application', async () => {
      const dto: AutoApprovalRequestDto = {
        applicationId: 'app-123',
      };

      jest.spyOn(applicationRepository, 'findOne').mockResolvedValue(mockApplication as LoanApplication);
      jest.spyOn(scoringService, 'calculateWeightedScore').mockResolvedValue(mockScoringResult as any);
      jest.spyOn(fraudDetectionService, 'checkFraud').mockResolvedValue(mockFraudResult as any);
      jest.spyOn(kycAmlService, 'performInstantChecks').mockResolvedValue(mockKYCAMLResult as any);
      jest.spyOn(riskTierService, 'assignRiskTier').mockResolvedValue('STANDARD' as any);
      jest.spyOn(riskTierService, 'getTierInfo').mockResolvedValue({
        approvalRules: {
          maxAutoApproveAmount: 50000,
          defaultInterestRate: 7.5,
          maxLoanTerm: 60,
        },
      } as any);

      const result = await service.evaluateAutoApproval(dto, 'company-123');

      expect(result.status).toBe(AutoApprovalStatus.ELIGIBLE);
      expect(result.riskLevel).toBe(RiskLevel.LOW);
      expect(result.eligible).toBe(true);
      expect(result.approvedAmount).toBeDefined();
      expect(result.approvedInterestRate).toBeDefined();
    });

    it('should return CONDITIONAL status for medium risk application', async () => {
      const dto: AutoApprovalRequestDto = {
        applicationId: 'app-123',
      };

      const mediumScoreResult = { ...mockScoringResult, finalScore: 680 };

      jest.spyOn(applicationRepository, 'findOne').mockResolvedValue(mockApplication as LoanApplication);
      jest.spyOn(scoringService, 'calculateWeightedScore').mockResolvedValue(mediumScoreResult as any);
      jest.spyOn(fraudDetectionService, 'checkFraud').mockResolvedValue(mockFraudResult as any);
      jest.spyOn(kycAmlService, 'performInstantChecks').mockResolvedValue(mockKYCAMLResult as any);
      jest.spyOn(riskTierService, 'assignRiskTier').mockResolvedValue('STANDARD' as any);
      jest.spyOn(riskTierService, 'getTierInfo').mockResolvedValue({
        approvalRules: {
          maxAutoApproveAmount: 50000,
          defaultInterestRate: 7.5,
          maxLoanTerm: 60,
        },
      } as any);

      const result = await service.evaluateAutoApproval(dto, 'company-123');

      expect(result.status).toBe(AutoApprovalStatus.CONDITIONAL);
      expect(result.riskLevel).toBe(RiskLevel.MEDIUM);
      expect(result.eligible).toBe(true);
      expect(result.conditions).toBeDefined();
      expect(result.conditions?.length).toBeGreaterThan(0);
    });

    it('should return REQUIRES_MANUAL_REVIEW for high risk application', async () => {
      const dto: AutoApprovalRequestDto = {
        applicationId: 'app-123',
      };

      const lowScoreResult = { ...mockScoringResult, finalScore: 550 };

      jest.spyOn(applicationRepository, 'findOne').mockResolvedValue(mockApplication as LoanApplication);
      jest.spyOn(scoringService, 'calculateWeightedScore').mockResolvedValue(lowScoreResult as any);
      jest.spyOn(fraudDetectionService, 'checkFraud').mockResolvedValue(mockFraudResult as any);
      jest.spyOn(kycAmlService, 'performInstantChecks').mockResolvedValue(mockKYCAMLResult as any);
      jest.spyOn(riskTierService, 'assignRiskTier').mockResolvedValue('MONITORED' as any);

      const result = await service.evaluateAutoApproval(dto, 'company-123');

      expect(result.status).toBe(AutoApprovalStatus.REQUIRES_MANUAL_REVIEW);
      expect(result.riskLevel).toBe(RiskLevel.HIGH);
      expect(result.eligible).toBe(false);
    });

    it('should return NOT_ELIGIBLE when credit score is below threshold', async () => {
      const dto: AutoApprovalRequestDto = {
        applicationId: 'app-123',
        criteria: {
          minCreditScore: 700,
          maxFraudFlags: 0,
          maxPreApprovedLimit: 50000,
          requiresCompleteDocumentation: true,
          requiresCleanKYCAML: true,
        },
      };

      const lowScoreResult = { ...mockScoringResult, finalScore: 600 };

      jest.spyOn(applicationRepository, 'findOne').mockResolvedValue(mockApplication as LoanApplication);
      jest.spyOn(scoringService, 'calculateWeightedScore').mockResolvedValue(lowScoreResult as any);
      jest.spyOn(fraudDetectionService, 'checkFraud').mockResolvedValue(mockFraudResult as any);
      jest.spyOn(kycAmlService, 'performInstantChecks').mockResolvedValue(mockKYCAMLResult as any);

      const result = await service.evaluateAutoApproval(dto, 'company-123');

      expect(result.status).toBe(AutoApprovalStatus.NOT_ELIGIBLE);
      expect(result.eligible).toBe(false);
      expect(result.criteriaChecks.some((c) => !c.passed)).toBe(true);
    });

    it('should return NOT_ELIGIBLE when fraud flags are detected', async () => {
      const dto: AutoApprovalRequestDto = {
        applicationId: 'app-123',
      };

      const fraudFlaggedResult = {
        ...mockFraudResult,
        isFlagged: true,
        riskLevel: 'HIGH',
        riskScore: 85,
      };

      jest.spyOn(applicationRepository, 'findOne').mockResolvedValue(mockApplication as LoanApplication);
      jest.spyOn(scoringService, 'calculateWeightedScore').mockResolvedValue(mockScoringResult as any);
      jest.spyOn(fraudDetectionService, 'checkFraud').mockResolvedValue(fraudFlaggedResult as any);
      jest.spyOn(kycAmlService, 'performInstantChecks').mockResolvedValue(mockKYCAMLResult as any);

      const result = await service.evaluateAutoApproval(dto, 'company-123');

      expect(result.status).toBe(AutoApprovalStatus.NOT_ELIGIBLE);
      expect(result.hasFraudFlags).toBe(true);
      expect(result.fraudFlagCount).toBeGreaterThan(0);
    });

    it('should return NOT_ELIGIBLE when requested amount exceeds limit', async () => {
      const dto: AutoApprovalRequestDto = {
        applicationId: 'app-123',
        criteria: {
          minCreditScore: 650,
          maxFraudFlags: 0,
          maxPreApprovedLimit: 20000, // Lower limit
          requiresCompleteDocumentation: true,
          requiresCleanKYCAML: true,
        },
      };

      const highAmountApp = { ...mockApplication, requestedAmount: 50000 };

      jest.spyOn(applicationRepository, 'findOne').mockResolvedValue(highAmountApp as LoanApplication);
      jest.spyOn(scoringService, 'calculateWeightedScore').mockResolvedValue(mockScoringResult as any);
      jest.spyOn(fraudDetectionService, 'checkFraud').mockResolvedValue(mockFraudResult as any);
      jest.spyOn(kycAmlService, 'performInstantChecks').mockResolvedValue(mockKYCAMLResult as any);

      const result = await service.evaluateAutoApproval(dto, 'company-123');

      expect(result.status).toBe(AutoApprovalStatus.NOT_ELIGIBLE);
      expect(result.withinPreApprovedLimit).toBe(false);
    });

    it('should throw NotFoundException when application not found', async () => {
      const dto: AutoApprovalRequestDto = {
        applicationId: 'non-existent',
      };

      jest.spyOn(applicationRepository, 'findOne').mockResolvedValue(null);

      await expect(service.evaluateAutoApproval(dto, 'company-123')).rejects.toThrow();
    });
  });

  describe('executeAutoApproval', () => {
    it('should create credit decision for eligible application', async () => {
      const dto: AutoApprovalRequestDto = {
        applicationId: 'app-123',
      };

      const mockDecision = {
        id: 'decision-123',
        applicationId: 'app-123',
        outcome: 'Approved',
      };

      jest.spyOn(applicationRepository, 'findOne').mockResolvedValue(mockApplication as LoanApplication);
      jest.spyOn(scoringService, 'calculateWeightedScore').mockResolvedValue(mockScoringResult as any);
      jest.spyOn(fraudDetectionService, 'checkFraud').mockResolvedValue(mockFraudResult as any);
      jest.spyOn(kycAmlService, 'performInstantChecks').mockResolvedValue(mockKYCAMLResult as any);
      jest.spyOn(riskTierService, 'assignRiskTier').mockResolvedValue('STANDARD' as any);
      jest.spyOn(riskTierService, 'getTierInfo').mockResolvedValue({
        approvalRules: {
          maxAutoApproveAmount: 50000,
          defaultInterestRate: 7.5,
          maxLoanTerm: 60,
        },
      } as any);
      jest.spyOn(creditDecisionRepository, 'create').mockReturnValue(mockDecision as any);
      jest.spyOn(creditDecisionRepository, 'save').mockResolvedValue(mockDecision as any);

      const result = await service.executeAutoApproval(dto, 'company-123', 'user-123');

      expect(result).toBeDefined();
      expect(creditDecisionRepository.create).toHaveBeenCalled();
      expect(creditDecisionRepository.save).toHaveBeenCalled();
    });

    it('should throw BadRequestException for not eligible application', async () => {
      const dto: AutoApprovalRequestDto = {
        applicationId: 'app-123',
      };

      const lowScoreResult = { ...mockScoringResult, finalScore: 500 };

      jest.spyOn(applicationRepository, 'findOne').mockResolvedValue(mockApplication as LoanApplication);
      jest.spyOn(scoringService, 'calculateWeightedScore').mockResolvedValue(lowScoreResult as any);
      jest.spyOn(fraudDetectionService, 'checkFraud').mockResolvedValue(mockFraudResult as any);
      jest.spyOn(kycAmlService, 'performInstantChecks').mockResolvedValue(mockKYCAMLResult as any);
      jest.spyOn(riskTierService, 'assignRiskTier').mockResolvedValue('HIGH_RISK' as any);

      await expect(
        service.executeAutoApproval(dto, 'company-123', 'user-123'),
      ).rejects.toThrow();
    });
  });
});

