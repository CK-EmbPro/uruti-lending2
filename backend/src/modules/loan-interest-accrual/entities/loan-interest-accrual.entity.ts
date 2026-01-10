import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { Loan } from '../../loan/entities/loan.entity';

@Entity('loan_interest_accruals')
@Index(['loanId'])
@Index(['postingDate'])
export class LoanInterestAccrual {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Loan)
  loan: Loan;

  @Column()
  loanId: string;

  @Column({ type: 'date' })
  postingDate: Date;

  @Column('decimal', { precision: 15, scale: 2 })
  principalAmount: number;

  @Column('decimal', { precision: 5, scale: 2 })
  rateOfInterest: number;

  @Column('decimal', { precision: 15, scale: 2 })
  interestAmount: number;

  @Column({ type: 'int' })
  days: number;

  @Column({ nullable: true })
  dayCountConvention: string;

  @CreateDateColumn()
  createdAt: Date;
}

