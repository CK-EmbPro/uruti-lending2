import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { Loan } from '../../loan/entities/loan.entity';
import { LoanRepayment } from '../../loan-repayment/entities/loan-repayment.entity';

export enum ReversalReason {
  NSF = 'NSF (Non-Sufficient Funds)',
  BANK_ERROR = 'Bank Error',
  FRAUD = 'Fraud',
  BORROWER_REQUEST = 'Borrower Request',
  DUPLICATE_PAYMENT = 'Duplicate Payment',
  UNAUTHORIZED = 'Unauthorized Transaction',
  OTHER = 'Other',
}

export enum ReversalStatus {
  PENDING = 'Pending',
  PROCESSED = 'Processed',
  FAILED = 'Failed',
}

@Entity('payment_reversals')
@Index(['loanId'])
@Index(['repaymentId'])
@Index(['status'])
export class PaymentReversal {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Loan)
  loan: Loan;

  @Column()
  loanId: string;

  @ManyToOne(() => LoanRepayment)
  repayment: LoanRepayment;

  @Column()
  repaymentId: string;

  @Column('decimal', { precision: 15, scale: 2 })
  reversalAmount: number;

  @Column({
    type: 'enum',
    enum: ReversalReason,
  })
  reason: ReversalReason;

  @Column({
    type: 'enum',
    enum: ReversalStatus,
    default: ReversalStatus.PENDING,
  })
  status: ReversalStatus;

  @Column('decimal', { precision: 15, scale: 2, default: 0 })
  nsfFee: number; // NSF fee if applicable

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ nullable: true })
  processedBy: string; // User ID

  @Column({ type: 'timestamp', nullable: true })
  processedAt: Date;

  @Column({ type: 'boolean', default: false })
  borrowerNotified: boolean;

  @Column({ type: 'timestamp', nullable: true })
  borrowerNotifiedAt: Date;

  @Column({ type: 'boolean', default: false })
  collectionInitiated: boolean;

  @Column({ type: 'timestamp', nullable: true })
  collectionInitiatedAt: Date;

  @CreateDateColumn()
  createdAt: Date;
}

