import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { DecisionStep, DecisionStatus, StepStatus } from '../dto/fast-decision.dto';

@Entity('decision_progress')
@Index(['applicationId'])
@Index(['status'])
@Index(['createdAt'])
export class DecisionProgress {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  applicationId: string;

  @Column({ type: 'enum', enum: DecisionStep, default: DecisionStep.DOCUMENT_VERIFICATION })
  currentStep: DecisionStep;

  @Column({ type: 'enum', enum: DecisionStatus, default: DecisionStatus.IN_PROGRESS })
  status: DecisionStatus;

  @Column({ type: 'int', default: 0 })
  progressPercentage: number;

  @Column({ type: 'bigint', default: 0 })
  elapsedTime: number; // milliseconds

  @Column({ type: 'bigint', default: 0 })
  estimatedTimeRemaining: number; // milliseconds

  @Column({ type: 'jsonb', nullable: true })
  steps: Record<string, any>; // Step details

  @Column({ type: 'boolean', default: true })
  slaCompliant: boolean;

  @Column({ type: 'jsonb', default: [] })
  slaViolations: string[];

  @Column({ type: 'bigint', default: 600000 })
  totalSlaTarget: number; // 10 minutes in milliseconds

  @Column({ type: 'timestamp', nullable: true })
  startedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  completedAt?: Date;

  @Column({ type: 'jsonb', nullable: true })
  result?: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

