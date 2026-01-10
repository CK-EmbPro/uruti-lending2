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
import { Workflow } from './workflow.entity';
import { WorkflowTrigger } from './workflow-trigger.entity';

export enum ExecutionStatus {
  PENDING = 'PENDING',
  RUNNING = 'RUNNING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
}

@Entity('workflow_executions')
@Index(['workflowId', 'status'])
@Index(['triggerId'])
@Index(['startedAt'])
export class WorkflowExecution {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  workflowId: string;

  @ManyToOne(() => Workflow)
  @JoinColumn({ name: 'workflowId' })
  workflow: Workflow;

  @Column({ type: 'uuid', nullable: true })
  triggerId: string | null;

  @ManyToOne(() => WorkflowTrigger, { nullable: true })
  @JoinColumn({ name: 'triggerId' })
  trigger: WorkflowTrigger | null;

  @Column()
  documentType: string;

  @Column()
  documentId: string; // ID of the document that triggered the workflow

  @Column({ type: 'enum', enum: ExecutionStatus, default: ExecutionStatus.PENDING })
  status: ExecutionStatus;

  @Column({ type: 'varchar', length: 100, nullable: true })
  currentState: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  targetState: string | null;

  @Column({ type: 'json', nullable: true })
  inputData: Record<string, any>; // Input data for the workflow

  @Column({ type: 'json', nullable: true })
  outputData: Record<string, any>; // Output data from the workflow

  @Column({ type: 'text', nullable: true })
  errorMessage: string | null;

  @Column({ type: 'int', default: 0 })
  stepCount: number; // Number of steps executed

  @Column({ type: 'int', default: 0 })
  duration: number; // Duration in milliseconds

  @Column({ type: 'timestamp', nullable: true })
  startedAt: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  completedAt: Date | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  initiatedBy: string | null; // User ID who initiated (for manual triggers)

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

