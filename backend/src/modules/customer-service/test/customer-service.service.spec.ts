import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CustomerServiceService } from '../services/customer-service.service';
import { Loan } from '../../loan/entities/loan.entity';
import { LoanRepaymentSchedule } from '../../loan/entities/loan-repayment-schedule.entity';
import { PaymentExtension } from '../entities/payment-extension.entity';
import { Dispute } from '../entities/dispute.entity';
import { DisputeResolution } from '../entities/dispute-resolution.entity';
import { AccountUpdate } from '../entities/account-update.entity';
import { FeeWaiver } from '../entities/fee-waiver.entity';
import { ExtensionStatus } from '../../../common/enums/extension-status.enum';
import { ExtensionType } from '../../../common/enums/extension-type.enum';
import { DisputeStatus } from '../../../common/enums/dispute-status.enum';
import { DisputeType } from '../../../common/enums/dispute-type.enum';
import { WaiverStatus } from '../../../common/enums/waiver-status.enum';
import { WaiverType } from '../../../common/enums/waiver-type.enum';
import { LoanStatus } from '../../../common/enums/loan-status.enum';
import { AccountUpdateType } from '../../../common/enums/account-update-type.enum';
import { ScheduleEntryStatus } from '../../loan/entities/loan-repayment-schedule.entity';

