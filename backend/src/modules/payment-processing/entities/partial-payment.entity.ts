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

export enum PartialPaymentStatus {
  IN_SUSPENSE = 'In Suspense',
  APPLIED = 'Applied',
  REFUNDED = 'Refunded',
}

@Entity('partial_payments')
@Index(['loanId'])
@Index(['status'])
export class PartialPayment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Loan)
  loan: Loan;

  @Column()
  loanId: string;

  @Column('decimal', { precision: 15, scale: 2 })
  amount: number;

  @Column({
    type: 'enum',
    enum: PartialPaymentStatus,
    default: PartialPaymentStatus.IN_SUSPENSE,
  })
  status: PartialPaymentStatus;

  @Column({ type: 'date' })
  paymentDate: Date;

  @Column('decimal', { precision: 15, scale: 2 })
  requiredAmount: number; // Full amount that was due

  @Column('decimal', { precision: 15, scale: 2, default: 0 })
  accumulatedAmount: number; // Total accumulated in suspense

  @Column({ type: 'date', nullable: true })
  appliedDate: Date; // Date when accumulated amount was applied

  @Column({ nullable: true })
  modeOfPayment: string;

  @Column({ nullable: true })
  referenceNumber: string;

  @Column({ type: 'boolean', default: false })
  lateFeeAssessed: boolean;

  @Column('decimal', { precision: 15, scale: 2, default: 0 })
  lateFeeAmount: number;

  @Column({ type: 'text', nullable: true })
  remarks: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

