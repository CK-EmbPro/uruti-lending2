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

export enum AutopayStatus {
  ACTIVE = 'Active',
  SUSPENDED = 'Suspended',
  CANCELLED = 'Cancelled',
  FAILED = 'Failed',
}

export enum AutopayAmountType {
  FIXED_AMOUNT = 'Fixed Amount',
  MINIMUM_PAYMENT = 'Minimum Payment',
  FULL_BALANCE = 'Full Balance',
}

@Entity('autopay_enrollments')
@Index(['loanId'])
@Index(['status'])
export class AutopayEnrollment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Loan)
  loan: Loan;

  @Column()
  loanId: string;

  @Column({
    type: 'enum',
    enum: AutopayStatus,
    default: AutopayStatus.ACTIVE,
  })
  status: AutopayStatus;

  @Column({
    type: 'enum',
    enum: AutopayAmountType,
  })
  amountType: AutopayAmountType;

  @Column('decimal', { precision: 15, scale: 2, nullable: true })
  fixedAmount: number; // Used when amountType is FIXED_AMOUNT

  @Column()
  bankAccountNumber: string; // Last 4 digits for display

  @Column()
  bankRoutingNumber: string;

  @Column()
  bankAccountType: string; // Checking, Savings

  @Column()
  bankName: string;

  @Column()
  accountHolderName: string;

  @Column({ type: 'boolean', default: false })
  isVerified: boolean;

  @Column({ type: 'date', nullable: true })
  verifiedDate: Date;

  @Column({ type: 'date', nullable: true })
  nextPaymentDate: Date;

  @Column({ type: 'int', default: 0 })
  successfulPayments: number;

  @Column({ type: 'int', default: 0 })
  failedPayments: number;

  @Column({ type: 'text', nullable: true })
  lastFailureReason: string;

  @Column({ type: 'date', nullable: true })
  lastPaymentDate: Date;

  @Column({ type: 'text', nullable: true })
  cancellationReason: string;

  @Column({ type: 'date', nullable: true })
  cancelledDate: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

