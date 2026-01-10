import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { WorkflowExecutionStatus } from '../dto/workflow-engine-enhanced.dto';

@Entity('workflow_executions_enhanced')
@Index(['workflowId'])
@Index(['status'])
@Index(['startedAt'])
export class WorkflowExecutionEnhanced {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  workflowId: string;

  @Column()
  workflowName: string;

  @Column({
    type: 'enum',
    enum: WorkflowExecutionStatus,
    default: WorkflowExecutionStatus.PENDING,
  })
  status: WorkflowExecutionStatus;

  @Column({ type: 'jsonb' })
  inputData: Record<string, any>;

  @Column({ type: 'jsonb', nullable: true })
  outputData: Record<string, any>;

  @Column({ type: 'jsonb', nullable: true })
  executionTrace: Array<{
    nodeId: string;
    nodeName: string;
    timestamp: Date;
    status: string;
    output?: Record<string, any>;
  }>;

  @Column({ type: 'int', nullable: true })
  duration: number; // milliseconds

  @Column({ type: 'text', nullable: true })
  errorMessage: string;

  @Column({ type: 'timestamp', nullable: true })
  startedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  completedAt: Date;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

