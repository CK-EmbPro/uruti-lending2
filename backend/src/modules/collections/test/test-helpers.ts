import { Loan, LoanStatus } from '../../loan/entities/loan.entity';
import { LoanRepaymentSchedule, ScheduleEntryStatus } from '../../loan/entities/loan-repayment-schedule.entity';
import { DelinquencyRecord } from '../entities/delinquency-record.entity';
import { CollectionWorkflow } from '../entities/collection-workflow.entity';
import { CollectionStage } from '../../../common/enums/collection-stage.enum';

export const createMockLoan = (overrides: Partial<Loan> = {}): Partial<Loan> => ({
  id: 'loan-123',
  loanNumber: 'LOAN-001',
  loanAmount: 100000,
  disbursedAmount: 100000,
  rateOfInterest: 12.5,
  status: LoanStatus.ACTIVE,
  daysPastDue: 0,
  isNpa: false,
  ...overrides,
});

export const createMockSchedule = (overrides: Partial<LoanRepaymentSchedule> = {}): Partial<LoanRepaymentSchedule> => ({
  id: 'schedule-123',
  loanId: 'loan-123',
  paymentDate: new Date('2024-12-15'),
  status: ScheduleEntryStatus.PENDING,
  principalAmount: 8333.33,
  interestAmount: 1041.67,
  totalPayment: 9375.00,
  ...overrides,
});

export const createMockDelinquencyRecord = (overrides: Partial<DelinquencyRecord> = {}): Partial<DelinquencyRecord> => ({
  id: 'delinquency-123',
  loanId: 'loan-123',
  recordDate: new Date(),
  daysPastDue: 5,
  collectionStage: CollectionStage.EARLY_DELINQUENCY,
  outstandingBalance: 100000,
  lateFeeAssessed: 0,
  creditBureauUpdated: false,
  ...overrides,
});

export const createMockWorkflow = (overrides: Partial<CollectionWorkflow> = {}): Partial<CollectionWorkflow> => ({
  id: 'workflow-123',
  loanId: 'loan-123',
  startDate: new Date(),
  currentStage: CollectionStage.EARLY_DELINQUENCY,
  daysPastDue: 5,
  active: true,
  ...overrides,
});

export const createOverdueSchedule = (daysPastDue: number): Partial<LoanRepaymentSchedule> => {
  const overdueDate = new Date();
  overdueDate.setDate(overdueDate.getDate() - daysPastDue);
  
  return createMockSchedule({
    paymentDate: overdueDate,
    status: ScheduleEntryStatus.PENDING,
  });
};

