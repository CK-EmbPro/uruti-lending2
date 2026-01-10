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
import { Currency } from './currency.entity';
import { Loan } from '../../loan/entities/loan.entity';

export enum FXTransactionType {
  LOAN_DISBURSEMENT = 'LOAN_DISBURSEMENT',
  LOAN_REPAYMENT = 'LOAN_REPAYMENT',
  CURRENCY_CONVERSION = 'CURRENCY_CONVERSION',
  HEDGE = 'HEDGE',
  ADJUSTMENT = 'ADJUSTMENT',
}

export enum FXTransactionStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  FAILED = 'FAILED',
}

@Entity('fx_transactions')
@Index(['loanId', 'transactionType'])
@Index(['transactionDate', 'status'])
export class FXTransaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', nullable: true })
  loanId: string | null;

  @ManyToOne(() => Loan, { nullable: true })
  @JoinColumn({ name: 'loanId' })
  loan: Loan | null;

  @Column({ type: 'enum', enum: FXTransactionType })
  transactionType: FXTransactionType;

  @Column({ type: 'enum', enum: FXTransactionStatus, default: FXTransactionStatus.PENDING })
  status: FXTransactionStatus;

  @Column({ type: 'uuid' })
  fromCurrencyId: string;

  @ManyToOne(() => Currency)
  @JoinColumn({ name: 'fromCurrencyId' })
  fromCurrency: Currency;

  @Column({ type: 'uuid' })
  toCurrencyId: string;

  @ManyToOne(() => Currency)
  @JoinColumn({ name: 'toCurrencyId' })
  toCurrency: Currency;

  @Column({ type: 'decimal', precision: 18, scale: 2 })
  fromAmount: number; // Amount in from currency

  @Column({ type: 'decimal', precision: 18, scale: 6 })
  exchangeRate: number; // Exchange rate used

  @Column({ type: 'decimal', precision: 18, scale: 2 })
  toAmount: number; // Amount in to currency

  @Column({ type: 'decimal', precision: 18, scale: 2, nullable: true })
  fxGainLoss: number | null; // FX gain/loss if applicable

  @Column({ type: 'date' })
  transactionDate: Date;

  @Column({ type: 'date', nullable: true })
  valueDate: Date | null; // Value date for settlement

  @Column({ type: 'text', nullable: true })
  reference: string | null; // External reference

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @Column({ type: 'json', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

