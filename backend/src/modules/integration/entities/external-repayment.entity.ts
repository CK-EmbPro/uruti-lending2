import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { ThirdPartyPlatform } from './third-party-platform.entity';
import { Loan } from '../../loan/entities/loan.entity';
import { LoanRepayment } from '../../loan-repayment/entities/loan-repayment.entity';

export enum ExternalRepaymentStatus {
  PENDING = 'Pending',
  PROCESSED = 'Processed',
  FAILED = 'Failed',
  REVERSED = 'Reversed',
}

@Entity('external_repayments')
@Index(['platformId'])
@Index(['externalReferenceId', 'platformId'], { unique: true })
@Index(['loanId'])
@Index(['repaymentId'])
@Index(['status'])
export class ExternalRepayment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  platformId: string;

  @ManyToOne(() => ThirdPartyPlatform)
  platform: ThirdPartyPlatform;

  @Column({ unique: true })
  externalReferenceId: string; // External system's payment reference

  @Column()
  loanId: string;

  @ManyToOne(() => Loan)
  loan: Loan;

  @Column({ nullable: true })
  repaymentId: string; // Link to internal repayment record

  @ManyToOne(() => LoanRepayment, { nullable: true })
  repayment: LoanRepayment;

  @Column({
    type: 'enum',
    enum: ExternalRepaymentStatus,
    default: ExternalRepaymentStatus.PENDING,
  })
  status: ExternalRepaymentStatus;

  @Column('decimal', { precision: 15, scale: 2 })
  amount: number;

  @Column({ type: 'date' })
  paymentDate: Date;

  // Trip Financing Specific
  @Column({ nullable: true })
  tripId: string; // Trip ID from UrutiX

  @Column({ nullable: true })
  revenueTransactionId: string; // Revenue transaction ID

  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
  totalTripRevenue: number; // Total revenue from trip

  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
  repaymentPercentage: number; // Percentage of revenue used for repayment

  // Processing
  @Column({ type: 'text', nullable: true })
  processingNotes: string;

  @Column({ type: 'text', nullable: true })
  failureReason: string;

  @Column({ type: 'jsonb', nullable: true })
  externalData: Record<string, any>; // Additional data from external system

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ nullable: true })
  processedBy: string;

  @Column({ type: 'timestamp', nullable: true })
  processedAt: Date;
}

