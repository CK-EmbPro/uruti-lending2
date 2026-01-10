import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { LoanApplication } from '../../loan-application/entities/loan-application.entity';

export enum ReviewStatus {
  PENDING = 'Pending',
  IN_PROGRESS = 'In Progress',
  COMPLETED = 'Completed',
  ESCALATED = 'Escalated',
}

export enum ReviewPriority {
  LOW = 'Low',
  MEDIUM = 'Medium',
  HIGH = 'High',
  URGENT = 'Urgent',
}

@Entity('underwriting_reviews')
@Index(['applicationId'])
@Index(['reviewerId'])
@Index(['status', 'priority'])
export class UnderwritingReview {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  applicationId: string;

  @ManyToOne(() => LoanApplication)
  @JoinColumn({ name: 'applicationId' })
  application: LoanApplication;

  @Column()
  reviewerId: string; // User ID of the underwriter

  @Column({
    type: 'enum',
    enum: ReviewStatus,
    default: ReviewStatus.PENDING,
  })
  status: ReviewStatus;

  @Column({
    type: 'enum',
    enum: ReviewPriority,
    default: ReviewPriority.MEDIUM,
  })
  priority: ReviewPriority;

  @Column({ type: 'text', nullable: true })
  financialAnalysis: string; // Analysis of financial documents

  @Column({ type: 'text', nullable: true })
  riskAssessment: string; // Risk factors identified

  @Column({ type: 'json', nullable: true })
  additionalInfoRequested: string[]; // List of additional info needed

  @Column({ type: 'text', nullable: true })
  decision: string; // Final decision

  @Column({ type: 'text', nullable: true })
  decisionRationale: string; // Detailed rationale

  @Column({ type: 'json', nullable: true })
  riskFactors: Record<string, any>; // Structured risk factors

  @Column({ type: 'json', nullable: true })
  recommendations: Record<string, any>; // Recommendations for approval/decline

  @Column({ nullable: true })
  escalatedTo: string; // User ID if escalated

  @Column({ type: 'text', nullable: true })
  escalationReason: string;

  @Column({ type: 'boolean', default: false })
  requiresPeerReview: boolean;

  @Column({ nullable: true })
  peerReviewerId: string;

  @Column({ type: 'timestamp', nullable: true })
  assignedDate: Date;

  @Column({ type: 'timestamp', nullable: true })
  completedDate: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

