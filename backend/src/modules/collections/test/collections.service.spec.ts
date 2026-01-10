import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CollectionsService } from '../services/collections.service';
import { Loan } from '../../loan/entities/loan.entity';
import { LoanRepaymentSchedule } from '../../loan/entities/loan-repayment-schedule.entity';
import { DelinquencyRecord } from '../entities/delinquency-record.entity';
import { CollectionWorkflow } from '../entities/collection-workflow.entity';
import { CollectionNotice } from '../entities/collection-notice.entity';
import { CollectionActivity } from '../entities/collection-activity.entity';
import { PaymentArrangement } from '../entities/payment-arrangement.entity';
import { PromiseToPay } from '../entities/promise-to-pay.entity';
import { SkipTrace } from '../entities/skip-trace.entity';
import { LegalAction } from '../entities/legal-action.entity';
import { ThirdPartyPlacement } from '../entities/third-party-placement.entity';
import { LateFee } from '../entities/late-fee.entity';
import { CreditBureauUpdate } from '../entities/credit-bureau-update.entity';
import { ArrangementCompliance } from '../entities/arrangement-compliance.entity';
import { Lawsuit } from '../entities/lawsuit.entity';
import { Judgment } from '../entities/judgment.entity';
import { CollectionAgency } from '../entities/collection-agency.entity';
import { CollectionStage } from '../../../common/enums/collection-stage.enum';
import { LoanStatus } from '../../../common/enums/loan-status.enum';
import { CollectionActivityType } from '../../../common/enums/collection-activity-type.enum';
import { CollectionChannel } from '../../../common/enums/collection-channel.enum';
import { LegalActionType } from '../../../common/enums/legal-action-type.enum';
import { CollectionNoticeType } from '../../../common/enums/collection-notice-type.enum';
import { ScheduleEntryStatus } from '../../loan/entities/loan-repayment-schedule.entity';

