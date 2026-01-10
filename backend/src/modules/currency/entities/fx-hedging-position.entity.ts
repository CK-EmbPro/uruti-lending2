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
import { Loan } from '../../loan/entities/loan.entity';

export enum HedgingStrategy {
  FORWARD_CONTRACT = 'FORWARD_CONTRACT',
  OPTIONS = 'OPTIONS',
  NATURAL_HEDGE = 'NATURAL_HEDGE',
  NO_HEDGE = 'NO_HEDGE',
}

export enum HedgingStatus {
  ACTIVE = 'ACTIVE',
  MATURED = 'MATURED',
  CANCELLED = 'CANCELLED',
  EXECUTED = 'EXECUTED',
}

@Entity('fx_hedging_positions')
@Index(['loanId'])
@Index(['status', 'maturityDate'])
export class FXHedgingPosition {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  loanId: string;

  @ManyToOne(() => Loan)
  @JoinColumn({ name: 'loanId' })
  loan: Loan;

  @Column({ type: 'enum', enum: HedgingStrategy })
  strategy: HedgingStrategy;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  hedgeAmount: number; // Amount being hedged

  @Column({ length: 3 })
  hedgeCurrency: string; // Currency being hedged

  @Column({ length: 3 })
  loanCurrency: string; // Loan currency

  @Column({ length: 3 })
  baseCurrency: string; // Base currency (usually USD)

  @Column({ type: 'decimal', precision: 18, scale: 6 })
  currentRate: number; // Current exchange rate

  @Column({ type: 'decimal', precision: 18, scale: 6 })
  targetRate: number; // Target/hedged exchange rate

  @Column({ type: 'date' })
  maturityDate: Date; // When hedging position matures

  @Column({ type: 'enum', enum: HedgingStatus, default: HedgingStatus.ACTIVE })
  status: HedgingStatus;

  @Column({ type: 'decimal', precision: 18, scale: 6, nullable: true })
  executedRate: number | null; // Rate at which position was executed

  @Column({ type: 'timestamp', nullable: true })
  executedAt: Date | null; // When position was executed

  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
  unrealizedPnL: number | null; // Unrealized profit/loss

  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
  realizedPnL: number | null; // Realized profit/loss

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @Column({ type: 'json', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

