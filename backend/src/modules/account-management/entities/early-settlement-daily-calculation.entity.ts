import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { Loan } from '../../loan/entities/loan.entity';

@Entity('early_settlement_daily_calculations')
@Index(['loanId', 'calculationDate'])
@Index(['loanId'])
export class EarlySettlementDailyCalculation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Loan)
  loan: Loan;

  @Column()
  loanId: string;

  @Column()
  companyId: string;

  @Column({ type: 'date' })
  calculationDate: Date; // Date for which payoff is calculated

  @Column('decimal', { precision: 15, scale: 2 })
  principalBalance: number;

  @Column('decimal', { precision: 15, scale: 2 })
  accruedInterest: number;

  @Column('decimal', { precision: 15, scale: 2 })
  interestRebate: number;

  @Column('decimal', { precision: 15, scale: 2 })
  totalPayoffAmount: number; // After rebate

  @Column('decimal', { precision: 15, scale: 2 })
  originalPayoffAmount: number; // Before rebate

  @Column('decimal', { precision: 15, scale: 2 })
  savingsAmount: number; // Savings vs. continuing with loan

  @Column('int')
  monthsRemaining: number;

  @Column('decimal', { precision: 5, scale: 2 })
  rebatePercentage: number;

  @Column('decimal', { precision: 15, scale: 2 })
  dailyChange: number; // Change from previous day

  @CreateDateColumn()
  createdAt: Date;
}

