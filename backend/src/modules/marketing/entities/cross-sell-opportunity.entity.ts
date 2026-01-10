import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { OpportunityStatus } from '../../../common/enums/opportunity-status.enum';

@Entity('cross_sell_opportunities')
@Index(['customerId'])
@Index(['status'])
@Index(['opportunityType'])
@Index(['identifiedAt'])
export class CrossSellOpportunity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  customerId: string;

  @Column()
  opportunityType: string; // e.g., 'Additional Loan', 'Credit Card', 'Insurance', 'Investment Product'

  @Column({
    type: 'enum',
    enum: OpportunityStatus,
    default: OpportunityStatus.IDENTIFIED,
  })
  status: OpportunityStatus;

  // Opportunity details
  @Column({ type: 'jsonb' })
  opportunityDetails: Record<string, any>; // Product details, recommended amount, etc.

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  confidenceScore: number; // 0-100 confidence in the opportunity

  // Behavior analysis data
  @Column({ type: 'jsonb', nullable: true })
  behaviorData: Record<string, any>; // Customer behavior patterns that led to this opportunity

  @Column({ type: 'text', nullable: true })
  analysisNotes: string;

  // Assignment
  @Column({ nullable: true })
  assignedTo: string; // Relationship Manager User ID

  @Column({ nullable: true })
  assignedToName: string;

  @Column({ type: 'timestamp', nullable: true })
  assignedAt: Date;

  // Contact tracking
  @Column({ type: 'timestamp', nullable: true })
  contactedAt: Date;

  @Column({ type: 'text', nullable: true })
  contactMethod: string; // 'phone', 'email', 'in-person', etc.

  @Column({ type: 'text', nullable: true })
  contactNotes: string;

  // Offer tracking
  @Column({ type: 'timestamp', nullable: true })
  offerPresentedAt: Date;

  @Column({ type: 'jsonb', nullable: true })
  offerDetails: Record<string, any>;

  // Outcome
  @Column({ type: 'timestamp', nullable: true })
  acceptedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  declinedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  convertedAt: Date;

  @Column({ type: 'text', nullable: true })
  declineReason: string;

  @Column({ nullable: true })
  convertedApplicationId: string;

  // Identification
  @Column({ type: 'timestamp' })
  identifiedAt: Date;

  @Column()
  identifiedBy: string; // 'System' or User ID

  @Column({ type: 'text', nullable: true })
  identificationReason: string;

  @Column({ type: 'text', nullable: true })
  remarks: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}














