import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  JoinColumn,
} from 'typeorm';
import { LoanStatus } from '../../../common/enums/loan-status.enum';

export { LoanStatus };
import { ApplicantType } from '../../../common/enums/applicant-type.enum';
import { RepaymentScheduleType } from '../../../common/enums/repayment-schedule-type.enum';
import { RepaymentFrequency } from '../../../common/enums/repayment-frequency.enum';
import { LoanProduct } from '../../loan-product/entities/loan-product.entity';
import { LoanDisbursement } from '../../loan-disbursement/entities/loan-disbursement.entity';
import { LoanRepayment } from '../../loan-repayment/entities/loan-repayment.entity';
import { LoanRepaymentSchedule } from './loan-repayment-schedule.entity';
import { Currency } from '../../currency/entities/currency.entity';

@Entity('loans')
@Index(['status'])
@Index(['applicantId', 'applicantType'])
@Index(['loanProductId'])
@Index(['postingDate'])
export class Loan {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  loanNumber: string;

  @Column()
  companyId: string;

  @Column({
    type: 'enum',
    enum: ApplicantType,
  })
  applicantType: ApplicantType;

  @Column()
  applicantId: string;

  @ManyToOne(() => LoanProduct)
  loanProduct: LoanProduct;

  @Column()
  loanProductId: string;

  // Currency fields
  @ManyToOne(() => Currency, { nullable: true })
  @JoinColumn({ name: 'currencyId' })
  currency: Currency | null;

  @Column({ type: 'uuid', nullable: true })
  currencyId: string | null;

  @Column('decimal', { precision: 15, scale: 2 })
  loanAmount: number;

  @Column('decimal', { precision: 15, scale: 2, nullable: true })
  loanAmountBaseCurrency: number | null; // Loan amount in base currency

  @Column('decimal', { precision: 18, scale: 6, nullable: true })
  exchangeRateAtDisbursement: number | null; // Exchange rate at disbursement

  @Column('decimal', { precision: 15, scale: 2, default: 0 })
  disbursedAmount: number;

  @Column('decimal', { precision: 5, scale: 2 })
  rateOfInterest: number;

  @Column('decimal', { precision: 5, scale: 2, default: 0 })
  penaltyInterestRate: number;

  @Column({ type: 'int', nullable: true })
  repaymentPeriods: number;

  @Column({
    type: 'enum',
    enum: RepaymentFrequency,
    nullable: true,
  })
  repaymentFrequency: RepaymentFrequency;

  @Column({ nullable: true })
  repaymentMethod: string;

  @Column({ type: 'date', nullable: true })
  repaymentStartDate: Date;

  @Column({
    type: 'enum',
    enum: RepaymentScheduleType,
    nullable: true,
  })
  repaymentScheduleType: RepaymentScheduleType;

  @Column({ type: 'varchar', length: 50, nullable: true })
  repaymentStructure: string; // FIXED, GRADUATED, SEASONAL, BULLET - Selected by borrower

  @Column({
    type: 'enum',
    enum: LoanStatus,
    default: LoanStatus.DRAFT,
  })
  status: LoanStatus;

  @Column({ type: 'boolean', default: false })
  isTermLoan: boolean;

  @Column({ type: 'boolean', default: false })
  isSecuredLoan: boolean;

  @Column({ type: 'date' })
  postingDate: Date;

  @Column({ type: 'date', nullable: true })
  disbursementDate: Date;

  @Column({ type: 'date', nullable: true })
  closureDate: Date;

  // Calculated fields
  @Column('decimal', { precision: 15, scale: 2, default: 0 })
  totalPrincipalPaid: number;

  @Column('decimal', { precision: 15, scale: 2, default: 0 })
  totalInterestPaid: number;

  @Column('decimal', { precision: 15, scale: 2, default: 0 })
  totalPenaltyPaid: number;

  @Column('decimal', { precision: 15, scale: 2, default: 0 })
  totalAmountPaid: number;

  @Column('decimal', { precision: 15, scale: 2, default: 0 })
  excessAmountPaid: number;

  @Column('decimal', { precision: 15, scale: 2, default: 0 })
  writtenOffAmount: number;

  // Additional calculated fields for proper business rules
  @Column('decimal', { precision: 15, scale: 2, nullable: true })
  maximumLoanAmount: number; // Maximum loan amount based on security

  @Column('decimal', { precision: 15, scale: 2, default: 0 })
  totalPayment: number; // Total payment amount

  @Column('decimal', { precision: 15, scale: 2, default: 0 })
  debitAdjustmentAmount: number; // Debit adjustments

  @Column('decimal', { precision: 15, scale: 2, default: 0 })
  creditAdjustmentAmount: number; // Credit adjustments

