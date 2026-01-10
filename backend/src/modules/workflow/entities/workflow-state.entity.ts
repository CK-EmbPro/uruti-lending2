import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { Workflow } from './workflow.entity';

@Entity('workflow_states')
@Index(['workflowId', 'state'])
export class WorkflowState {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Workflow, (workflow) => workflow.states, {
    onDelete: 'CASCADE',
  })
  workflow: Workflow;

  @Column()
  workflowId: string;

  @Column()
  state: string; // e.g., 'Draft', 'Initiated', 'KYC Pending', 'Approved'

  @Column({ type: 'int', default: 0 })
  docStatus: number; // 0 = Draft, 1 = Submitted/Approved

  @Column({ type: 'boolean', default: false })
  isOptionalState: boolean;

  @Column({ type: 'boolean', default: false })
  allowEdit: boolean; // Allow editing in this state

  @Column({ type: 'text', nullable: true })
  message: string; // Message to show in this state

  @Column({ type: 'boolean', default: false })
  sendEmail: boolean;

  @Column({ nullable: true })
  nextActionEmailTemplate: string;

  @CreateDateColumn()
  createdAt: Date;
}

