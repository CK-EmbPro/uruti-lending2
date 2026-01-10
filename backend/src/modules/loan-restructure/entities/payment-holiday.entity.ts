import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  JoinColumn,
} from 'typeorm';
import { Loan } from '../../loan/entities/loan.entity';
import { LoanModification } from '../../account-management/entities/loan-modification.entity';

export enum PaymentHolidayStatus {
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

@Entity('payment_holidays')
@Index(['loanId'])
@Index(['startDate'])
@Index(['status'])
export class PaymentHoliday {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  loanId: string;

  @ManyToOne(() => Loan)
  @JoinColumn({ name: 'loanId' })
  loan: Loan;

  @Column({ nullable: true })
  modificationId: string; // Link to loan modification if created via modification request

  @ManyToOne(() => LoanModification, { nullable: true })
  @JoinColumn({ name: 'modificationId' })
  modification: LoanModification;

  @Column()
  companyId: string;

  @Column({ type: 'date' })
  startDate: Date;

  @Column({ type: 'date' })
  endDate: Date;

  @Column({ type: 'int' })
  durationMonths: number; // Duration of holiday in months

  @Column({
    type: 'enum',
    enum: PaymentHolidayStatus,
    default: PaymentHolidayStatus.ACTIVE,
  })
  status: PaymentHolidayStatus;

  @Column({ type: 'text', nullable: true })
  reason: string;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ nullable: true })
  approvedBy: string;

  @Column({ type: 'date', nullable: true })
  approvedDate: Date;

  @Column({ type: 'date', nullable: true })
  completedDate: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

