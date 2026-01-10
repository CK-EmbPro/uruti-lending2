import { LoanStatus } from '../../../common/enums/loan-status.enum';
import { ApplicantType } from '../../../common/enums/applicant-type.enum';
import { RepaymentScheduleType } from '../../../common/enums/repayment-schedule-type.enum';
import { RepaymentFrequency } from '../../../common/enums/repayment-frequency.enum';

export class LoanResponseDto {
  id: string;
  loanNumber: string;
  companyId: string;
  applicantType: ApplicantType;
  applicantId: string;
  loanProductId: string;
  loanAmount: number;
  disbursedAmount: number;
  rateOfInterest: number;
  penaltyInterestRate: number;
  repaymentPeriods?: number;
  repaymentFrequency?: RepaymentFrequency;
  repaymentMethod?: string;
  repaymentStartDate?: Date;
  repaymentScheduleType?: RepaymentScheduleType;
  status: LoanStatus;
  isTermLoan: boolean;
  isSecuredLoan: boolean;
  postingDate: Date;
  disbursementDate?: Date;
  closureDate?: Date;
  totalPrincipalPaid: number;
  totalInterestPaid: number;
  totalPenaltyPaid: number;
  totalAmountPaid: number;
  excessAmountPaid: number;
  writtenOffAmount: number;
  daysPastDue: number;
  isNpa: boolean;
  createdAt: Date;
  updatedAt: Date;
}

