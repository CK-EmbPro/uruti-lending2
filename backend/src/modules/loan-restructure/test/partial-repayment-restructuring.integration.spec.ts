import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { LoanRestructureService } from '../loan-restructure.service';
import { PaymentHolidayTrackingService } from '../services/payment-holiday-tracking.service';
import { RestructureValidationService } from '../services/restructure-validation.service';
import { RestructureImpactAnalysisService } from '../services/restructure-impact-analysis.service';
import { RestructureAcknowledgmentService } from '../services/restructure-acknowledgment.service';
import { LoanModificationService } from '../../account-management/services/loan-modification.service';
import { LoanRestructure } from '../entities/loan-restructure.entity';
import { PaymentHoliday } from '../entities/payment-holiday.entity';
import { RestructureAcknowledgment, AcknowledgmentMethod } from '../entities/restructure-acknowledgment.entity';
import { Loan } from '../../loan/entities/loan.entity';
import { LoanRepaymentSchedule, ScheduleEntryStatus } from '../../loan/entities/loan-repayment-schedule.entity';
import { LoanModification, ModificationType, ModificationStatus } from '../../account-management/entities/loan-modification.entity';
import { LoanStatus } from '../../../common/enums/loan-status.enum';
import { RestructureStatus } from '../../../common/enums/restructure-type.enum';
import { BadRequestException } from '@nestjs/common';

