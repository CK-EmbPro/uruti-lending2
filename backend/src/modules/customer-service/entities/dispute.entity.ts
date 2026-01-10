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
import { DisputeStatus } from '../../../common/enums/dispute-status.enum';
import { DisputeType } from '../../../common/enums/dispute-type.enum';
import { DisputeResolution } from './dispute-resolution.entity';

@Entity('disputes')
@Index(['loanId'])
@Index(['disputeDate'])
@Index(['status'])
export class Dispute {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Loan)
  loan: Loan;

  @Column()
  loanId: string;

  @Column({ type: 'date' })
  disputeDate: Date;

  @Column({
    type: 'enum',
    enum: DisputeType,
  })
  disputeType: DisputeType;

  @Column({
    type: 'enum',
    enum: DisputeStatus,
    default: DisputeStatus.OPEN,
  })
  status: DisputeStatus;

  @Column({ type: 'text' })
  description: string;

  @Column('decimal', { precision: 15, scale: 2, nullable: true })
  disputedAmount: number;

  @Column({ nullable: true })
  disputedChargeId: string; // Reference to specific charge/fee

  @Column({ nullable: true })
  disputedChargeType: string; // Late Fee, Interest, Penalty, etc.

  @Column({ type: 'text', nullable: true })
  borrowerStatement: string;

  @Column({ type: 'text', nullable: true })
  supportingDocuments: string; // JSON array of document references

  @Column({ nullable: true })
  reportedBy: string; // Borrower name

  @Column({ nullable: true })
  reportedById: string; // Borrower ID

  @Column({ nullable: true })
  assignedTo: string; // CSR name

  @Column({ nullable: true })
  assignedToId: string; // CSR ID

  @Column({ type: 'date', nullable: true })
  investigationStartDate: Date;

  @Column({ type: 'date', nullable: true })
  resolutionDate: Date;

  @Column({ type: 'boolean', default: false })
  escalated: boolean;

  @Column({ nullable: true })
  escalatedTo: string;

  @Column({ type: 'date', nullable: true })
  escalatedDate: Date;

  @Column({ type: 'text', nullable: true })
  escalationReason: string;

  @OneToMany(() => DisputeResolution, (resolution) => resolution.dispute, {
    cascade: true,
    eager: false,
  })
  resolutions: DisputeResolution[];

  @Column({ nullable: true })
  remarks: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