describe('CustomerServiceService', () => {
  let service: CustomerServiceService;
  let loanRepository: Repository<Loan>;
  let scheduleRepository: Repository<LoanRepaymentSchedule>;
  let extensionRepository: Repository<PaymentExtension>;
  let disputeRepository: Repository<Dispute>;
  let resolutionRepository: Repository<DisputeResolution>;
  let accountUpdateRepository: Repository<AccountUpdate>;
  let waiverRepository: Repository<FeeWaiver>;

  const mockLoan: Partial<Loan> = {
    id: 'loan-123',
    loanNumber: 'LOAN-001',
    loanAmount: 100000,
    disbursedAmount: 100000,
    rateOfInterest: 12.5,
    status: LoanStatus.ACTIVE,
  };

  const mockSchedule: Partial<LoanRepaymentSchedule> = {
    id: 'schedule-123',
    loanId: 'loan-123',
    paymentDate: new Date('2024-12-15'),
    status: ScheduleEntryStatus.PENDING,
  };

  const mockRepositories = () => ({
    findOne: jest.fn(),
    find: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CustomerServiceService,
        {
          provide: getRepositoryToken(Loan),
          useValue: mockRepositories(),
        },
        {
          provide: getRepositoryToken(LoanRepaymentSchedule),
          useValue: mockRepositories(),
        },
        {
          provide: getRepositoryToken(PaymentExtension),
          useValue: mockRepositories(),
        },
        {
          provide: getRepositoryToken(Dispute),
          useValue: mockRepositories(),
        },
        {
          provide: getRepositoryToken(DisputeResolution),
          useValue: mockRepositories(),
        },
        {
          provide: getRepositoryToken(AccountUpdate),
          useValue: mockRepositories(),
        },
        {
          provide: getRepositoryToken(FeeWaiver),
          useValue: mockRepositories(),
        },
      ],
    }).compile();

    service = module.get<CustomerServiceService>(CustomerServiceService);
    loanRepository = module.get<Repository<Loan>>(getRepositoryToken(Loan));
    scheduleRepository = module.get<Repository<LoanRepaymentSchedule>>(
      getRepositoryToken(LoanRepaymentSchedule),
    );
    extensionRepository = module.get<Repository<PaymentExtension>>(
      getRepositoryToken(PaymentExtension),
    );
    disputeRepository = module.get<Repository<Dispute>>(
      getRepositoryToken(Dispute),
    );
    resolutionRepository = module.get<Repository<DisputeResolution>>(
      getRepositoryToken(DisputeResolution),
    );
    accountUpdateRepository = module.get<Repository<AccountUpdate>>(
      getRepositoryToken(AccountUpdate),
    );
    waiverRepository = module.get<Repository<FeeWaiver>>(
      getRepositoryToken(FeeWaiver),
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createPaymentExtension', () => {
    it('should create payment extension request', async () => {
      const originalDueDate = new Date('2024-12-15');
      const newDueDate = new Date('2024-12-22');

      jest.spyOn(loanRepository, 'findOne').mockResolvedValue(mockLoan as Loan);
      jest.spyOn(extensionRepository, 'create').mockReturnValue({
        loanId: 'loan-123',
        requestDate: new Date(),
        originalDueDate,
        newDueDate,
        extensionDays: 7,
        extensionType: ExtensionType.ONE_TIME_COURTESY,
        status: ExtensionStatus.PENDING,
      } as PaymentExtension);
      jest.spyOn(extensionRepository, 'save').mockResolvedValue({
        id: 'extension-123',
        extensionDays: 7,
        status: ExtensionStatus.PENDING,
      } as PaymentExtension);

      const result = await service.createPaymentExtension(
        {
          loanId: 'loan-123',
          originalDueDate: originalDueDate.toISOString(),
          extensionDays: 7,
          extensionType: ExtensionType.ONE_TIME_COURTESY,
          requestReason: 'Financial hardship',
        },
        'user-123',
        'User Name',
      );

      expect(result).toBeDefined();
      expect(result.extensionDays).toBe(7);
      expect(result.status).toBe(ExtensionStatus.PENDING);
      expect(extensionRepository.save).toHaveBeenCalled();
    });

    it('should throw error if loan not found', async () => {
      jest.spyOn(loanRepository, 'findOne').mockResolvedValue(null);

      await expect(
        service.createPaymentExtension(
          {
            loanId: 'invalid-loan',
            originalDueDate: new Date().toISOString(),
            extensionDays: 7,
            extensionType: ExtensionType.ONE_TIME_COURTESY,
          },
          'user-123',
          'User Name',
        ),
      ).rejects.toThrow('Loan invalid-loan not found');
    });
  });

  describe('approvePaymentExtension', () => {
    it('should approve payment extension and update schedule', async () => {
      const extension: Partial<PaymentExtension> = {
        id: 'extension-123',
        loanId: 'loan-123',
        originalDueDate: new Date('2024-12-15'),
        newDueDate: new Date('2024-12-22'),
        status: ExtensionStatus.PENDING,
      };

      jest.spyOn(extensionRepository, 'findOne').mockResolvedValue(extension as PaymentExtension);
      jest.spyOn(scheduleRepository, 'findOne').mockResolvedValue(mockSchedule as LoanRepaymentSchedule);
      jest.spyOn(scheduleRepository, 'save').mockResolvedValue(mockSchedule as LoanRepaymentSchedule);
      jest.spyOn(extensionRepository, 'save').mockResolvedValue({
        ...extension,
        status: ExtensionStatus.APPROVED,
        approved: true,
      } as PaymentExtension);

      const result = await service.approvePaymentExtension(
        'extension-123',
        'user-123',
        'User Name',
        'Approved',
      );

      expect(result.status).toBe(ExtensionStatus.APPROVED);
      expect(result.approved).toBe(true);
      expect(scheduleRepository.save).toHaveBeenCalled();
    });

    it('should throw error if extension not found', async () => {
      jest.spyOn(extensionRepository, 'findOne').mockResolvedValue(null);

      await expect(
        service.approvePaymentExtension('invalid-extension', 'user-123', 'User Name'),
      ).rejects.toThrow('Payment extension invalid-extension not found');
    });
  });

  describe('denyPaymentExtension', () => {
    it('should deny payment extension', async () => {
      const extension: Partial<PaymentExtension> = {
        id: 'extension-123',
        status: ExtensionStatus.PENDING,
      };

      jest.spyOn(extensionRepository, 'findOne').mockResolvedValue(extension as PaymentExtension);
      jest.spyOn(extensionRepository, 'save').mockResolvedValue({
        ...extension,
        status: ExtensionStatus.DENIED,
        approved: false,
        denialReason: 'Insufficient justification',
      } as PaymentExtension);

      const result = await service.denyPaymentExtension(
        'extension-123',
        'user-123',
        'User Name',
        'Insufficient justification',
      );

      expect(result.status).toBe(ExtensionStatus.DENIED);
      expect(result.denialReason).toBe('Insufficient justification');
    });
  });

  describe('createDispute', () => {
    it('should create dispute', async () => {
      jest.spyOn(loanRepository, 'findOne').mockResolvedValue(mockLoan as Loan);
      jest.spyOn(disputeRepository, 'create').mockReturnValue({
        loanId: 'loan-123',
        disputeDate: new Date(),
        disputeType: DisputeType.PAYMENT_DISPUTE,
        status: DisputeStatus.OPEN,
        description: 'Payment was made but not recorded',
      } as Dispute);
      jest.spyOn(disputeRepository, 'save').mockResolvedValue({
        id: 'dispute-123',
        status: DisputeStatus.OPEN,
      } as Dispute);

      const result = await service.createDispute(
        {
          loanId: 'loan-123',
          disputeType: DisputeType.PAYMENT_DISPUTE,
          description: 'Payment was made but not recorded',
          disputedAmount: 1000,
        },
        'user-123',
        'User Name',
      );

      expect(result).toBeDefined();
      expect(result.status).toBe(DisputeStatus.OPEN);
      expect(disputeRepository.save).toHaveBeenCalled();
    });
  });

  describe('resolveDispute', () => {
    it('should resolve dispute', async () => {
      const dispute: Partial<Dispute> = {
        id: 'dispute-123',
        loanId: 'loan-123',
        status: DisputeStatus.OPEN,
      };

      jest.spyOn(disputeRepository, 'findOne').mockResolvedValue(dispute as Dispute);
      jest.spyOn(resolutionRepository, 'create').mockReturnValue({
        disputeId: 'dispute-123',
        resolutionDate: new Date(),
        resolutionType: 'Resolved in Favor of Borrower',
        resolutionDetails: 'Payment was found and credited',
        adjustmentAmount: 1000,
      } as DisputeResolution);
      jest.spyOn(resolutionRepository, 'save').mockResolvedValue({
        id: 'resolution-123',
      } as DisputeResolution);
      jest.spyOn(disputeRepository, 'save').mockResolvedValue({
        ...dispute,
        status: DisputeStatus.RESOLVED,
      } as Dispute);

      const result = await service.resolveDispute(
        'dispute-123',
        {
          resolutionType: 'Resolved in Favor of Borrower',
          resolutionDetails: 'Payment was found and credited',
          adjustmentAmount: 1000,
          accountUpdated: true,
        },
        'user-123',
        'User Name',
      );

      expect(result).toBeDefined();
      expect(disputeRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ status: DisputeStatus.RESOLVED }),
      );
    });
  });

  describe('createAccountUpdate', () => {
    it('should create account update request', async () => {
      jest.spyOn(loanRepository, 'findOne').mockResolvedValue(mockLoan as Loan);
      jest.spyOn(accountUpdateRepository, 'create').mockReturnValue({
        loanId: 'loan-123',
        updateDate: new Date(),
        updateType: 'Address Change',
        newAddress: '123 New Street',
        identityVerified: false,
      } as AccountUpdate);
      jest.spyOn(accountUpdateRepository, 'save').mockResolvedValue({
        id: 'update-123',
        updateType: 'Address Change',
      } as AccountUpdate);

      const result = await service.createAccountUpdate(
        {
          loanId: 'loan-123',
          updateType: AccountUpdateType.ADDRESS_CHANGE,
          newAddress: '123 New Street',
          newCity: 'New City',
          newState: 'NY',
          newZipCode: '10001',
        },
        'user-123',
        'User Name',
      );

      expect(result).toBeDefined();
      expect(result.updateType).toBe('Address Change');
      expect(accountUpdateRepository.save).toHaveBeenCalled();
    });
  });

  describe('verifyAndProcessAccountUpdate', () => {
    it('should verify and process account update', async () => {
      const update: Partial<AccountUpdate> = {
        id: 'update-123',
        loanId: 'loan-123',
        identityVerified: false,
      };

      jest.spyOn(accountUpdateRepository, 'findOne').mockResolvedValue(update as AccountUpdate);
      jest.spyOn(accountUpdateRepository, 'save').mockResolvedValue({
        ...update,
        identityVerified: true,
        systemValidated: true,
      } as AccountUpdate);

      const result = await service.verifyAndProcessAccountUpdate(
        'update-123',
        'ID Check',
        'user-123',
        'User Name',
      );

      expect(result.identityVerified).toBe(true);
      expect(result.systemValidated).toBe(true);
    });
  });

  describe('createFeeWaiver', () => {
    it('should create fee waiver request', async () => {
      jest.spyOn(loanRepository, 'findOne').mockResolvedValue(mockLoan as Loan);
      jest.spyOn(waiverRepository, 'create').mockReturnValue({
        loanId: 'loan-123',
        requestDate: new Date(),
        waiverType: WaiverType.ONE_TIME_COURTESY,
        feeType: 'Late Fee',
        feeAmount: 50,
        status: WaiverStatus.PENDING,
      } as FeeWaiver);
      jest.spyOn(waiverRepository, 'save').mockResolvedValue({
        id: 'waiver-123',
        status: WaiverStatus.PENDING,
      } as FeeWaiver);

      const result = await service.createFeeWaiver(
        {
          loanId: 'loan-123',
          waiverType: WaiverType.ONE_TIME_COURTESY,
          feeType: 'Late Fee',
          feeAmount: 50,
          requestReason: 'First time late payment',
        },
        'user-123',
        'User Name',
      );

      expect(result).toBeDefined();
      expect(result.status).toBe(WaiverStatus.PENDING);
      expect(waiverRepository.save).toHaveBeenCalled();
    });
  });

  describe('approveFeeWaiver', () => {
    it('should approve fee waiver', async () => {
      const waiver: Partial<FeeWaiver> = {
        id: 'waiver-123',
        loanId: 'loan-123',
        status: WaiverStatus.PENDING,
        feeAmount: 50,
      };

      jest.spyOn(waiverRepository, 'findOne').mockResolvedValue(waiver as FeeWaiver);
      jest.spyOn(waiverRepository, 'save').mockResolvedValue({
        ...waiver,
        status: WaiverStatus.PROCESSED,
        approved: true,
        processed: true,
      } as FeeWaiver);

      const result = await service.approveFeeWaiver(
        'waiver-123',
        'user-123',
        'User Name',
        'Approved as one-time courtesy',
      );

      expect(result.status).toBe(WaiverStatus.PROCESSED);
      expect(result.approved).toBe(true);
      expect(result.processed).toBe(true);
    });
  });

  describe('denyFeeWaiver', () => {
    it('should deny fee waiver', async () => {
      const waiver: Partial<FeeWaiver> = {
        id: 'waiver-123',
        status: WaiverStatus.PENDING,
      };

      jest.spyOn(waiverRepository, 'findOne').mockResolvedValue(waiver as FeeWaiver);
      jest.spyOn(waiverRepository, 'save').mockResolvedValue({
        ...waiver,
        status: WaiverStatus.DENIED,
        approved: false,
        denialReason: 'Does not meet policy criteria',
      } as FeeWaiver);

      const result = await service.denyFeeWaiver(
        'waiver-123',
        'user-123',
        'User Name',
        'Does not meet policy criteria',
      );

      expect(result.status).toBe(WaiverStatus.DENIED);
      expect(result.denialReason).toBe('Does not meet policy criteria');
    });
  });

  describe('getLoanExtensions', () => {
    it('should return extensions for loan', async () => {
      const extensions: Partial<PaymentExtension>[] = [
        {
          id: 'extension-1',
          loanId: 'loan-123',
          status: ExtensionStatus.APPROVED,
        },
        {
          id: 'extension-2',
          loanId: 'loan-123',
          status: ExtensionStatus.PENDING,
        },
      ];

      jest.spyOn(extensionRepository, 'find').mockResolvedValue(extensions as PaymentExtension[]);

      const result = await service.getLoanExtensions('loan-123');

      expect(result).toHaveLength(2);
      expect(extensionRepository.find).toHaveBeenCalledWith({
        where: { loanId: 'loan-123' },
        order: { requestDate: 'DESC' },
      });
    });
  });

  describe('getLoanDisputes', () => {
    it('should return disputes for loan with resolutions', async () => {
      const disputes: Partial<Dispute>[] = [
        {
          id: 'dispute-1',
          loanId: 'loan-123',
          status: DisputeStatus.RESOLVED,
        },
      ];

      jest.spyOn(disputeRepository, 'find').mockResolvedValue(disputes as Dispute[]);

      const result = await service.getLoanDisputes('loan-123');

      expect(result).toHaveLength(1);
      expect(disputeRepository.find).toHaveBeenCalledWith({
        where: { loanId: 'loan-123' },
        order: { disputeDate: 'DESC' },
        relations: ['resolutions'],
      });
    });
  });
});