describe('CollectionsService', () => {
  let service: CollectionsService;
  let loanRepository: Repository<Loan>;
  let scheduleRepository: Repository<LoanRepaymentSchedule>;
  let delinquencyRepository: Repository<DelinquencyRecord>;
  let workflowRepository: Repository<CollectionWorkflow>;
  let noticeRepository: Repository<CollectionNotice>;
  let activityRepository: Repository<CollectionActivity>;
  let arrangementRepository: Repository<PaymentArrangement>;
  let promiseRepository: Repository<PromiseToPay>;
  let skipTraceRepository: Repository<SkipTrace>;
  let legalActionRepository: Repository<LegalAction>;
  let placementRepository: Repository<ThirdPartyPlacement>;
  let lateFeeRepository: Repository<LateFee>;
  let creditBureauRepository: Repository<CreditBureauUpdate>;
  let complianceRepository: Repository<ArrangementCompliance>;
  let lawsuitRepository: Repository<Lawsuit>;
  let judgmentRepository: Repository<Judgment>;
  let agencyRepository: Repository<CollectionAgency>;

  const mockLoan: Partial<Loan> = {
    id: 'loan-123',
    loanNumber: 'LOAN-001',
    loanAmount: 100000,
    disbursedAmount: 100000,
    rateOfInterest: 12.5,
    status: LoanStatus.ACTIVE,
    daysPastDue: 0,
    isNpa: false,
  };

  const mockSchedule: Partial<LoanRepaymentSchedule> = {
    id: 'schedule-123',
    loanId: 'loan-123',
    paymentDate: new Date('2024-12-15'),
    status: ScheduleEntryStatus.PENDING,
    principalAmount: 8333.33,
    interestAmount: 1041.67,
    totalPayment: 9375.00,
  };

  const mockRepositories = () => ({
    findOne: jest.fn(),
    find: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    createQueryBuilder: jest.fn(),
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CollectionsService,
        {
          provide: getRepositoryToken(Loan),
          useValue: mockRepositories(),
        },
        {
          provide: getRepositoryToken(LoanRepaymentSchedule),
          useValue: mockRepositories(),
        },
        {
          provide: getRepositoryToken(DelinquencyRecord),
          useValue: mockRepositories(),
        },
        {
          provide: getRepositoryToken(CollectionWorkflow),
          useValue: mockRepositories(),
        },
        {
          provide: getRepositoryToken(CollectionNotice),
          useValue: mockRepositories(),
        },
        {
          provide: getRepositoryToken(CollectionActivity),
          useValue: mockRepositories(),
        },
        {
          provide: getRepositoryToken(PaymentArrangement),
          useValue: mockRepositories(),
        },
        {
          provide: getRepositoryToken(PromiseToPay),
          useValue: mockRepositories(),
        },
        {
          provide: getRepositoryToken(SkipTrace),
          useValue: mockRepositories(),
        },
        {
          provide: getRepositoryToken(LegalAction),
          useValue: mockRepositories(),
        },
        {
          provide: getRepositoryToken(ThirdPartyPlacement),
          useValue: mockRepositories(),
        },
        {
          provide: getRepositoryToken(LateFee),
          useValue: mockRepositories(),
        },
        {
          provide: getRepositoryToken(CreditBureauUpdate),
          useValue: mockRepositories(),
        },
        {
          provide: getRepositoryToken(ArrangementCompliance),
          useValue: mockRepositories(),
        },
        {
          provide: getRepositoryToken(Lawsuit),
          useValue: mockRepositories(),
        },
        {
          provide: getRepositoryToken(Judgment),
          useValue: mockRepositories(),
        },
        {
          provide: getRepositoryToken(CollectionAgency),
          useValue: mockRepositories(),
        },
      ],
    }).compile();

    service = module.get<CollectionsService>(CollectionsService);
    loanRepository = module.get<Repository<Loan>>(getRepositoryToken(Loan));
    scheduleRepository = module.get<Repository<LoanRepaymentSchedule>>(
      getRepositoryToken(LoanRepaymentSchedule),
    );
    delinquencyRepository = module.get<Repository<DelinquencyRecord>>(
      getRepositoryToken(DelinquencyRecord),
    );
    workflowRepository = module.get<Repository<CollectionWorkflow>>(
      getRepositoryToken(CollectionWorkflow),
    );
    noticeRepository = module.get<Repository<CollectionNotice>>(
      getRepositoryToken(CollectionNotice),
    );
    activityRepository = module.get<Repository<CollectionActivity>>(
      getRepositoryToken(CollectionActivity),
    );
    arrangementRepository = module.get<Repository<PaymentArrangement>>(
      getRepositoryToken(PaymentArrangement),
    );
    promiseRepository = module.get<Repository<PromiseToPay>>(
      getRepositoryToken(PromiseToPay),
    );
    skipTraceRepository = module.get<Repository<SkipTrace>>(
      getRepositoryToken(SkipTrace),
    );
    legalActionRepository = module.get<Repository<LegalAction>>(
      getRepositoryToken(LegalAction),
    );
    placementRepository = module.get<Repository<ThirdPartyPlacement>>(
      getRepositoryToken(ThirdPartyPlacement),
    );
    lateFeeRepository = module.get<Repository<LateFee>>(
      getRepositoryToken(LateFee),
    );
    creditBureauRepository = module.get<Repository<CreditBureauUpdate>>(
      getRepositoryToken(CreditBureauUpdate),
    );
    complianceRepository = module.get<Repository<ArrangementCompliance>>(
      getRepositoryToken(ArrangementCompliance),
    );
    lawsuitRepository = module.get<Repository<Lawsuit>>(
      getRepositoryToken(Lawsuit),
    );
    judgmentRepository = module.get<Repository<Judgment>>(
      getRepositoryToken(Judgment),
    );
    agencyRepository = module.get<Repository<CollectionAgency>>(
      getRepositoryToken(CollectionAgency),
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('detectAndClassifyDelinquency', () => {
    it('should detect delinquency for loan with overdue payment', async () => {
      const overdueDate = new Date();
      overdueDate.setDate(overdueDate.getDate() - 5);

      const overdueSchedule: Partial<LoanRepaymentSchedule> = {
        ...mockSchedule,
        paymentDate: overdueDate,
        status: ScheduleEntryStatus.PENDING,
      };

      const queryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([mockLoan as Loan]),
      };
      jest.spyOn(loanRepository, 'createQueryBuilder').mockReturnValue(queryBuilder as any);
      
      const scheduleQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(overdueSchedule as LoanRepaymentSchedule),
      };
      jest.spyOn(scheduleRepository, 'createQueryBuilder').mockReturnValue(scheduleQueryBuilder as any);
      
      jest.spyOn(delinquencyRepository, 'findOne').mockResolvedValue(null);
      jest.spyOn(delinquencyRepository, 'create').mockReturnValue({
        loanId: 'loan-123',
        recordDate: new Date(),
        daysPastDue: 5,
        collectionStage: CollectionStage.EARLY_DELINQUENCY,
      } as DelinquencyRecord);
      jest.spyOn(delinquencyRepository, 'save').mockResolvedValue({
        id: 'delinquency-123',
        loanId: 'loan-123',
        daysPastDue: 5,
        collectionStage: CollectionStage.EARLY_DELINQUENCY,
      } as DelinquencyRecord);
      jest.spyOn(workflowRepository, 'findOne').mockResolvedValue(null);
      jest.spyOn(workflowRepository, 'create').mockReturnValue({} as CollectionWorkflow);
      jest.spyOn(workflowRepository, 'save').mockResolvedValue({} as CollectionWorkflow);
      jest.spyOn(noticeRepository, 'create').mockReturnValue({} as CollectionNotice);
      jest.spyOn(noticeRepository, 'save').mockResolvedValue({} as CollectionNotice);
      jest.spyOn(lateFeeRepository, 'findOne').mockResolvedValue(null);
      jest.spyOn(lateFeeRepository, 'create').mockReturnValue({} as LateFee);
      jest.spyOn(lateFeeRepository, 'save').mockResolvedValue({} as LateFee);
      jest.spyOn(creditBureauRepository, 'findOne').mockResolvedValue(null);
      jest.spyOn(creditBureauRepository, 'create').mockReturnValue({} as CreditBureauUpdate);
      jest.spyOn(creditBureauRepository, 'save').mockResolvedValue({} as CreditBureauUpdate);
      jest.spyOn(loanRepository.manager, 'getRepository').mockReturnValue({
        findOne: jest.fn().mockResolvedValue({ gracePeriodInDays: 0 }),
      } as any);

      const result = await service.detectAndClassifyDelinquency('loan-123');

      expect(result).toBeDefined();
      expect(result).toHaveLength(1);
      expect(result[0].daysPastDue).toBe(5);
      expect(result[0].collectionStage).toBe(CollectionStage.EARLY_DELINQUENCY);
      expect(delinquencyRepository.save).toHaveBeenCalled();
    });

    it('should classify as MODERATE stage for 31-60 days past due', async () => {
      const overdueDate = new Date();
      overdueDate.setDate(overdueDate.getDate() - 45);

      const overdueSchedule: Partial<LoanRepaymentSchedule> = {
        ...mockSchedule,
        paymentDate: overdueDate,
        status: ScheduleEntryStatus.PENDING,
      };

      const queryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([mockLoan as Loan]),
      };
      jest.spyOn(loanRepository, 'createQueryBuilder').mockReturnValue(queryBuilder as any);
      
      const scheduleQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(overdueSchedule as LoanRepaymentSchedule),
      };
      jest.spyOn(scheduleRepository, 'createQueryBuilder').mockReturnValue(scheduleQueryBuilder as any);
      
      jest.spyOn(delinquencyRepository, 'findOne').mockResolvedValue(null);
      jest.spyOn(delinquencyRepository, 'create').mockReturnValue({
        loanId: 'loan-123',
        daysPastDue: 45,
        collectionStage: CollectionStage.MODERATE_DELINQUENCY,
      } as DelinquencyRecord);
      jest.spyOn(delinquencyRepository, 'save').mockResolvedValue({
        id: 'delinquency-123',
        daysPastDue: 45,
        collectionStage: CollectionStage.MODERATE_DELINQUENCY,
      } as DelinquencyRecord);
      jest.spyOn(workflowRepository, 'findOne').mockResolvedValue(null);
      jest.spyOn(workflowRepository, 'create').mockReturnValue({} as CollectionWorkflow);
      jest.spyOn(workflowRepository, 'save').mockResolvedValue({} as CollectionWorkflow);
      jest.spyOn(noticeRepository, 'create').mockReturnValue({} as CollectionNotice);
      jest.spyOn(noticeRepository, 'save').mockResolvedValue({} as CollectionNotice);
      jest.spyOn(lateFeeRepository, 'findOne').mockResolvedValue(null);
      jest.spyOn(lateFeeRepository, 'create').mockReturnValue({} as LateFee);
      jest.spyOn(lateFeeRepository, 'save').mockResolvedValue({} as LateFee);
      jest.spyOn(creditBureauRepository, 'findOne').mockResolvedValue(null);
      jest.spyOn(creditBureauRepository, 'create').mockReturnValue({} as CreditBureauUpdate);
      jest.spyOn(creditBureauRepository, 'save').mockResolvedValue({} as CreditBureauUpdate);
      jest.spyOn(loanRepository.manager, 'getRepository').mockReturnValue({
        findOne: jest.fn().mockResolvedValue({ gracePeriodInDays: 0 }),
      } as any);

      const result = await service.detectAndClassifyDelinquency('loan-123');

      expect(result[0].collectionStage).toBe(CollectionStage.MODERATE_DELINQUENCY);
    });

    it('should return empty array if no loans found', async () => {
      const queryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
      };
      jest.spyOn(loanRepository, 'createQueryBuilder').mockReturnValue(queryBuilder as any);

      const result = await service.detectAndClassifyDelinquency('invalid-loan');

      expect(result).toHaveLength(0);
    });
  });

  // Note: createCollectionWorkflow is a private method triggered by detectAndClassifyDelinquency
  // It's tested indirectly through detectAndClassifyDelinquency tests

  describe('sendCollectionNotice', () => {
    it('should send collection notice', async () => {
      jest.spyOn(loanRepository, 'findOne').mockResolvedValue(mockLoan as Loan);
      jest.spyOn(noticeRepository, 'create').mockReturnValue({
        loanId: 'loan-123',
        noticeType: CollectionNoticeType.FIRST_NOTICE,
        channel: CollectionChannel.EMAIL,
        sentDate: new Date(),
        daysPastDue: 5,
        outstandingBalance: 100000,
      } as any);
      jest.spyOn(noticeRepository, 'save').mockResolvedValue({
        id: 'notice-123',
        noticeType: CollectionNoticeType.FIRST_NOTICE,
      } as any);

      const result = await service.sendCollectionNotice('loan-123', CollectionNoticeType.FIRST_NOTICE, 5, 'workflow-123');

      expect(result).toBeDefined();
      expect(noticeRepository.save).toHaveBeenCalled();
    });
  });

  describe('createCollectionActivity', () => {
    it('should create collection activity', async () => {
      jest.spyOn(loanRepository, 'findOne').mockResolvedValue(mockLoan as Loan);
      jest.spyOn(activityRepository, 'create').mockReturnValue({
        loanId: 'loan-123',
        activityType: CollectionActivityType.PHONE_CALL,
        channel: CollectionChannel.PHONE,
        activityDate: new Date(),
      } as any);
      jest.spyOn(activityRepository, 'save').mockResolvedValue({
        id: 'activity-123',
        activityType: CollectionActivityType.PHONE_CALL,
      } as any);

      const result = await service.createCollectionActivity({
        loanId: 'loan-123',
        activityType: CollectionActivityType.PHONE_CALL,
        channel: CollectionChannel.PHONE,
        activityDate: new Date().toISOString(),
        conversationNotes: 'Spoke with borrower',
      }, 'user-123', 'User Name');

      expect(result).toBeDefined();
      expect(result.activityType).toBe(CollectionActivityType.PHONE_CALL);
      expect(activityRepository.save).toHaveBeenCalled();
    });
  });

  describe('createPaymentArrangement', () => {
    it('should create payment arrangement', async () => {
      jest.spyOn(loanRepository, 'findOne').mockResolvedValue(mockLoan as Loan);
      jest.spyOn(arrangementRepository, 'create').mockReturnValue({
        loanId: 'loan-123',
        startDate: new Date(),
        totalAmount: 10000,
        numberOfPayments: 6,
        paymentAmount: 1666.67,
        status: 'Pending',
      } as PaymentArrangement);
      jest.spyOn(arrangementRepository, 'save').mockResolvedValue({
        id: 'arrangement-123',
        status: 'Pending',
      } as any);
      jest.spyOn(arrangementRepository, 'findOne').mockResolvedValue({
        id: 'arrangement-123',
        startDate: new Date(),
      } as any);
      jest.spyOn(complianceRepository, 'create').mockReturnValue({
        arrangementId: 'arrangement-123',
        dueDate: new Date(),
        dueAmount: 1666.67,
      } as any);
      jest.spyOn(complianceRepository, 'save').mockResolvedValue([] as any);

      const result = await service.createPaymentArrangement({
        loanId: 'loan-123',
        startDate: new Date().toISOString(),
        totalAmount: 10000,
        numberOfPayments: 6,
        paymentAmount: 1666.67,
        paymentFrequency: 'Monthly',
      }, 'user-123', 'User Name');

      expect(result).toBeDefined();
      expect(result).toBeDefined();
      expect(arrangementRepository.save).toHaveBeenCalled();
    });
  });

  describe('createSkipTrace', () => {
    it('should create skip trace record', async () => {
      jest.spyOn(loanRepository, 'findOne').mockResolvedValue(mockLoan as Loan);
      jest.spyOn(skipTraceRepository, 'create').mockReturnValue({
        loanId: 'loan-123',
        initiatedDate: new Date(),
        reason: 'Unreachable',
      } as SkipTrace);
      jest.spyOn(skipTraceRepository, 'save').mockResolvedValue({
        id: 'skip-trace-123',
        reason: 'Unreachable',
      } as SkipTrace);

      const result = await service.createSkipTrace({
        loanId: 'loan-123',
        reason: 'Unreachable',
        searchMethod: 'Database Search',
      }, 'user-123', 'User Name');

      expect(result).toBeDefined();
      expect(result.reason).toBe('Unreachable');
      expect(skipTraceRepository.save).toHaveBeenCalled();
    });
  });

  describe('createLegalAction', () => {
    it('should create legal action', async () => {
      jest.spyOn(loanRepository, 'findOne').mockResolvedValue(mockLoan as Loan);
      jest.spyOn(legalActionRepository, 'create').mockReturnValue({
        loanId: 'loan-123',
        actionType: LegalActionType.CIRCUIT_COURT,
        initiatedDate: new Date(),
        status: 'Pending Review',
      } as any);
      jest.spyOn(legalActionRepository, 'save').mockResolvedValue({
        id: 'legal-action-123',
        actionType: LegalActionType.CIRCUIT_COURT,
      } as any);

      const result = await service.createLegalAction({
        loanId: 'loan-123',
        actionType: LegalActionType.CIRCUIT_COURT,
        claimAmount: 10000,
      }, 'user-123', 'User Name');

      expect(result).toBeDefined();
      expect(result.actionType).toBe(LegalActionType.CIRCUIT_COURT);
      expect(legalActionRepository.save).toHaveBeenCalled();
    });
  });

  describe('createThirdPartyPlacement', () => {
    it('should create third-party placement', async () => {
      jest.spyOn(loanRepository, 'findOne').mockResolvedValue(mockLoan as Loan);
      jest.spyOn(agencyRepository, 'findOne').mockResolvedValue({
        id: 'agency-123',
        agencyName: 'Test Agency',
      } as any);
      jest.spyOn(placementRepository, 'create').mockReturnValue({
        loanId: 'loan-123',
        agencyId: 'agency-123',
        placementDate: new Date(),
        placementAmount: 10000,
        status: 'Placed',
      } as any);
      jest.spyOn(placementRepository, 'save').mockResolvedValue({
        id: 'placement-123',
        status: 'Placed',
      } as any);

      const result = await service.createThirdPartyPlacement({
        loanId: 'loan-123',
        agencyId: 'agency-123',
        placementReason: 'Account unresponsive',
      }, 'user-123', 'User Name');

      expect(result).toBeDefined();
      expect(placementRepository.save).toHaveBeenCalled();
    });
  });

  describe('processChargeOff', () => {
    it('should process charge-off for loan', async () => {
      const npaLoan: Partial<Loan> = {
        ...mockLoan,
        daysPastDue: 180,
        isNpa: true,
        totalPrincipalPaid: 0,
      };

      jest.spyOn(loanRepository, 'findOne').mockResolvedValue(npaLoan as Loan);
      jest.spyOn(loanRepository, 'save').mockResolvedValue(npaLoan as Loan);
      jest.spyOn(creditBureauRepository, 'findOne').mockResolvedValue(null);
      jest.spyOn(creditBureauRepository, 'create').mockReturnValue({} as any);
      jest.spyOn(creditBureauRepository, 'save').mockResolvedValue({} as any);

      await service.processChargeOff('loan-123', new Date(), 'user-123', 'User Name');

      expect(loanRepository.save).toHaveBeenCalled();
    });
  });

  describe('getDelinquentLoans', () => {
    it('should return list of delinquent loans', async () => {
      const delinquentLoan: Partial<Loan> = {
        ...mockLoan,
        daysPastDue: 5,
      };

      const queryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([delinquentLoan as Loan]),
      };
      jest.spyOn(loanRepository, 'createQueryBuilder').mockReturnValue(queryBuilder as any);

      const result = await service.getDelinquentLoans();

      expect(result).toHaveLength(1);
      expect(result[0].daysPastDue).toBeGreaterThan(0);
    });
  });
});

