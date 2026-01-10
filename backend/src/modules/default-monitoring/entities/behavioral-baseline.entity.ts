import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('behavioral_baselines')
@Index(['loanId'])
export class BehavioralBaseline {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  loanId: string;

  @Column({ type: 'int' })
  baselineCycles: number; // Number of cycles used for baseline (typically 3)

  @Column({ type: 'decimal', precision: 5, scale: 2 })
  averageRepaymentDay: number; // Average day of month for repayment

  @Column({ type: 'decimal', precision: 5, scale: 2 })
  autoDebitRate: number; // Percentage of payments via auto-debit

  @Column({ type: 'decimal', precision: 5, scale: 2 })
  averagePaymentAmount: number;

  @Column({ type: 'decimal', precision: 5, scale: 2 })
  averageAppEngagement: number; // Average app usage per month

  @Column({ type: 'int' })
  totalPayments: number; // Total payments in baseline period

  @Column({ type: 'int' })
  onTimePayments: number; // On-time payments in baseline

  @Column({ type: 'date' })
  baselineStartDate: Date;

  @Column({ type: 'date' })
  baselineEndDate: Date;

  @Column({ type: 'boolean', default: false })
  baselineEstablished: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

