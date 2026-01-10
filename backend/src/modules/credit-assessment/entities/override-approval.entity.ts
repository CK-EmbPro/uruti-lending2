import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { CreditDecision } from './credit-decision.entity';

export enum OverrideApprovalStatus {
  PENDING_FIRST = 'PENDING_FIRST',
  PENDING_SECOND = 'PENDING_SECOND',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  CANCELLED = 'CANCELLED',
}

@Entity('override_approvals')
@Index(['overrideDecisionId'])
@Index(['status'])
@Index(['firstApproverId'])
@Index(['secondApproverId'])
@Index(['createdAt'])
export class OverrideApproval {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  overrideDecisionId: string;

  @ManyToOne(() => CreditDecision)
  @JoinColumn({ name: 'overrideDecisionId' })
  overrideDecision: CreditDecision;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  overrideAmount: number; // Amount being overridden

  @Column({
    type: 'enum',
    enum: OverrideApprovalStatus,
    default: OverrideApprovalStatus.PENDING_FIRST,
  })
  status: OverrideApprovalStatus;

  // First Approver
  @Column()
  firstApproverId: string; // User ID of first approver

  @Column({ nullable: true })
  firstApproverName: string;

  @Column({ nullable: true })
  firstApproverRole: string;

  @Column({ type: 'timestamp', nullable: true })
  firstApprovedAt: Date;

  @Column({ type: 'text', nullable: true })
  firstApproverComment: string;

  // Second Approver
  @Column({ nullable: true })
  secondApproverId: string; // User ID of second approver (required for large amounts)

  @Column({ nullable: true })
  secondApproverName: string;

  @Column({ nullable: true })
  secondApproverRole: string;

  @Column({ type: 'timestamp', nullable: true })
  secondApprovedAt: Date;

  @Column({ type: 'text', nullable: true })
  secondApproverComment: string;

  // Rejection
  @Column({ nullable: true })
  rejectedBy: string; // User ID who rejected

  @Column({ type: 'timestamp', nullable: true })
  rejectedAt: Date;

  @Column({ type: 'text', nullable: true })
  rejectionReason: string;

  // Configuration
  @Column({ type: 'decimal', precision: 15, scale: 2 })
  dualApprovalThreshold: number; // Amount threshold requiring dual approval

  @Column({ type: 'boolean', default: false })
  requiresDualApproval: boolean; // Whether this override requires dual approval

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

