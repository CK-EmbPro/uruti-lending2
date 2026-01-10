import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { Loan } from '../../loan/entities/loan.entity';
import { LoanRepaymentSchedule } from '../../loan/entities/loan-repayment-schedule.entity';

export enum DemandStatus {
  PENDING = 'Pending',
  SENT = 'Sent',
  PAID = 'Paid',
  OVERDUE = 'Overdue',
  CANCELLED = 'Cancelled',
}

@Entity('loan_demands')
@Index(['loanId'])
@Index(['scheduleId'])
@Index(['dueDate'])
@Index(['status'])
export class LoanDemand {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Loan)
  loan: Loan;

  @Column()
  loanId: string;

  @ManyToOne(() => LoanRepaymentSchedule)
  schedule: LoanRepaymentSchedule;

  @Column()
  scheduleId: string;

  @Column({ type: 'date' })
  dueDate: Date;

  @Column('decimal', { precision: 15, scale: 2 })
  principalAmount: number;

  @Column('decimal', { precision: 15, scale: 2 })
  interestAmount: number;

  @Column('decimal', { precision: 15, scale: 2 })
  penaltyAmount: number;

  @Column('decimal', { precision: 15, scale: 2 })
  totalAmount: number;

  @Column({
    type: 'enum',
    enum: DemandStatus,
    default: DemandStatus.PENDING,
  })
  status: DemandStatus;

  @Column({ type: 'date', nullable: true })
  sentDate: Date;

  @Column({ type: 'date', nullable: true })
  paidDate: Date;

  @CreateDateColumn()
  createdAt: Date;
}

