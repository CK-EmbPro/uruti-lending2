import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { Loan } from '../../loan/entities/loan.entity';

export enum QuoteStatus {
  ACTIVE = 'Active',
  EXPIRED = 'Expired',
  PAID = 'Paid',
  CANCELLED = 'Cancelled',
}

@Entity('payoff_quotes')
@Index(['loanId'])
@Index(['status'])
@Index(['validUntil'])
export class PayoffQuote {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Loan)
  loan: Loan;

  @Column()
  loanId: string;

  @Column('decimal', { precision: 15, scale: 2 })
  principalBalance: number;

  @Column('decimal', { precision: 15, scale: 2 })
  accruedInterest: number;

  @Column('decimal', { precision: 15, scale: 2, default: 0 })
  prepaymentPenalty: number;

  @Column('decimal', { precision: 15, scale: 2, default: 0 })
  otherFees: number;

  @Column('decimal', { precision: 15, scale: 2 })
  totalPayoffAmount: number;

  @Column('decimal', { precision: 15, scale: 2, nullable: true })
  perDiemInterest: number; // Daily interest rate

  @Column({ type: 'date' })
  quoteDate: Date;

  @Column({ type: 'date' })
  validUntil: Date;

  @Column({
    type: 'enum',
    enum: QuoteStatus,
    default: QuoteStatus.ACTIVE,
  })
  status: QuoteStatus;

  @Column({ type: 'date', nullable: true })
  paidDate: Date;

  @Column({ nullable: true })
  paidBy: string;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @CreateDateColumn()
  createdAt: Date;
}














