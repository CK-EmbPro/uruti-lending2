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
import { CustomerPortalUser } from './customer-portal-user.entity';

export enum ScheduledPaymentStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
}

export enum PaymentAmountType {
  MINIMUM = 'MINIMUM',
  FULL_BALANCE = 'FULL_BALANCE',
  CUSTOM = 'CUSTOM',
  NEXT_INSTALLMENT = 'NEXT_INSTALLMENT',
}

export enum PaymentMethod {
  BANK_ACCOUNT = 'BANK_ACCOUNT',
  DEBIT_CARD = 'DEBIT_CARD',
  CREDIT_CARD = 'CREDIT_CARD',
}

@Entity('scheduled_payments')
@Index(['loanId', 'scheduledDate'])
@Index(['customerId', 'status'])
export class ScheduledPayment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  loanId: string;

  @ManyToOne(() => Loan)
  @JoinColumn({ name: 'loanId' })
  loan: Loan;

  @Column({ type: 'uuid' })
  customerId: string;

  @ManyToOne(() => CustomerPortalUser)
  @JoinColumn({ name: 'customerId' })
  customer: CustomerPortalUser;

  @Column({ type: 'enum', enum: PaymentAmountType })
  amountType: PaymentAmountType;

  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
  customAmount: number | null;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  calculatedAmount: number;

  @Column({ type: 'date' })
  scheduledDate: Date;

  @Column({ type: 'enum', enum: PaymentMethod })
  paymentMethod: PaymentMethod;

  @Column({ type: 'varchar', length: 255, nullable: true })
  paymentMethodId: string | null;

  @Column({ type: 'varchar', length: 4, nullable: true })
  bankAccountLast4: string | null;

  @Column({ type: 'varchar', length: 9, nullable: true })
  bankRoutingNumber: string | null;

  @Column({ type: 'varchar', length: 4, nullable: true })
  cardLast4: string | null;

  @Column({ type: 'enum', enum: ScheduledPaymentStatus, default: ScheduledPaymentStatus.PENDING })
  status: ScheduledPaymentStatus;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @Column({ type: 'text', nullable: true })
  failureReason: string | null;

  @Column({ type: 'uuid', nullable: true })
  repaymentId: string | null;

  @Column({ type: 'timestamp', nullable: true })
  processedAt: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  cancelledAt: Date | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  cancellationReason: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