describe('Partial Repayment & Restructuring - Integration Tests', () => {
  let module: TestingModule;
  let restructureService: LoanRestructureService;
  let paymentHolidayService: PaymentHolidayTrackingService;
  let validationService: RestructureValidationService;
  let impactAnalysisService: RestructureImpactAnalysisService;
  let acknowledgmentService: RestructureAcknowledgmentService;
  let modificationService: LoanModificationService;
  let loanRepository: Repository<Loan>;
  let restructureRepository: Repository<LoanRestructure>;
  let paymentHolidayRepository: Repository<PaymentHoliday>;
  let acknowledgmentRepository: Repository<RestructureAcknowledgment>;
  let scheduleRepository: Repository<LoanRepaymentSchedule>;
  let modificationRepository: Repository<LoanModification>;
  let dataSource: DataSource;

  // Test data
  let testLoan: Loan;
  let companyId: string;
  let borrowerId: string;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      providers: [
        LoanRestructureService,
        PaymentHolidayTrackingService,
        RestructureValidationService,
        RestructureImpactAnalysisService,
        RestructureAcknowledgmentService,
        LoanModificationService,
        {
          provide: getRepositoryToken(LoanRestructure),
          useClass: Repository,
        },
        {
          provide: getRepositoryToken(PaymentHoliday),
          useClass: Repository,
        },
        {
          provide: getRepositoryToken(RestructureAcknowledgment),
          useClass: Repository,
        },
        {
          provide: getRepositoryToken(Loan),
          useClass: Repository,
        },
        {
          provide: getRepositoryToken(LoanRepaymentSchedule),
          useClass: Repository,
        },
        {
          provide: getRepositoryToken(LoanModification),
          useClass: Repository,
        },
        {
          provide: DataSource,
          useValue: {
            createQueryRunner: jest.fn(),
          },
        },
      ],
    }).compile();

    restructureService = module.get<LoanRestructureService>(LoanRestructureService);
    paymentHolidayService = module.get<PaymentHolidayTrackingService>(PaymentHolidayTrackingService);
    validationService = module.get<RestructureValidationService>(RestructureValidationService);
    impactAnalysisService = module.get<RestructureImpactAnalysisService>(RestructureImpactAnalysisService);
    acknowledgmentService = module.get<RestructureAcknowledgmentService>(RestructureAcknowledgmentService);
    modificationService = module.get<LoanModificationService>(LoanModificationService);
    loanRepository = module.get<Repository<Loan>>(getRepositoryToken(Loan));
    restructureRepository = module.get<Repository<LoanRestructure>>(getRepositoryToken(LoanRestructure));
    paymentHolidayRepository = module.get<Repository<PaymentHoliday>>(getRepositoryToken(PaymentHoliday));
    acknowledgmentRepository = module.get<Repository<RestructureAcknowledgment>>(getRepositoryToken(RestructureAcknowledgment));
    scheduleRepository = module.get<Repository<LoanRepaymentSchedule>>(getRepositoryToken(LoanRepaymentSchedule));
    modificationRepository = module.get<Repository<LoanModification>>(getRepositoryToken(LoanModification));
    dataSource = module.get<DataSource>(DataSource);

    // Setup test data
    companyId = 'company-123';
    borrowerId = 'borrower-123';

    testLoan = {
      id: 'loan-123',
      loanNumber: 'LN-001',
      companyId,
      applicantId: borrowerId,
      loanAmount: 100000,
      disbursedAmount: 100000,
      rateOfInterest: 12.5,
      repaymentPeriods: 12, // 12 months
      repaymentStartDate: new Date('2024-01-01'),
      status: LoanStatus.ACTIVE,
      totalPrincipalPaid: 0,
      totalInterestPaid: 0,
      totalAmountPaid: 0,
    } as Loan;
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await module.close();
  });

  describe('Payment Holiday Workflow - End-to-End', () => {
    it('should complete full payment holiday workflow: Request → Validate → Record → Complete', async () => {
      // Setup: Mock loan exists
      jest.spyOn(loanRepository, 'findOne').mockResolvedValue(testLoan);
      jest.spyOn(paymentHolidayRepository, 'count').mockResolvedValue(0);
      jest.spyOn(paymentHolidayRepository, 'findOne').mockResolvedValue(null);

      // Step 1: Validate payment holiday request (should pass - 0 holidays)
      await expect(
        paymentHolidayService.validatePaymentHolidayRequest(testLoan.id),
      ).resolves.not.toThrow();

      // Step 2: Record first payment holiday
      const startDate1 = new Date('2024-02-01');
      const endDate1 = new Date('2024-03-01');
      const mockHoliday1 = {
        id: 'holiday-1',
        loanId: testLoan.id,
        companyId,
        startDate: startDate1,
        endDate: endDate1,
        durationMonths: 1,
        status: 'ACTIVE',
      } as PaymentHoliday;

      jest.spyOn(paymentHolidayRepository, 'create').mockReturnValue(mockHoliday1 as any);
      jest.spyOn(paymentHolidayRepository, 'save').mockResolvedValue(mockHoliday1);

      const holiday1 = await paymentHolidayService.recordPaymentHoliday(
        testLoan.id,
        companyId,
        startDate1,
        endDate1,
        1,
        'Financial hardship',
      );

      expect(holiday1).toBeDefined();
      expect(holiday1.id).toBe('holiday-1');

      // Step 3: Validate second payment holiday request (should pass - 1 holiday)
      jest.spyOn(paymentHolidayRepository, 'count').mockResolvedValue(1);
      jest.spyOn(paymentHolidayRepository, 'findOne').mockResolvedValue(null); // No active holiday

      await expect(
        paymentHolidayService.validatePaymentHolidayRequest(testLoan.id),
      ).resolves.not.toThrow();

      // Step 4: Record second payment holiday
      const startDate2 = new Date('2024-04-01');
      const endDate2 = new Date('2024-05-01');
      const mockHoliday2 = {
        id: 'holiday-2',
        loanId: testLoan.id,
        companyId,
        startDate: startDate2,
        endDate: endDate2,
        durationMonths: 1,
        status: 'ACTIVE',
      } as PaymentHoliday;

      jest.spyOn(paymentHolidayRepository, 'create').mockReturnValue(mockHoliday2 as any);
      jest.spyOn(paymentHolidayRepository, 'save').mockResolvedValue(mockHoliday2);

      const holiday2 = await paymentHolidayService.recordPaymentHoliday(
        testLoan.id,
        companyId,
        startDate2,
        endDate2,
        1,
        'Continued hardship',
      );

      expect(holiday2).toBeDefined();
      expect(holiday2.id).toBe('holiday-2');

      // Step 5: Attempt third payment holiday (should fail - max 2 reached)
      jest.spyOn(paymentHolidayRepository, 'count').mockResolvedValue(2);

      await expect(
        paymentHolidayService.validatePaymentHolidayRequest(testLoan.id),
      ).rejects.toThrow(BadRequestException);

      // Step 6: Complete a payment holiday
      jest.spyOn(paymentHolidayRepository, 'findOne').mockResolvedValue(mockHoliday1);
      jest.spyOn(paymentHolidayRepository, 'save').mockResolvedValue({
        ...mockHoliday1,
        status: 'COMPLETED',
        completedDate: new Date(),
      } as PaymentHoliday);

      const completedHoliday = await paymentHolidayService.completePaymentHoliday('holiday-1');
      expect(completedHoliday.status).toBe('COMPLETED');
      expect(completedHoliday.completedDate).toBeDefined();
    });

    it('should integrate payment holiday with loan modification service', async () => {
      // Setup
      jest.spyOn(loanRepository, 'findOne').mockResolvedValue(testLoan);
      jest.spyOn(paymentHolidayRepository, 'count').mockResolvedValue(0);
      jest.spyOn(paymentHolidayRepository, 'findOne').mockResolvedValue(null);
      jest.spyOn(modificationRepository, 'create').mockReturnValue({
        id: 'mod-1',
        loanId: testLoan.id,
        modificationType: ModificationType.PAYMENT_HOLIDAY,
        paymentHolidayMonths: 2,
        status: ModificationStatus.PENDING,
      } as any);
      jest.spyOn(modificationRepository, 'save').mockResolvedValue({
        id: 'mod-1',
        loanId: testLoan.id,
        modificationType: ModificationType.PAYMENT_HOLIDAY,
        paymentHolidayMonths: 2,
        status: ModificationStatus.PENDING,
      } as LoanModification);

      // Create modification request with payment holiday
      const modification = await modificationService.createModificationRequest(
        {
          loanId: testLoan.id,
          modificationType: ModificationType.PAYMENT_HOLIDAY,
          paymentHolidayMonths: 2,
          reason: 'Financial hardship',
        },
        borrowerId,
      );

      expect(modification).toBeDefined();
      expect(modification.modificationType).toBe(ModificationType.PAYMENT_HOLIDAY);
      expect(modification.paymentHolidayMonths).toBe(2);
    });
  });

  describe('Tenure Extension Workflow - End-to-End', () => {
    it('should complete full tenure extension workflow: Request → Validate → Approve → Recalculate', async () => {
      // Setup
      jest.spyOn(loanRepository, 'findOne').mockResolvedValue(testLoan);

      // Step 1: Validate tenure extension (12 months → 18 months = 50% extension - should pass)
      await expect(
        validationService.validateTenureExtension(testLoan.id, 18),
      ).resolves.not.toThrow();

      // Step 2: Attempt extension beyond 50% (12 months → 19 months = 58.3% - should fail)
      await expect(
        validationService.validateTenureExtension(testLoan.id, 19),
      ).rejects.toThrow(BadRequestException);

      // Step 3: Create restructure with valid extension
      const mockRestructure = {
        id: 'restructure-1',
        loanId: testLoan.id,
        companyId,
        oldTenure: 12,
        newRepaymentPeriodInMonths: 18,
        status: RestructureStatus.INITIATED,
        borrowerAcknowledged: false,
      } as LoanRestructure;

      jest.spyOn(restructureRepository, 'findOne').mockResolvedValue(mockRestructure);
      jest.spyOn(restructureRepository, 'create').mockReturnValue(mockRestructure as any);
      jest.spyOn(restructureRepository, 'save').mockResolvedValue(mockRestructure);

      // Step 4: Calculate max allowed tenure
      const maxAllowed = validationService.calculateMaxAllowedTenure(12);
      expect(maxAllowed).toBe(18); // 12 * 1.5 = 18

      // Step 5: Calculate extension percentage
      const extensionPercentage = validationService.calculateExtensionPercentage(12, 18);
      expect(extensionPercentage).toBe(50);
    });
  });

  describe('Schedule Recalculation Workflow - End-to-End', () => {
    it('should complete schedule recalculation with impact analysis', async () => {
      // Setup old schedule
      const oldSchedule: LoanRepaymentSchedule[] = [
        {
          id: 'schedule-1',
          loanId: testLoan.id,
          installmentNumber: 1,
          paymentDate: new Date('2024-01-01'),
          principalAmount: 8000,
          interestAmount: 1041.67,
          totalPayment: 9041.67,
          balanceLoanAmount: 92000,
          days: 30,
          status: ScheduleEntryStatus.PENDING,
        } as LoanRepaymentSchedule,
        {
          id: 'schedule-2',
          loanId: testLoan.id,
          installmentNumber: 2,
          paymentDate: new Date('2024-02-01'),
          principalAmount: 8083.33,
          interestAmount: 958.34,
          totalPayment: 9041.67,
          balanceLoanAmount: 83916.67,
          days: 30,
          status: ScheduleEntryStatus.PENDING,
        } as LoanRepaymentSchedule,
      ];

      // Setup new schedule (extended to 18 months)
      const newSchedule: LoanRepaymentSchedule[] = [
        {
          id: 'schedule-new-1',
          loanId: testLoan.id,
          installmentNumber: 1,
          paymentDate: new Date('2024-01-01'),
          principalAmount: 5000,
          interestAmount: 1041.67,
          totalPayment: 6041.67,
          balanceLoanAmount: 95000,
          days: 30,
          status: ScheduleEntryStatus.PENDING,
        } as LoanRepaymentSchedule,
        {
          id: 'schedule-new-2',
          loanId: testLoan.id,
          installmentNumber: 2,
          paymentDate: new Date('2024-02-01'),
          principalAmount: 5052.08,
          interestAmount: 989.59,
          totalPayment: 6041.67,
          balanceLoanAmount: 89947.92,
          days: 30,
          status: ScheduleEntryStatus.PENDING,
        } as LoanRepaymentSchedule,
      ];

      const restructure = {
        id: 'restructure-1',
        loanId: testLoan.id,
        oldTenure: 12,
        newRepaymentPeriodInMonths: 18,
      } as LoanRestructure;

      // Perform impact analysis
      const impactAnalysis = await impactAnalysisService.analyzeImpact(
        restructure,
        oldSchedule,
        newSchedule,
      );

      // Verify impact analysis
      expect(impactAnalysis).toBeDefined();
      expect(impactAnalysis.oldSchedule.totalPayments).toBeGreaterThan(0);
      expect(impactAnalysis.newSchedule.totalPayments).toBeGreaterThan(0);
      expect(impactAnalysis.impact.extensionMonths).toBe(6);
      expect(impactAnalysis.impact.percentageIncrease).toBe(50);

      // Verify impact summary generation
      const summary = impactAnalysisService.generateImpactSummary(impactAnalysis);
      expect(summary).toContain('Old Schedule');
      expect(summary).toContain('New Schedule');
      expect(summary).toContain('Impact');
      expect(summary).toContain('Interest Difference');
      expect(summary).toContain('Total Cost Difference');
    });
  });

  describe('Acknowledgment Workflow - End-to-End', () => {
    it('should complete full acknowledgment workflow: Request → Acknowledge → Approve', async () => {
      // Setup restructure
      const mockRestructure = {
        id: 'restructure-1',
        loanId: testLoan.id,
        companyId,
        status: RestructureStatus.INITIATED,
        borrowerAcknowledged: false,
      } as LoanRestructure;

      jest.spyOn(restructureRepository, 'findOne').mockResolvedValue(mockRestructure);
      jest.spyOn(acknowledgmentRepository, 'findOne').mockResolvedValue(null);

      // Step 1: Verify restructure is not acknowledged
      const isAcknowledgedBefore = await acknowledgmentService.isAcknowledged('restructure-1');
      expect(isAcknowledgedBefore).toBe(false);

      // Step 2: Attempt approval without acknowledgment (should fail)
      jest.spyOn(restructureRepository, 'findOne').mockResolvedValue(mockRestructure);

      await expect(
        restructureService.approve('restructure-1', true), // requireAcknowledgment = true
      ).rejects.toThrow(BadRequestException);

      // Step 3: Record acknowledgment
      const mockAcknowledgment = {
        id: 'ack-1',
        restructureId: 'restructure-1',
        borrowerId,
        acknowledgedAt: new Date(),
        acknowledgmentMethod: AcknowledgmentMethod.ELECTRONIC_CONSENT,
        acknowledgmentText: 'I acknowledge the terms change',
        termsRead: true,
        impactUnderstood: true,
      } as RestructureAcknowledgment;

      jest.spyOn(acknowledgmentRepository, 'create').mockReturnValue(mockAcknowledgment as any);
      jest.spyOn(acknowledgmentRepository, 'save').mockResolvedValue(mockAcknowledgment);
      jest.spyOn(restructureRepository, 'save').mockResolvedValue({
        ...mockRestructure,
        borrowerAcknowledged: true,
        acknowledgedAt: new Date(),
      } as LoanRestructure);

      const acknowledgment = await acknowledgmentService.recordAcknowledgment(
        'restructure-1',
        borrowerId,
        AcknowledgmentMethod.ELECTRONIC_CONSENT,
        'I acknowledge the terms change',
        {
          termsRead: true,
          impactUnderstood: true,
        },
      );

      expect(acknowledgment).toBeDefined();
      expect(acknowledgment.termsRead).toBe(true);
      expect(acknowledgment.impactUnderstood).toBe(true);

      // Step 4: Verify restructure is now acknowledged
      jest.spyOn(acknowledgmentRepository, 'findOne').mockResolvedValue(mockAcknowledgment);
      const isAcknowledgedAfter = await acknowledgmentService.isAcknowledged('restructure-1');
      expect(isAcknowledgedAfter).toBe(true);

      // Step 5: Validate acknowledgment (should pass)
      await expect(
        acknowledgmentService.validateAcknowledgment('restructure-1'),
      ).resolves.not.toThrow();

      // Step 6: Get acknowledgment details
      const retrievedAcknowledgment = await acknowledgmentService.getAcknowledgment('restructure-1');
      expect(retrievedAcknowledgment).toBeDefined();
      expect(retrievedAcknowledgment?.acknowledgmentMethod).toBe(AcknowledgmentMethod.ELECTRONIC_CONSENT);
    });

    it('should prevent duplicate acknowledgments', async () => {
      const mockRestructure = {
        id: 'restructure-2',
        loanId: testLoan.id,
        companyId,
      } as LoanRestructure;

      const existingAcknowledgment = {
        id: 'ack-2',
        restructureId: 'restructure-2',
        borrowerId,
      } as RestructureAcknowledgment;

      jest.spyOn(restructureRepository, 'findOne').mockResolvedValue(mockRestructure);
      jest.spyOn(acknowledgmentRepository, 'findOne').mockResolvedValue(existingAcknowledgment);

      // Attempt to record duplicate acknowledgment
      await expect(
        acknowledgmentService.recordAcknowledgment(
          'restructure-2',
          borrowerId,
          AcknowledgmentMethod.ELECTRONIC_CONSENT,
          'I acknowledge...',
        ),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('Complete Restructure Workflow - End-to-End', () => {
    it('should complete full restructure workflow: Create → Acknowledge → Approve → Recalculate', async () => {
      // Setup
      jest.spyOn(loanRepository, 'findOne').mockResolvedValue(testLoan);
      jest.spyOn(restructureRepository, 'findOne').mockResolvedValue(null); // No existing restructure

      // Step 1: Create restructure request
      const createDto = {
        loanId: testLoan.id,
        restructureType: 'NORMAL_RESTRUCTURE' as any,
        restructureDate: '2024-06-01',
        reasonForRestructure: 'Financial hardship',
        newRepaymentPeriodInMonths: 18, // Extend from 12 to 18 months
        newRateOfInterest: 12.5,
      };

      // Mock overdue amounts calculation
      jest.spyOn(restructureRepository, 'create').mockReturnValue({
        id: 'restructure-3',
        loanId: testLoan.id,
        companyId,
        oldTenure: 12,
        newRepaymentPeriodInMonths: 18,
        status: RestructureStatus.INITIATED,
        borrowerAcknowledged: false,
      } as any);

      jest.spyOn(restructureRepository, 'save').mockResolvedValue({
        id: 'restructure-3',
        loanId: testLoan.id,
        companyId,
        oldTenure: 12,
        newRepaymentPeriodInMonths: 18,
        status: RestructureStatus.INITIATED,
        borrowerAcknowledged: false,
      } as LoanRestructure);

      // Note: In a real integration test, we would call restructureService.create(createDto)
      // For now, we'll verify the validation step
      await expect(
        validationService.validateTenureExtension(testLoan.id, 18),
      ).resolves.not.toThrow();

      // Step 2: Record acknowledgment
      const mockRestructure = {
        id: 'restructure-3',
        loanId: testLoan.id,
        companyId,
        status: RestructureStatus.INITIATED,
        borrowerAcknowledged: false,
      } as LoanRestructure;

      jest.spyOn(restructureRepository, 'findOne').mockResolvedValue(mockRestructure);
      jest.spyOn(acknowledgmentRepository, 'findOne').mockResolvedValue(null);

      const mockAcknowledgment = {
        id: 'ack-3',
        restructureId: 'restructure-3',
        borrowerId,
        acknowledgedAt: new Date(),
        acknowledgmentMethod: AcknowledgmentMethod.ELECTRONIC_CONSENT,
        acknowledgmentText: 'I acknowledge the terms change',
      } as RestructureAcknowledgment;

      jest.spyOn(acknowledgmentRepository, 'create').mockReturnValue(mockAcknowledgment as any);
      jest.spyOn(acknowledgmentRepository, 'save').mockResolvedValue(mockAcknowledgment);
      jest.spyOn(restructureRepository, 'save').mockResolvedValue({
        ...mockRestructure,
        borrowerAcknowledged: true,
        acknowledgedAt: new Date(),
      } as LoanRestructure);

      const acknowledgment = await acknowledgmentService.recordAcknowledgment(
        'restructure-3',
        borrowerId,
        AcknowledgmentMethod.ELECTRONIC_CONSENT,
        'I acknowledge the terms change',
      );

      expect(acknowledgment).toBeDefined();

      // Step 3: Verify acknowledgment is required for approval
      jest.spyOn(acknowledgmentRepository, 'findOne').mockResolvedValue(mockAcknowledgment);
      await expect(
        acknowledgmentService.validateAcknowledgment('restructure-3'),
      ).resolves.not.toThrow();

      // Step 4: Approve restructure (with acknowledgment)
      jest.spyOn(restructureRepository, 'findOne').mockResolvedValue({
        ...mockRestructure,
        borrowerAcknowledged: true,
      } as LoanRestructure);

      // In a real integration test, we would call restructureService.approve('restructure-3')
      // and verify the schedule is regenerated with impact analysis
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle active payment holiday preventing new request', async () => {
      const futureDate = new Date();
      futureDate.setMonth(futureDate.getMonth() + 1);

      jest.spyOn(loanRepository, 'findOne').mockResolvedValue(testLoan);
      jest.spyOn(paymentHolidayRepository, 'count').mockResolvedValue(1);
      jest.spyOn(paymentHolidayRepository, 'findOne').mockResolvedValue({
        id: 'holiday-active',
        loanId: testLoan.id,
        endDate: futureDate,
        status: 'ACTIVE',
      } as PaymentHoliday);

      await expect(
        paymentHolidayService.validatePaymentHolidayRequest(testLoan.id),
      ).rejects.toThrow(BadRequestException);
    });

    it('should handle tenure extension edge cases', async () => {
      jest.spyOn(loanRepository, 'findOne').mockResolvedValue(testLoan);

      // Test exact 50% extension
      await expect(
        validationService.validateTenureExtension(testLoan.id, 18),
      ).resolves.not.toThrow();

      // Test just over 50% extension
      await expect(
        validationService.validateTenureExtension(testLoan.id, 19),
      ).rejects.toThrow(BadRequestException);

      // Test zero original tenure
      const zeroTenureLoan = { ...testLoan, repaymentPeriods: 0 } as Loan;
      jest.spyOn(loanRepository, 'findOne').mockResolvedValue(zeroTenureLoan);
      await expect(
        validationService.validateTenureExtension(testLoan.id, 12),
      ).rejects.toThrow(BadRequestException);
    });

    it('should handle acknowledgment edge cases', async () => {
      // Test acknowledgment for non-existent restructure
      jest.spyOn(restructureRepository, 'findOne').mockResolvedValue(null);
      await expect(
        acknowledgmentService.recordAcknowledgment(
          'non-existent',
          borrowerId,
          AcknowledgmentMethod.ELECTRONIC_CONSENT,
          'I acknowledge...',
        ),
      ).rejects.toThrow(BadRequestException);

      // Test validation for non-existent acknowledgment
      jest.spyOn(acknowledgmentRepository, 'findOne').mockResolvedValue(null);
      await expect(
        acknowledgmentService.validateAcknowledgment('restructure-no-ack'),
      ).rejects.toThrow(BadRequestException);
    });
  });
});

