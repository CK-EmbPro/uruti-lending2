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
import { CollectionActivity } from './collection-activity.entity';

@Entity('promise_to_pay')
@Index(['loanId'])
@Index(['promiseDate'])
export class PromiseToPay {
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
  promiseDate: Date;

  @Column('decimal', { precision: 15, scale: 2 })
  promisedAmount: number;

  @Column({ type: 'date' })
  dueDate: Date;

  @Column({ type: 'boolean', default: false })
  fulfilled: boolean;

  @Column({ type: 'date', nullable: true })
  fulfilledDate: Date;

  @Column('decimal', { precision: 15, scale: 2, default: 0 })
  paidAmount: number;

  @Column({ type: 'boolean', default: false })
  defaulted: boolean;

  @Column({ type: 'date', nullable: true })
  defaultedDate: Date;

  @Column({ nullable: true })
  promisedBy: string; // Borrower name

  @Column({ nullable: true })
  contactPhone: string;

  @Column({ nullable: true })
  contactEmail: string;

  @Column({ type: 'text', nullable: true })
  notes: string;

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

