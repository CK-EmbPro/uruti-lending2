import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { Dispute } from './dispute.entity';

@Entity('dispute_resolutions')
@Index(['disputeId'])
@Index(['resolutionDate'])
export class DisputeResolution {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Dispute, (dispute) => dispute.resolutions)
  dispute: Dispute;

  @Column()
  disputeId: string;

  @Column({ type: 'date' })
  resolutionDate: Date;

  @Column({ nullable: true })
  resolutionType: string; // Resolved in Favor of Borrower, Resolved in Favor of Lender, Partial Resolution

  @Column({ type: 'text' })
  resolutionDetails: string;

  @Column('decimal', { precision: 15, scale: 2, default: 0 })
  adjustmentAmount: number; // Positive = credit to borrower, Negative = debit

  @Column({ type: 'boolean', default: false })
  accountUpdated: boolean;

  @Column({ type: 'date', nullable: true })
  accountUpdatedDate: Date;

  @Column({ nullable: true })
  resolvedBy: string;

  @Column({ nullable: true })
  resolvedById: string;

  @Column({ type: 'boolean', default: false })
  borrowerNotified: boolean;

  @Column({ type: 'date', nullable: true })
  borrowerNotifiedDate: Date;

  @Column({ type: 'text', nullable: true })
  notificationMethod: string; // Email, Phone, Letter

  @Column({ nullable: true })
  remarks: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

