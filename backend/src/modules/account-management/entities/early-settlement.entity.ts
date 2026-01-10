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

export enum EarlySettlementStatus {
  PENDING = 'PENDING',
  PROCESSED = 'PROCESSED',
  CANCELLED = 'CANCELLED',
}

@Entity('early_settlements')
@Index(['loanId'])
@Index(['status'])
@Index(['settlementDate'])
export class EarlySettlement {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Loan)
  loan: Loan;

  @Column()
  loanId: string;

  @Column()
  companyId: string;

  @Column({ type: 'date' })
  settlementDate: Date;

  @Column('decimal', { precision: 15, scale: 2 })
  principalBalance: number;

  @Column('decimal', { precision: 15, scale: 2 })
  accruedInterest: number;

  @Column('decimal', { precision: 15, scale: 2 })
  interestRebate: number; // Rebate amount based on time remaining

  @Column('decimal', { precision: 15, scale: 2 })
  totalPayoffAmount: number; // After rebate

  @Column('decimal', { precision: 15, scale: 2 })
  originalPayoffAmount: number; // Before rebate

  @Column('decimal', { precision: 15, scale: 2 })
  totalSavings: number; // Total savings including rebate

  @Column('int')
  monthsRemaining: number; // Months remaining in original term

  @Column('decimal', { precision: 5, scale: 2 })
  rebatePercentage: number; // Rebate percentage applied

  @Column({
    type: 'enum',
    enum: EarlySettlementStatus,
    default: EarlySettlementStatus.PENDING,
  })
  status: EarlySettlementStatus;

  @Column({ type: 'date', nullable: true })
  processedDate: Date;

  @Column({ nullable: true })
  processedBy: string;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

