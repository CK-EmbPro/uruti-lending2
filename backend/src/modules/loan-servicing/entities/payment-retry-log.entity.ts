import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { PaymentRetryStrategy } from '../dto/loan-servicing.dto';
import { LoanRepayment } from '../../loan-repayment/entities/loan-repayment.entity';

export enum RetryStatus {
  PENDING = 'PENDING',
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
}

@Entity('payment_retry_logs')
@Index(['loanId'])
@Index(['repaymentId'])
@Index(['status'])
@Index(['retryDate'])
export class PaymentRetryLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  loanId: string;

  @Column({ nullable: true })
  repaymentId: string;

  @ManyToOne(() => LoanRepayment, { nullable: true })
  @JoinColumn({ name: 'repaymentId' })
  repayment: LoanRepayment;

  @Column({ type: 'int' })
  retryAttempt: number;

  @Column({
    type: 'enum',
    enum: PaymentRetryStrategy,
  })
  retryStrategy: PaymentRetryStrategy;

  @Column({
    type: 'enum',
    enum: RetryStatus,
    default: RetryStatus.PENDING,
  })
  status: RetryStatus;

  @Column({ type: 'timestamp' })
  retryDate: Date;

  @Column('decimal', { precision: 15, scale: 2 })
  amount: number;

  @Column({ type: 'text', nullable: true })
  errorMessage: string;

  @Column({ type: 'jsonb', nullable: true })
  retryConfig: Record<string, any>;

  @Column({ type: 'jsonb', nullable: true })
  result: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;
}

