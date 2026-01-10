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
import { DelinquencyRecord } from './delinquency-record.entity';

@Entity('late_fees')
@Index(['loanId'])
@Index(['assessedDate'])
export class LateFee {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Loan)
  loan: Loan;

  @Column()
  loanId: string;

  @ManyToOne(() => DelinquencyRecord, { nullable: true })
  delinquencyRecord: DelinquencyRecord;

  @Column({ nullable: true })
  delinquencyRecordId: string;

  @Column({ type: 'date' })
  assessedDate: Date;

  @Column('decimal', { precision: 15, scale: 2 })
  feeAmount: number;

  @Column({ type: 'int' })
  daysPastDue: number;

  @Column({ nullable: true })
  feeCalculationMethod: string; // Fixed, Percentage, Tiered

  @Column({ type: 'boolean', default: false })
  waived: boolean;

  @Column({ nullable: true })
  waiverReason: string;

  @Column({ nullable: true })
  waivedBy: string;

  @Column({ type: 'date', nullable: true })
  waivedDate: Date;

  @Column({ type: 'boolean', default: false })
  paid: boolean;

  @Column({ type: 'date', nullable: true })
  paidDate: Date;

  @Column({ nullable: true })
  remarks: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

