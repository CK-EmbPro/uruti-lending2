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
import { LoanApplication } from '../../loan-application/entities/loan-application.entity';

export enum RefinancingType {
  RATE_AND_TERM = 'Rate and Term',
  CASH_OUT = 'Cash-Out',
  CONSOLIDATION = 'Consolidation',
}

export enum RefinancingStatus {
  PENDING = 'Pending',
  ELIGIBILITY_CHECKED = 'Eligibility Checked',
  CREDIT_CHECKED = 'Credit Checked',
  OFFERED = 'Offered',
  ACCEPTED = 'Accepted',
  REJECTED = 'Rejected',
  CLOSED = 'Closed',
  CANCELLED = 'Cancelled',
}

@Entity('refinancing_applications')
@Index(['loanId'])
@Index(['status'])
export class RefinancingApplication {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Loan)
  loan: Loan;

  @Column()
  loanId: string;

  @ManyToOne(() => LoanApplication, { nullable: true })
  newLoanApplication: LoanApplication;

  @Column({ nullable: true })
  newLoanApplicationId: string;

  @Column({
    type: 'enum',
    enum: RefinancingType,
  })
  refinancingType: RefinancingType;

  @Column({
    type: 'enum',
    enum: RefinancingStatus,
    default: RefinancingStatus.PENDING,
  })
  status: RefinancingStatus;

  @Column('decimal', { precision: 15, scale: 2, nullable: true })
  requestedAmount: number;

  @Column('decimal', { precision: 5, scale: 2, nullable: true })
  requestedRate: number;

  @Column({ type: 'int', nullable: true })
  requestedTerm: number;

  @Column({ type: 'boolean', default: false })
  eligibilityChecked: boolean;

  @Column({ type: 'boolean', default: false })
  eligible: boolean;

  @Column({ type: 'text', nullable: true })
  eligibilityNotes: string;

  @Column({ type: 'boolean', default: false })
  creditChecked: boolean;

  @Column({ type: 'text', nullable: true })
  creditCheckResult: string;

  @Column('decimal', { precision: 5, scale: 2, nullable: true })
  offeredRate: number;

  @Column('decimal', { precision: 15, scale: 2, nullable: true })
  offeredAmount: number;

  @Column({ type: 'int', nullable: true })
  offeredTerm: number;

  @Column({ type: 'date', nullable: true })
  offerExpiryDate: Date;

  @Column({ type: 'date', nullable: true })
  offerAcceptedDate: Date;

  @Column({ type: 'date', nullable: true })
  existingLoanClosedDate: Date;

  @Column({ nullable: true })
  newLoanId: string; // ID of new loan created

  @Column({ type: 'text', nullable: true })
  rejectionReason: string;

  @Column({ nullable: true })
  requestedBy: string; // Borrower ID

  @Column({ type: 'date' })
  requestedDate: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}














