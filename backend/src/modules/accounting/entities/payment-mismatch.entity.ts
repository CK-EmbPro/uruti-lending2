import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { MismatchType } from '../dto/reconciliation.dto';

@Entity('payment_mismatches')
@Index(['referenceNumber'])
@Index(['mismatchType'])
@Index(['autoAllocated'])
@Index(['resolvedAt'])
export class PaymentMismatch {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: '50' })
  mismatchType: MismatchType;

  @Column()
  referenceNumber: string;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  paymentAmount: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
  expectedAmount?: number;

  @Column({ nullable: true })
  customerId?: string;

  @Column({ nullable: true })
  loanId?: string;

  @Column({ type: 'text', nullable: true })
  suggestedResolution?: string;

  @Column({ type: 'boolean', default: false })
  autoAllocated: boolean;

  @Column({ type: 'timestamp', nullable: true })
  resolvedAt?: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

