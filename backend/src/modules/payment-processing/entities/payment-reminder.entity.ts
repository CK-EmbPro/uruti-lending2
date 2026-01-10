import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { Loan } from '../../loan/entities/loan.entity';

export enum ReminderStatus {
  PENDING = 'Pending',
  SENT = 'Sent',
  ACKNOWLEDGED = 'Acknowledged',
  FAILED = 'Failed',
}

export enum ReminderChannel {
  EMAIL = 'Email',
  SMS = 'SMS',
  PUSH = 'Push Notification',
  IN_APP = 'In-App',
}

@Entity('payment_reminders')
@Index(['loanId'])
@Index(['dueDate'])
@Index(['status'])
export class PaymentReminder {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Loan)
  loan: Loan;

  @Column()
  loanId: string;

  @Column({ type: 'date' })
  dueDate: Date;

  @Column('decimal', { precision: 15, scale: 2 })
  amountDue: number;

  @Column({
    type: 'enum',
    enum: ReminderChannel,
    default: ReminderChannel.EMAIL,
  })
  channel: ReminderChannel;

  @Column({
    type: 'enum',
    enum: ReminderStatus,
    default: ReminderStatus.PENDING,
  })
  status: ReminderStatus;

  @Column({ type: 'int' })
  daysBeforeDue: number; // Days before due date (e.g., 3, 1, 0)

  @Column({ type: 'timestamp', nullable: true })
  sentAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  acknowledgedAt: Date;

  @Column({ type: 'text', nullable: true })
  recipientEmail: string;

  @Column({ type: 'text', nullable: true })
  recipientPhone: string;

  @Column({ type: 'text', nullable: true })
  failureReason: string;

  @CreateDateColumn()
  createdAt: Date;
}

