import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  Index,
  JoinColumn,
} from 'typeorm';
import { Loan } from './loan.entity';
import { LoanRestructure } from '../../loan-restructure/entities/loan-restructure.entity';

export enum ScheduleEntryStatus {
  PENDING = 'Pending',
  PARTIALLY_PAID = 'Partially Paid',
  COMPLETED = 'Completed',
  INITIATED = 'Initiated',
}

@Entity('loan_repayment_schedules')
@Index(['loanId'])
@Index(['paymentDate'])
export class LoanRepaymentSchedule {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Loan, (loan) => loan.repaymentSchedule)
  loan: Loan;

  @Column()
  loanId: string;

  @Column({ type: 'int' })
  installmentNumber: number;

  @Column({ type: 'date' })
  paymentDate: Date;

  @Column('decimal', { precision: 15, scale: 2 })
  principalAmount: number;

  @Column('decimal', { precision: 15, scale: 2 })
  interestAmount: number;

  @Column('decimal', { precision: 15, scale: 2 })
  totalPayment: number;

  @Column('decimal', { precision: 15, scale: 2 })
  balanceLoanAmount: number;

  @Column({ type: 'int' })
  days: number;

  @Column({ type: 'boolean', default: false })
  demandGenerated: boolean;

  @Column({
    type: 'enum',
    enum: ScheduleEntryStatus,
    default: ScheduleEntryStatus.PENDING,
  })
  status: ScheduleEntryStatus;

  @Column({ type: 'date', nullable: true })
  moratoriumEndDate: Date;

  // Broken Period Interest (BPI)
  @Column('decimal', { precision: 15, scale: 2, default: 0 })
  brokenPeriodInterest: number; // BPI amount for this schedule entry

  @Column({ type: 'int', nullable: true })
  brokenPeriodDays: number; // Number of broken period days // Moratorium end date for this schedule entry

  // Schedule versioning for restructure history
  @Column({ type: 'int', default: 1 })
  version: number; // Schedule version number (incremented on each restructure)

  @Column({ nullable: true })
  restructureId: string; // Foreign key to loan_restructures table

  @ManyToOne(() => LoanRestructure, { nullable: true })
  @JoinColumn({ name: 'restructureId' })
  restructure: LoanRestructure; // Link to restructure that created this schedule version

  @CreateDateColumn()
  createdAt: Date;
}

