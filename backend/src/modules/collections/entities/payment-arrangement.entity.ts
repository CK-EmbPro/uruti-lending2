import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { Loan } from '../../loan/entities/loan.entity';
import { PaymentArrangementStatus } from '../../../common/enums/payment-arrangement-status.enum';
import { CollectionActivity } from './collection-activity.entity';
import { ArrangementCompliance } from './arrangement-compliance.entity';

@Entity('payment_arrangements')
@Index(['loanId'])
@Index(['startDate'])
@Index(['status'])
export class PaymentArrangement {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Loan)
  loan: Loan;

  @Column()
  loanId: string;

  @ManyToOne(() => CollectionActivity, { nullable: true })
  collectionActivity: CollectionActivity;

  @Column({ nullable: true })
  collectionActivityId: string;

  @Column({ type: 'date' })
  startDate: Date;

  @Column({ type: 'date', nullable: true })
  endDate: Date;

  @Column({
    type: 'enum',
    enum: PaymentArrangementStatus,
    default: PaymentArrangementStatus.PENDING,
  })
  status: PaymentArrangementStatus;

  @Column('decimal', { precision: 15, scale: 2 })
  totalAmount: number;

  @Column('decimal', { precision: 15, scale: 2, default: 0 })
  paidAmount: number;

  @Column({ type: 'int' })
  numberOfPayments: number;

  @Column({ type: 'int', default: 0 })
  paymentsMade: number;

  @Column('decimal', { precision: 15, scale: 2 })
  paymentAmount: number; // Amount per payment

  @Column({ nullable: true })
  paymentFrequency: string; // Weekly, Bi-weekly, Monthly

  @Column({ type: 'int', nullable: true })
  paymentDay: number; // Day of month for monthly payments

  @Column({ type: 'boolean', default: false })
  shortTerm: boolean; // Less than 6 months

  @Column({ type: 'boolean', default: false })
  longTerm: boolean; // 6+ months

  @Column({ type: 'text', nullable: true })
  terms: string;

  @Column({ type: 'text', nullable: true })
  conditions: string;

  @Column({ type: 'boolean', default: false })
  approved: boolean;

  @Column({ nullable: true })
  approvedBy: string;

  @Column({ nullable: true })
  approvedById: string;

  @Column({ type: 'date', nullable: true })
  approvedDate: Date;

  @Column({ type: 'int', default: 0 })
  missedPayments: number;

  @Column({ type: 'int', default: 0 })
  latePayments: number;

  @Column({ type: 'date', nullable: true })
  lastPaymentDate: Date;

  @Column({ type: 'date', nullable: true })
  nextPaymentDate: Date;

  @OneToMany(() => ArrangementCompliance, (compliance) => compliance.arrangement, {
    cascade: true,
    eager: false,
  })
  complianceRecords: ArrangementCompliance[];

  @Column({ nullable: true })
  createdBy: string;

  @Column({ nullable: true })
  createdById: string;

  @Column({ nullable: true })
  remarks: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

