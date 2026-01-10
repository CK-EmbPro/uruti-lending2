import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

export enum ExecutionStatus {
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
  PENDING = 'PENDING',
}

@Entity('workflow_automation_executions')
@Index(['triggerId'])
@Index(['entityType', 'entityId'])
@Index(['status'])
@Index(['executedAt'])
export class WorkflowExecution {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  triggerId: string; // Reference to workflow trigger

  @Column()
  workflowId: string; // Reference to workflow

  @Column()
  entityType: string;

  @Column()
  entityId: string;

  @Column({
    type: 'enum',
    enum: ExecutionStatus,
    default: ExecutionStatus.PENDING,
  })
  status: ExecutionStatus;

  @Column({ type: 'int', nullable: true })
  executionTimeMs: number; // Execution time in milliseconds

  @Column({ type: 'text', nullable: true })
  errorMessage: string;

  @Column({ type: 'json', nullable: true })
  executionData: Record<string, any>; // Data used during execution

  @Column({ type: 'json', nullable: true })
  result: Record<string, any>; // Execution result

  @CreateDateColumn()
  executedAt: Date;
}

