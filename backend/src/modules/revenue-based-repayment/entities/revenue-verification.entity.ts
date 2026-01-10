import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { RevenueTracking } from './revenue-tracking.entity';
import { Loan } from '../../loan/entities/loan.entity';

export enum VerificationStatus {
  PENDING = 'PENDING',
  VERIFIED = 'VERIFIED',
  DISCREPANCY = 'DISCREPANCY',
  REJECTED = 'REJECTED',
}

export enum DiscrepancyType {
  AMOUNT_MISMATCH = 'AMOUNT_MISMATCH',
  DATE_MISMATCH = 'DATE_MISMATCH',
  MISSING_TRANSACTION = 'MISSING_TRANSACTION',
  DUPLICATE_TRANSACTION = 'DUPLICATE_TRANSACTION',
}

@Entity('revenue_verifications')
@Index(['loanId'])
@Index(['revenueTrackingId'])
@Index(['status'])
@Index(['reportedDate'])
export class RevenueVerification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  loanId: string;

  @ManyToOne(() => Loan)
  @JoinColumn({ name: 'loanId' })
  loan: Loan;

  @Column()
  revenueTrackingId: string;

  @ManyToOne(() => RevenueTracking)
  @JoinColumn({ name: 'revenueTrackingId' })
  revenueTracking: RevenueTracking;

  @Column()
  companyId: string;

  // Reported revenue
  @Column('decimal', { precision: 15, scale: 2 })
  reportedRevenue: number;

  @Column({ type: 'date' })
  reportedDate: Date;

  // Bank statement data
  @Column('decimal', { precision: 15, scale: 2, nullable: true })
  bankStatementAmount: number;

  @Column({ type: 'date', nullable: true })
  bankStatementDate: Date;

  @Column({ nullable: true })
  bankAccountId: string;

  @Column({ nullable: true })
  bankTransactionId: string; // Reference to bank transaction

  // Verification results
  @Column({
    type: 'enum',
    enum: VerificationStatus,
    default: VerificationStatus.PENDING,
  })
  status: VerificationStatus;

  @Column({
    type: 'enum',
    enum: DiscrepancyType,
    nullable: true,
  })
  discrepancyType: DiscrepancyType;

  @Column('decimal', { precision: 15, scale: 2, nullable: true })
  discrepancyAmount: number; // Difference between reported and bank statement

  @Column('decimal', { precision: 5, scale: 2, nullable: true })
  discrepancyPercentage: number; // Percentage difference

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ nullable: true })
  verifiedBy: string; // User ID who verified

  @Column({ type: 'timestamp', nullable: true })
  verifiedAt: Date;

  @Column({ type: 'jsonb', nullable: true })
  verificationDetails: {
    matchingTransactions?: string[]; // Bank transaction IDs that match
    missingTransactions?: string[];
    flaggedReasons?: string[];
  };

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

