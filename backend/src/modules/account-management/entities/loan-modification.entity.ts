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

export enum ModificationType {
  RATE_REDUCTION = 'Rate Reduction',
  TERM_EXTENSION = 'Term Extension',
  PAYMENT_HOLIDAY = 'Payment Holiday',
  PAYMENT_REDUCTION = 'Payment Reduction',
  OTHER = 'Other',
}

export enum ModificationStatus {
  PENDING = 'Pending',
  UNDER_REVIEW = 'Under Review',
  APPROVED = 'Approved',
  REJECTED = 'Rejected',
  EXECUTED = 'Executed',
  CANCELLED = 'Cancelled',
}

@Entity('loan_modifications')
@Index(['loanId'])
@Index(['status'])
export class LoanModification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Loan)
  loan: Loan;

  @Column()
  loanId: string;

  @Column({
    type: 'enum',
    enum: ModificationType,
  })
  modificationType: ModificationType;

  @Column({
    type: 'enum',
    enum: ModificationStatus,
    default: ModificationStatus.PENDING,
  })
  status: ModificationStatus;

  @Column('decimal', { precision: 5, scale: 2, nullable: true })
  newInterestRate: number; // For rate reduction

  @Column({ type: 'int', nullable: true })
  newTermMonths: number; // For term extension

  @Column({ type: 'int', nullable: true })
  paymentHolidayMonths: number; // For payment holiday

  @Column('decimal', { precision: 15, scale: 2, nullable: true })
  newPaymentAmount: number; // For payment reduction

  @Column({ type: 'text' })
  reason: string; // Financial hardship reason

  @Column({ type: 'text', nullable: true })
  hardshipDocumentation: string; // Path to documentation

  @Column({ nullable: true })
  requestedBy: string; // Borrower ID

  @Column({ type: 'date' })
  requestedDate: Date;

  @Column({ nullable: true })
  reviewedBy: string; // Underwriter ID

  @Column({ type: 'date', nullable: true })
  reviewedDate: Date;

  @Column({ type: 'text', nullable: true })
  reviewNotes: string;

  @Column({ nullable: true })
  approvedBy: string;

  @Column({ type: 'date', nullable: true })
  approvedDate: Date;

  @Column({ type: 'text', nullable: true })
  rejectionReason: string;

  @Column({ type: 'date', nullable: true })
  executedDate: Date;

  @Column({ type: 'text', nullable: true })
  modificationAgreement: string; // Path to agreement

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}














