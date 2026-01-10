import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { Workflow } from './workflow.entity';

@Entity('workflow_transitions')
@Index(['workflowId', 'state'])
export class WorkflowTransition {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Workflow, (workflow) => workflow.transitions, {
    onDelete: 'CASCADE',
  })
  workflow: Workflow;

  @Column()
  workflowId: string;

  @Column()
  state: string; // Current state

  @Column()
  action: string; // Action name, e.g., 'Initiate', 'Review', 'Approve'

  @Column()
  nextState: string; // Next state after action

  @Column({ type: 'text', nullable: true })
  allowed: string; // Comma-separated roles, e.g., 'Loan Officer,Loan Processor'

  @Column({ type: 'boolean', default: true })
  allowSelfApproval: boolean;

  @Column({ type: 'text', nullable: true })
  condition: string; // Optional condition expression

  @Column({ type: 'boolean', default: false })
  sendEmailToCreator: boolean;

  @CreateDateColumn()
  createdAt: Date;
}

