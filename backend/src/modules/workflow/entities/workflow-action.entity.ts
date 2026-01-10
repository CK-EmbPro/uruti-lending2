import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('workflow_actions')
@Index(['documentType', 'documentId'])
@Index(['userId'])
@Index(['actionDate'])
export class WorkflowAction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  documentType: string; // e.g., 'Loan Application', 'Loan'

  @Column()
  documentId: string; // ID of the document

  @Column()
  workflowId: string; // Workflow that was used

  @Column()
  fromState: string; // Previous state

  @Column()
  toState: string; // New state

  @Column()
  action: string; // Action that was performed

  @Column()
  userId: string; // User who performed the action

  @Column({ nullable: true })
  userName: string; // User name for display

  @Column({ type: 'text', nullable: true })
  comments: string; // Optional comments

  @Column({ type: 'timestamp' })
  actionDate: Date;

  @CreateDateColumn()
  createdAt: Date;
}

