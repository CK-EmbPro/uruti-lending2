import { Loan, LoanStatus } from '../../loan/entities/loan.entity';
import { PaymentExtension } from '../entities/payment-extension.entity';
import { Dispute } from '../entities/dispute.entity';
import { AccountUpdate } from '../entities/account-update.entity';
import { FeeWaiver } from '../entities/fee-waiver.entity';
import { ExtensionStatus } from '../../../common/enums/extension-status.enum';
import { ExtensionType } from '../../../common/enums/extension-type.enum';
import { DisputeStatus } from '../../../common/enums/dispute-status.enum';
import { DisputeType } from '../../../common/enums/dispute-type.enum';
import { WaiverStatus } from '../../../common/enums/waiver-status.enum';
import { WaiverType } from '../../../common/enums/waiver-type.enum';
import { AccountUpdateType } from '../../../common/enums/account-update-type.enum';

export const createMockLoan = (overrides: Partial<Loan> = {}): Partial<Loan> => ({
  id: 'loan-123',
  loanNumber: 'LOAN-001',
  loanAmount: 100000,
  disbursedAmount: 100000,
  rateOfInterest: 12.5,
  status: LoanStatus.ACTIVE,
  ...overrides,
});

export const createMockPaymentExtension = (overrides: Partial<PaymentExtension> = {}): Partial<PaymentExtension> => ({
  id: 'extension-123',
  loanId: 'loan-123',
  requestDate: new Date(),
  originalDueDate: new Date('2024-12-15'),
  newDueDate: new Date('2024-12-22'),
  extensionDays: 7,
  extensionType: ExtensionType.ONE_TIME_COURTESY,
  status: ExtensionStatus.PENDING,
  approved: false,
  ...overrides,
});

export const createMockDispute = (overrides: Partial<Dispute> = {}): Partial<Dispute> => ({
  id: 'dispute-123',
  loanId: 'loan-123',
  disputeDate: new Date(),
  disputeType: DisputeType.PAYMENT_DISPUTE,
  status: DisputeStatus.OPEN,
  description: 'Payment dispute',
  ...overrides,
});

export const createMockAccountUpdate = (overrides: Partial<AccountUpdate> = {}): Partial<AccountUpdate> => ({
  id: 'update-123',
  loanId: 'loan-123',
  updateDate: new Date(),
  updateType: AccountUpdateType.ADDRESS_CHANGE,
  identityVerified: false,
  ...overrides,
});

export const createMockFeeWaiver = (overrides: Partial<FeeWaiver> = {}): Partial<FeeWaiver> => ({
  id: 'waiver-123',
  loanId: 'loan-123',
  requestDate: new Date(),
  waiverType: WaiverType.ONE_TIME_COURTESY,
  feeType: 'Late Fee',
  feeAmount: 50,
  status: WaiverStatus.PENDING,
  approved: false,
  ...overrides,
});

