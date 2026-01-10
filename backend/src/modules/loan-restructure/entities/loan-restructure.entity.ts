import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { Loan } from '../../loan/entities/loan.entity';
import {
  RestructureType,
  RestructureStatus,
  InterestTreatment,
} from '../../../common/enums/restructure-type.enum';

@Entity('loan_restructures')
@Index(['loanId'])
@Index(['status'])
@Index(['restructureDate'])
export class LoanRestructure {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Loan)
  loan: Loan;

  @Column()
  loanId: string;

  @Column()
  companyId: string;

  @Column({
    type: 'enum',
    enum: RestructureType,
    default: RestructureType.NORMAL_RESTRUCTURE,
  })
  restructureType: RestructureType;

  @Column({
    type: 'enum',
    enum: RestructureStatus,
    default: RestructureStatus.INITIATED,
  })
  status: RestructureStatus;

  @Column({ type: 'timestamp' })
  restructureDate: Date;

  @Column({ type: 'text', nullable: true })
  reasonForRestructure: string;

  // Pre-restructure details
  @Column('decimal', { precision: 15, scale: 2 })
  oldLoanAmount: number;

  @Column('decimal', { precision: 15, scale: 2 })
  disbursedAmount: number;

  @Column({ type: 'int' })
  oldTenure: number; // in months

  @Column({ type: 'int', default: 0 })
  completedTenure: number; // in months

  @Column('decimal', { precision: 5, scale: 2 })
  oldRateOfInterest: number;

  @Column('decimal', { precision: 15, scale: 2, nullable: true })
  oldEmi: number;

  @Column({ type: 'int', default: 0 })
  currentRestructureCount: number;

  @Column({ type: 'int', default: 0 })
  preRestructureDpd: number; // Days past due

  // Overdue amounts
  @Column('decimal', { precision: 15, scale: 2, default: 0 })
  totalOverdueAmount: number;

  @Column('decimal', { precision: 15, scale: 2, default: 0 })
  principalOverdue: number;

  @Column('decimal', { precision: 15, scale: 2, default: 0 })
  interestOverdue: number;

  @Column('decimal', { precision: 15, scale: 2, default: 0 })
  penaltyOverdue: number;

  @Column('decimal', { precision: 15, scale: 2, default: 0 })
  chargesOverdue: number;

  @Column('decimal', { precision: 15, scale: 2, default: 0 })
  unaccruedInterest: number;

  // Principal adjustments
  @Column('decimal', { precision: 15, scale: 2, default: 0 })
  pendingPrincipalAmount: number;

  @Column('decimal', { precision: 15, scale: 2, default: 0 })
  principalAdjusted: number;

  @Column('decimal', { precision: 15, scale: 2, default: 0 })
  balancePrincipal: number;

  // Interest adjustments
  @Column('decimal', { precision: 15, scale: 2, default: 0 })
  adjustedInterestAmount: number;

  @Column('decimal', { precision: 15, scale: 2, default: 0 })
  adjustedUnaccruedInterest: number;

  @Column('decimal', { precision: 15, scale: 2, default: 0 })
  interestWaiverAmount: number;

  @Column('decimal', { precision: 15, scale: 2, default: 0 })
  unaccruedInterestWaiver: number;

  @Column('decimal', { precision: 15, scale: 2, default: 0 })
  balanceInterestAmount: number;

  @Column('decimal', { precision: 15, scale: 2, default: 0 })
  balanceUnaccruedInterest: number;

  // Penalty adjustments
  @Column('decimal', { precision: 15, scale: 2, default: 0 })
  penalInterestWaiver: number;

  @Column('decimal', { precision: 15, scale: 2, default: 0 })
  balancePenaltyAmount: number;

  // Charges adjustments
  @Column('decimal', { precision: 15, scale: 2, default: 0 })
  otherChargesWaiver: number;

  @Column('decimal', { precision: 15, scale: 2, default: 0 })
  balanceCharges: number;

  // Treatment options
  @Column({
    type: 'enum',
    enum: InterestTreatment,
    nullable: true,
  })
  treatmentOfNormalInterest: InterestTreatment;

  @Column({
    type: 'enum',
    enum: InterestTreatment,
    nullable: true,
  })
  unaccruedInterestTreatment: InterestTreatment;

  @Column({
    type: 'enum',
    enum: InterestTreatment,
    nullable: true,
  })
  treatmentOfPenalInterest: InterestTreatment;

  @Column({
    type: 'enum',
    enum: InterestTreatment,
    nullable: true,
  })
  treatmentOfOtherCharges: InterestTreatment;

  // New loan details
  @Column('decimal', { precision: 5, scale: 2, nullable: true })
  newRateOfInterest: number;

  @Column({ type: 'date', nullable: true })
  repaymentStartDate: Date;

  @Column({ nullable: true })
  newRepaymentMethod: string;

  @Column({ type: 'int', nullable: true })
  newRepaymentPeriodInMonths: number;

  @Column('decimal', { precision: 15, scale: 2, nullable: true })
  newMonthlyRepaymentAmount: number;

  @Column('decimal', { precision: 15, scale: 2, nullable: true })
  newLoanAmount: number;

  // Restructure charges
  @Column('decimal', { precision: 15, scale: 2, default: 0 })
  restructureCharges: number;

  @Column({ type: 'boolean', default: false })
  waiveOffRestructureCharges: boolean;

  // Security deposit
  @Column('decimal', { precision: 15, scale: 2, default: 0 })
  availableSecurityDeposit: number;

  // Watch period
  @Column({ type: 'date', nullable: true })
  watchPeriodEndDate: Date;

  // Totals
  @Column('decimal', { precision: 15, scale: 2, default: 0 })
  totalAmountPaid: number;

  @Column('decimal', { precision: 15, scale: 2, default: 0 })
  totalPrincipalPaid: number;

  // Schedule comparison data
  @Column({ type: 'jsonb', nullable: true })
  oldScheduleSummary: {
    totalPayments: number;
    totalInterest: number;
    totalPrincipal: number;
    totalCost: number;
    numberOfPayments: number;
  };

  @Column({ type: 'jsonb', nullable: true })
  newScheduleSummary: {
    totalPayments: number;
    totalInterest: number;
    totalPrincipal: number;
    totalCost: number;
    numberOfPayments: number;
  };

  @Column({ type: 'jsonb', nullable: true })
  impactAnalysis: {
    interestDifference: number;
    totalCostDifference: number;
    paymentDifference: number;
    extensionMonths: number;
    percentageIncrease: number;
  };

  @Column({ type: 'boolean', default: false })
  borrowerAcknowledged: boolean;

  @Column({ type: 'timestamp', nullable: true })
  acknowledgedAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

