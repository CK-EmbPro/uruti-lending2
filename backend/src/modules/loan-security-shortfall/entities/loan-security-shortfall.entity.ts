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

export enum LoanSecurityShortfallStatus {
  PENDING = 'Pending',
  RESOLVED = 'Resolved',
}

@Entity('loan_security_shortfalls')
@Index(['loanId'])
@Index(['status'])
export class LoanSecurityShortfall {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Loan)
  loan: Loan;

  @Column()
  loanId: string;

  @Column({
    type: 'enum',
    enum: LoanSecurityShortfallStatus,
    default: LoanSecurityShortfallStatus.PENDING,
  })
  status: LoanSecurityShortfallStatus;

  @Column('decimal', { precision: 15, scale: 2 })
  shortfallAmount: number; // Amount of shortfall

  @Column('decimal', { precision: 5, scale: 2 })
  shortfallRatio: number; // Shortfall ratio percentage

  @Column('decimal', { precision: 15, scale: 2 })
  securityValue: number; // Current security value

  @Column('decimal', { precision: 15, scale: 2 })
  outstandingAmount: number; // Outstanding loan amount

  @Column({ type: 'timestamp', nullable: true })
  shortfallTime: Date; // When shortfall was detected

  @Column({ nullable: true })
  processLoanSecurityShortfall: string; // Reference to process document

  @Column({ type: 'date', nullable: true })
  resolvedDate: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

