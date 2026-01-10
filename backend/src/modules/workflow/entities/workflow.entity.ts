import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { WorkflowState } from './workflow-state.entity';
import { WorkflowTransition } from './workflow-transition.entity';

@Entity('workflows')
@Index(['documentType', 'isActive'])
export class Workflow {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  workflowName: string;

  @Column()
  documentType: string; // e.g., 'Loan Application', 'Loan', 'Loan Restructure'

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'text', nullable: true })
  description: string;

  @OneToMany(() => WorkflowState, (state) => state.workflow, { cascade: true })
  states: WorkflowState[];

  @OneToMany(() => WorkflowTransition, (transition) => transition.workflow, {
    cascade: true,
  })
  transitions: WorkflowTransition[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