  // Moratorium fields
  @Column({ type: 'int', nullable: true })
  moratoriumTenure: number; // Number of months for moratorium

  @Column({ nullable: true })
  moratoriumType: string; // EMI or Principal

  @Column({ type: 'date', nullable: true })
  moratoriumEndDate: Date; // Calculated end date of moratorium

  @Column({ nullable: true })
  interestTreatmentDuringMoratorium: string; // Capitalize, Add to First EMI, Carry Forward

  // Line of Credit fields
  @Column({ type: 'date', nullable: true })
  limitApplicableStart: Date; // Limit start date for LOC

  @Column({ type: 'date', nullable: true })
  limitApplicableEnd: Date; // Limit end date for LOC

  @Column('decimal', { precision: 15, scale: 2, nullable: true })
  maximumLimitAmount: number; // Maximum limit for LOC

  @Column('decimal', { precision: 15, scale: 2, default: 0 })
  utilizedLimitAmount: number; // Utilized limit for LOC

  @Column('decimal', { precision: 15, scale: 2, default: 0 })
  availableLimitAmount: number; // Available limit for LOC

  @Column('decimal', { precision: 15, scale: 2, default: 0 })
  refundAmount: number; // Refund amount

  @Column('decimal', { precision: 15, scale: 2, default: 0 })
  totalInterestPayable: number; // Total interest payable

  @Column('decimal', { precision: 15, scale: 2, default: 0 })
  outstandingAmount: number; // Outstanding amount (calculated)

  @Column({ type: 'date', nullable: true })
  maturityDate: Date; // Maturity date for the loan

  @Column({ nullable: true })
  applicantEmail: string; // Applicant email for notifications

  @Column({ type: 'int', default: 0 })
  daysPastDue: number;

  @Column({ type: 'boolean', default: false })
  isNpa: boolean;

  @Column({ type: 'boolean', default: false })
  manualNpa: boolean;

  @Column({ type: 'boolean', default: false })
  unmarkNpa: boolean;

  @Column({ type: 'date', nullable: true })
  watchPeriodEndDate: Date;

  @Column({ nullable: true })
  classificationCode: string;

  @Column({ nullable: true })
  classificationName: string;

  // Account references
  @Column()
  disbursementAccount: string;

  @Column()
  paymentAccount: string;

  @Column()
  loanAccount: string;

  @Column()
  interestIncomeAccount: string;

  @Column()
  penaltyIncomeAccount: string;

  @Column({ nullable: true })
  costCenter: string;

  // Relationships
  @OneToMany(() => LoanDisbursement, (disbursement) => disbursement.loan)
  disbursements: LoanDisbursement[];

  @OneToMany(() => LoanRepayment, (repayment) => repayment.loan)
  repayments: LoanRepayment[];

  @OneToMany(() => LoanRepaymentSchedule, (schedule) => schedule.loan)
  repaymentSchedule: LoanRepaymentSchedule[];

  // Co-Lending fields
  @Column({ nullable: true })
  loanPartnerId: string; // Link to Loan Partner

  @Column('decimal', { precision: 5, scale: 2, nullable: true })
  loanPartnerSharePercentage: number; // Partner's share percentage

  @Column('decimal', { precision: 5, scale: 2, nullable: true })
  loanPartnerInterestRate: number; // Partner's interest rate

  @Column('decimal', { precision: 5, scale: 2, nullable: true })
  loanPartnerPaymentRatio: number; // Payment ratio for partner

  @Column({ nullable: true })
  loanPartnerRepaymentScheduleType: string; // Partner's repayment schedule type

  @Column('decimal', { precision: 15, scale: 2, default: 0 })
  totalPartnerInterestShare: number; // Total partner interest share

  @Column('decimal', { precision: 15, scale: 2, default: 0 })
  totalPartnerPrincipalShare: number; // Total partner principal share

  // FLDG (First Loss Default Guarantee) fields
  @Column({ type: 'boolean', default: false })
  fldgTriggered: boolean; // Whether FLDG has been triggered

  @Column({ type: 'date', nullable: true })
  fldgTriggerDate: Date; // Date when FLDG was triggered

  // Broken Period Interest (BPI)
  @Column('decimal', { precision: 15, scale: 2, default: 0 })
  brokenPeriodInterest: number; // Total BPI amount

  @Column({ type: 'int', nullable: true })
  brokenPeriodDays: number; // Number of broken period days

  // Security Deposit
  @Column('decimal', { precision: 15, scale: 2, default: 0 })
  securityDepositAmount: number; // Total security deposit collected

  @Column('decimal', { precision: 15, scale: 2, default: 0 })
  securityDepositUsed: number; // Amount of security deposit used

  @Column('decimal', { precision: 15, scale: 2, default: 0 })
  securityDepositAvailable: number; // Available security deposit

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

