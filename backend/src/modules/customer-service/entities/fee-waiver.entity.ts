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
import { WaiverStatus } from '../../../common/enums/waiver-status.enum';
import { WaiverType } from '../../../common/enums/waiver-type.enum';

@Entity('fee_waivers')
@Index(['loanId'])
@Index(['requestDate'])
@Index(['status'])
export class FeeWaiver {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Loan)
  loan: Loan;

  @Column()
  loanId: string;

  @Column({ type: 'date' })
  requestDate: Date;

  @Column({
    type: 'enum',
    enum: WaiverStatus,
    default: WaiverStatus.PENDING,
  })
  status: WaiverStatus;

  @Column({
    type: 'enum',
    enum: WaiverType,
  })
  waiverType: WaiverType;

  @Column({ nullable: true })
  feeType: string; // Late Fee, Penalty, Interest, Processing Fee, etc.

  @Column('decimal', { precision: 15, scale: 2 })
  feeAmount: number;

  @Column({ nullable: true })
  feeReferenceId: string; // Reference to specific fee record

  @Column({ type: 'text', nullable: true })
  requestReason: string;

  @Column({ type: 'text', nullable: true })
  accountHistory: string; // JSON or text summary of account history

  @Column({ type: 'boolean', default: false })
  approved: boolean;

  @Column({ nullable: true })
  approvedBy: string;

  @Column({ nullable: true })
  approvedById: string;

  @Column({ type: 'date', nullable: true })
  approvedDate: Date;

  @Column({ type: 'text', nullable: true })
  approvalRemarks: string;

  @Column({ type: 'text', nullable: true })
  denialReason: string;

  @Column({ type: 'boolean', default: false })
  processed: boolean;

  @Column({ type: 'date', nullable: true })
  processedDate: Date;

  @Column({ nullable: true })
  adjustmentReferenceId: string; // Reference to loan adjustment created

  @Column({ nullable: true })
  requestedBy: string;

  @Column({ nullable: true })
  requestedById: string;

  @Column({ nullable: true })
  processedBy: string;

  @Column({ nullable: true })
  processedById: string;

  @Column({ nullable: true })
  remarks: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

