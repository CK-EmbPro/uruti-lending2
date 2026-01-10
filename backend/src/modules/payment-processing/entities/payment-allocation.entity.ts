import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { LoanRepayment } from '../../loan-repayment/entities/loan-repayment.entity';

export enum AllocationPreference {
  PRINCIPAL_FIRST = 'Principal First',
  INTEREST_FIRST = 'Interest First',
  PROPORTIONAL = 'Proportional',
  PRINCIPAL_ONLY = 'Principal Only',
}

@Entity('payment_allocations')
@Index(['repaymentId'])
export class PaymentAllocation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => LoanRepayment)
  repayment: LoanRepayment;

  @Column()
  repaymentId: string;

  @Column({
    type: 'enum',
    enum: AllocationPreference,
    default: AllocationPreference.PROPORTIONAL,
  })
  allocationPreference: AllocationPreference;

  @Column('decimal', { precision: 15, scale: 2 })
  totalAmount: number;

  @Column('decimal', { precision: 15, scale: 2 })
  principalAllocated: number;

  @Column('decimal', { precision: 15, scale: 2 })
  interestAllocated: number;

  @Column('decimal', { precision: 15, scale: 2, default: 0 })
  penaltyAllocated: number;

  @Column('decimal', { precision: 15, scale: 2, default: 0 })
  chargesAllocated: number;

  @Column('decimal', { precision: 15, scale: 2, default: 0 })
  excessAmount: number;

  @Column({ type: 'boolean', default: false })
  isEarlyPayment: boolean;

  @Column({ type: 'boolean', default: false })
  isExtraPayment: boolean;

  @Column('decimal', { precision: 15, scale: 2, default: 0 })
  prepaymentPenalty: number;

  @Column({ type: 'text', nullable: true })
  remarks: string;

  @CreateDateColumn()
  createdAt: Date;
}

