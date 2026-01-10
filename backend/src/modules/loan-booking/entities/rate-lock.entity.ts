import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { Loan } from '../../loan/entities/loan.entity';
import { LoanApplication } from '../../loan-application/entities/loan-application.entity';

export enum RateLockStatus {
  PENDING = 'Pending',
  ACTIVE = 'Active',
  EXPIRED = 'Expired',
  EXTENDED = 'Extended',
  CANCELLED = 'Cancelled',
}

export enum RateLockType {
  STANDARD = 'Standard',
  FLOAT_DOWN = 'Float-Down',
  AUTOMATIC_EXTENSION = 'Automatic Extension',
}

@Entity('rate_locks')
@Index(['loanId'])
@Index(['applicationId'])
@Index(['status'])
@Index(['expiryDate'])
export class RateLock {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  loanId: string; // Null if locked before loan creation

  @ManyToOne(() => Loan, { nullable: true })
  @JoinColumn({ name: 'loanId' })
  loan: Loan;

  @Column({ nullable: true })
  applicationId: string; // Link to application if locked during application

  @ManyToOne(() => LoanApplication, { nullable: true })
  @JoinColumn({ name: 'applicationId' })
  application: LoanApplication;

  @Column({
    type: 'enum',
    enum: RateLockStatus,
    default: RateLockStatus.PENDING,
  })
  status: RateLockStatus;

  @Column({
    type: 'enum',
    enum: RateLockType,
    default: RateLockType.STANDARD,
  })
  lockType: RateLockType;

  @Column('decimal', { precision: 5, scale: 2 })
  lockedRate: number; // The interest rate that is locked

  @Column('decimal', { precision: 5, scale: 2, nullable: true })
  currentRate: number; // Current market rate (for comparison)

  @Column('decimal', { precision: 5, scale: 2, nullable: true })
  floatDownRate: number; // Lower rate if float-down option is exercised

  @Column({ type: 'int' })
  lockPeriodDays: number; // Number of days the rate is locked

  @Column({ type: 'date' })
  lockDate: Date; // Date when rate was locked

  @Column({ type: 'date' })
  expiryDate: Date; // Date when rate lock expires

  @Column({ type: 'date', nullable: true })
  extendedExpiryDate: Date; // New expiry date if extended

  @Column({ type: 'int', default: 0 })
  extensionCount: number; // Number of times extended

  @Column({ type: 'int', nullable: true })
  maxExtensions: number; // Maximum allowed extensions

  @Column({ type: 'boolean', default: false })
  autoExtend: boolean; // Whether to automatically extend on expiry

  @Column({ type: 'boolean', default: false })
  floatDownEligible: boolean; // Whether borrower is eligible for float-down

  @Column('decimal', { precision: 5, scale: 2, nullable: true })
  floatDownThreshold: number; // Rate drop threshold to trigger float-down

  @Column({ nullable: true })
  requestedBy: string; // Borrower/Applicant ID

  @Column({ nullable: true })
  approvedBy: string; // Loan Officer user ID

  @Column({ type: 'timestamp', nullable: true })
  approvedDate: Date;

  @Column({ type: 'text', nullable: true })
  approvalRemarks: string;

  @Column({ type: 'text', nullable: true })
  cancellationReason: string;

  @Column({ nullable: true })
  cancelledBy: string;

  @Column({ type: 'date', nullable: true })
  cancelledDate: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

