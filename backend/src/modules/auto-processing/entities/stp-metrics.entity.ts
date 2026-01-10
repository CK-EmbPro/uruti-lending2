import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { ProcessingType, CustomerSegment, ManualTrigger } from '../dto/stp-tracking.dto';

@Entity('stp_metrics')
@Index(['entityId', 'processingType'])
@Index(['segment', 'createdAt'])
@Index(['createdAt'])
export class STPMetric {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  entityId: string; // Application ID or Loan ID

  @Column({
    type: 'enum',
    enum: ProcessingType,
  })
  processingType: ProcessingType;

  @Column({
    type: 'enum',
    enum: CustomerSegment,
    nullable: true,
  })
  segment: CustomerSegment | null;

  @Column({ type: 'boolean', default: false })
  autoProcessed: boolean;

  @Column({ type: 'jsonb', nullable: true })
  manualTriggers: ManualTrigger[];

  @Column({ type: 'timestamp' })
  processedAt: Date;

  @Column({ type: 'bigint', nullable: true })
  processingTimeMs: number;

  @CreateDateColumn()
  createdAt: Date;
}

@Entity('manual_review_queue')
@Index(['priority', 'createdAt'])
@Index(['assignedTo', 'createdAt'])
@Index(['processingType'])
export class ManualReviewQueueItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  entityId: string;

  @Column({
    type: 'enum',
    enum: ProcessingType,
  })
  processingType: ProcessingType;

  @Column({ type: 'jsonb' })
  triggers: ManualTrigger[];

  @Column({ type: 'varchar', length: 20 })
  priority: string; // URGENT, HIGH, MEDIUM, LOW

  @Column({ type: 'int' })
  priorityScore: number;

  @Column({ nullable: true })
  assignedTo: string;

  @Column({ type: 'timestamp', nullable: true })
  reviewStartedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  reviewCompletedAt: Date;

  @Column({ type: 'boolean', default: false })
  escalated: boolean;

  @Column({ type: 'timestamp', nullable: true })
  escalatedAt: Date;

  @CreateDateColumn()
  createdAt: Date;
}

