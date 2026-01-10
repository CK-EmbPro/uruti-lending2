import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { InstantKYCAMLService } from '../instant-kyc-aml.service';
import { LoanApplication } from '../../../loan-application/entities/loan-application.entity';
import { CreditBureauService } from '../../../credit-bureau/services/credit-bureau.service';
import {
  InstantKYCCheckRequestDto,
  RiskLevel,
  CheckStatus,
} from '../../dto/instant-kyc-aml.dto';

describe('InstantKYCAMLService', () => {
  let service: InstantKYCAMLService;
  let applicationRepository: any;
  let creditBureauService: any;
  let configService: any;

  const mockApplication = {
    id: 'app-123',
    applicantId: 'customer-123',
    applicantName: 'John Doe',
    companyId: 'company-123',
  };

  beforeEach(async () => {
    const mockApplicationRepo = {
      findOne: jest.fn(),
    };

    const mockCreditBureauService = {
      getLatestCreditReport: jest.fn(),
    };

    const mockConfigService = {
      get: jest.fn((key: string) => {
        // Return undefined to use simulated checks
        return undefined;
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InstantKYCAMLService,
        {
          provide: getRepositoryToken(LoanApplication),
          useValue: mockApplicationRepo,
        },
        {
          provide: CreditBureauService,
          useValue: mockCreditBureauService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<InstantKYCAMLService>(InstantKYCAMLService);
    applicationRepository = module.get(getRepositoryToken(LoanApplication));
    creditBureauService = module.get(CreditBureauService);
    configService = module.get(ConfigService);

    // Setup default mocks
    applicationRepository.findOne.mockResolvedValue(mockApplication);
    creditBureauService.getLatestCreditReport.mockResolvedValue(null);
  });

  describe('National ID Verification', () => {
    it('should verify valid National ID', async () => {
      const dto: InstantKYCCheckRequestDto = {
        applicationId: 'app-123',
        nationalId: {
          idNumber: 'ABC123456',
          fullName: 'John Doe',
          countryCode: 'US',
        },
      };

      const result = await service.performInstantChecks(dto);
      const nationalIdCheck = result.checks.find(c => c.checkName === 'National ID Verification');

      expect(nationalIdCheck).toBeDefined();
      expect(nationalIdCheck?.status).toBe(CheckStatus.COMPLETED);
      expect(nationalIdCheck?.passed).toBe(true);
    });

    it('should reject invalid National ID format', async () => {
      const dto: InstantKYCCheckRequestDto = {
        applicationId: 'app-123',
        nationalId: {
          idNumber: 'AB', // Too short
          fullName: 'John Doe',
        },
      };

      const result = await service.performInstantChecks(dto);
      const nationalIdCheck = result.checks.find(c => c.checkName === 'National ID Verification');

      expect(nationalIdCheck?.passed).toBe(false);
    });
  });

  describe('Credit Bureau', () => {
    it('should retrieve credit history', async () => {
      creditBureauService.getLatestCreditReport.mockResolvedValue({
        creditScore: 750,
        creditFactors: {},
        accountsSummary: {},
        paymentHistory: {},
      });

      const dto: InstantKYCCheckRequestDto = {
        applicationId: 'app-123',
        creditBureau: {
          customerId: 'customer-123',
        },
      };

      const result = await service.performInstantChecks(dto);
      const creditCheck = result.checks.find(c => c.checkName === 'Credit Bureau');

      expect(creditCheck).toBeDefined();
      expect(creditCheck?.status).toBe(CheckStatus.COMPLETED);
      expect(creditCheck?.result?.creditScore).toBe(750);
    });
  });

  describe('Sanctions Lists', () => {
    it('should detect sanctions match and auto-reject', async () => {
      const dto: InstantKYCCheckRequestDto = {
        applicationId: 'app-123',
        sanctions: {
          fullName: 'test_sanction', // Matches simulated pattern
          checkOFAC: true,
          checkLocal: true,
        },
      };

      const result = await service.performInstantChecks(dto);
      const sanctionsCheck = result.checks.find(c => c.checkName === 'Sanctions Lists');

      expect(sanctionsCheck).toBeDefined();
      expect(sanctionsCheck?.passed).toBe(false);
      expect(result.autoRejected).toBe(true);
      expect(result.riskLevel).toBe(RiskLevel.RED);
      expect(result.rejectionReason).toContain('Sanctions list match');
    });

    it('should pass when no sanctions match', async () => {
      const dto: InstantKYCCheckRequestDto = {
        applicationId: 'app-123',
        sanctions: {
          fullName: 'John Doe', // No match
          checkOFAC: true,
          checkLocal: true,
        },
      };

      const result = await service.performInstantChecks(dto);
      const sanctionsCheck = result.checks.find(c => c.checkName === 'Sanctions Lists');

      expect(sanctionsCheck?.passed).toBe(true);
      expect(result.autoRejected).toBe(false);
    });
  });

  describe('Adverse Media', () => {
    it('should detect adverse media and flag for review', async () => {
      const dto: InstantKYCCheckRequestDto = {
        applicationId: 'app-123',
        adverseMedia: {
          fullName: 'adverse_media', // Matches simulated pattern
        },
      };

      const result = await service.performInstantChecks(dto);
      const adverseMediaCheck = result.checks.find(c => c.checkName === 'Adverse Media');

      expect(adverseMediaCheck).toBeDefined();
      expect(adverseMediaCheck?.passed).toBe(false);
      expect(adverseMediaCheck?.result?.hasAdverseMedia).toBe(true);
    });

    it('should pass when no adverse media found', async () => {
      const dto: InstantKYCCheckRequestDto = {
        applicationId: 'app-123',
        adverseMedia: {
          fullName: 'John Doe', // No match
        },
      };

      const result = await service.performInstantChecks(dto);
      const adverseMediaCheck = result.checks.find(c => c.checkName === 'Adverse Media');

      expect(adverseMediaCheck?.passed).toBe(true);
    });
  });

  describe('Parallel Processing', () => {
    it('should run all checks in parallel', async () => {
      const startTime = Date.now();

      const dto: InstantKYCCheckRequestDto = {
        applicationId: 'app-123',
        nationalId: { idNumber: 'ABC123456', fullName: 'John Doe' },
        creditBureau: { customerId: 'customer-123' },
        sanctions: { fullName: 'John Doe', checkOFAC: true },
        adverseMedia: { fullName: 'John Doe' },
      };

      const result = await service.performInstantChecks(dto);
      const totalTime = Date.now() - startTime;

      // All checks should complete
      expect(result.checks.length).toBe(4);
      expect(result.allChecksCompleted).toBe(true);

      // Total time should be less than sum of individual times (proving parallel execution)
      const sumOfIndividualTimes = result.checks.reduce(
        (sum, check) => sum + check.processingTime,
        0,
      );
      expect(totalTime).toBeLessThan(sumOfIndividualTimes);
      expect(result.totalProcessingTime).toBeLessThan(sumOfIndividualTimes);
    });
  });

  describe('Risk Scoring', () => {
    it('should assign GREEN for low risk', async () => {
      const dto: InstantKYCCheckRequestDto = {
        applicationId: 'app-123',
        nationalId: { idNumber: 'ABC123456', fullName: 'John Doe' },
        sanctions: { fullName: 'John Doe', checkOFAC: true },
        adverseMedia: { fullName: 'John Doe' },
      };

      const result = await service.performInstantChecks(dto);

      expect(result.riskScore).toBeLessThan(40);
      expect(result.riskLevel).toBe(RiskLevel.GREEN);
    });

    it('should assign YELLOW for medium risk', async () => {
      const dto: InstantKYCCheckRequestDto = {
        applicationId: 'app-123',
        nationalId: { idNumber: 'AB', fullName: 'John Doe' }, // Invalid ID
        sanctions: { fullName: 'John Doe', checkOFAC: true },
        adverseMedia: { fullName: 'John Doe' },
      };

      const result = await service.performInstantChecks(dto);

      // Should have some risk from invalid ID
      expect(result.riskLevel).toBe(RiskLevel.YELLOW);
    });

    it('should assign RED for sanctions match', async () => {
      const dto: InstantKYCCheckRequestDto = {
        applicationId: 'app-123',
        sanctions: {
          fullName: 'test_sanction',
          checkOFAC: true,
        },
      };

      const result = await service.performInstantChecks(dto);

      expect(result.riskLevel).toBe(RiskLevel.RED);
      expect(result.autoRejected).toBe(true);
    });
  });

  describe('Auto-rejection', () => {
    it('should auto-reject on sanctions hit', async () => {
      const dto: InstantKYCCheckRequestDto = {
        applicationId: 'app-123',
        sanctions: {
          fullName: 'test_sanction',
          checkOFAC: true,
        },
      };

      const result = await service.performInstantChecks(dto);

      expect(result.autoRejected).toBe(true);
      expect(result.rejectionReason).toContain('Sanctions list match');
      expect(result.riskLevel).toBe(RiskLevel.RED);
    });

    it('should not auto-reject when no sanctions match', async () => {
      const dto: InstantKYCCheckRequestDto = {
        applicationId: 'app-123',
        sanctions: {
          fullName: 'John Doe',
          checkOFAC: true,
        },
      };

      const result = await service.performInstantChecks(dto);

      expect(result.autoRejected).toBe(false);
      expect(result.rejectionReason).toBeUndefined();
    });
  });

  describe('Error Handling', () => {
    it('should handle application not found', async () => {
      applicationRepository.findOne.mockResolvedValue(null);

      const dto: InstantKYCCheckRequestDto = {
        applicationId: 'non-existent',
      };

      await expect(service.performInstantChecks(dto)).rejects.toThrow('Application non-existent not found');
    });

    it('should handle check failures gracefully', async () => {
      creditBureauService.getLatestCreditReport.mockRejectedValue(new Error('Credit bureau error'));

      const dto: InstantKYCCheckRequestDto = {
        applicationId: 'app-123',
        creditBureau: { customerId: 'customer-123' },
      };

      const result = await service.performInstantChecks(dto);
      const creditCheck = result.checks.find(c => c.checkName === 'Credit Bureau');

      expect(creditCheck?.status).toBe(CheckStatus.FAILED);
      expect(creditCheck?.error).toContain('Credit bureau error');
      // Other checks should still complete
      expect(result.checks.length).toBe(4);
    });
  });
});

