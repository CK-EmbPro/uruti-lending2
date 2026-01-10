import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { Loan } from '../../loan/entities/loan.entity';
import { LoanRepaymentSchedule } from '../../loan/entities/loan-repayment-schedule.entity';
import { ReminderType, ReminderChannel } from '../dto/payment-reminder.dto';

@Entity('payment_reminders')
@Index(['loanId', 'reminderType'])
@Index(['repaymentScheduleId'])
@Index(['scheduledDate'])
@Index(['status'])
export class PaymentReminder {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  loanId: string;

  @ManyToOne(() => Loan)
  @JoinColumn({ name: 'loanId' })
  loan: Loan;

  @Column({ nullable: true })
  repaymentScheduleId: string;

  @ManyToOne(() => LoanRepaymentSchedule)
  @JoinColumn({ name: 'repaymentScheduleId' })
  repaymentSchedule: LoanRepaymentSchedule;

  @Column({
    type: 'enum',
    enum: ReminderType,
  })
  reminderType: ReminderType;

  @Column({
    type: 'enum',
    enum: ReminderChannel,
    array: true,
  })
  channels: ReminderChannel[];

  @Column({ type: 'timestamp' })
  scheduledDate: Date; // When reminder should be sent

  @Column({ type: 'timestamp', nullable: true })
  sentDate: Date; // When reminder was actually sent

  @Column({
    type: 'enum',
    enum: ['PENDING', 'SENT', 'FAILED', 'CANCELLED'],
    default: 'PENDING',
  })
  status: string;

  @Column({ type: 'text', nullable: true })
  message: string;

  @Column({ type: 'json', nullable: true })
  metadata: Record<string, any>; // Additional data like email sent, SMS sent, etc.

  @Column({ type: 'text', nullable: true })
  errorMessage: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

