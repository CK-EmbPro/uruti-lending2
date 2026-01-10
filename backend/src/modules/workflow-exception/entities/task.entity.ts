import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { TaskStatus } from '../../../common/enums/task-status.enum';
import { TaskPriority } from '../../../common/enums/task-priority.enum';
import { TaskType } from '../../../common/enums/task-type.enum';

@Entity('tasks')
@Index(['status'])
@Index(['assignedTo'])
@Index(['createdBy'])
@Index(['dueDate'])
@Index(['priority'])
export class Task {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({
    type: 'enum',
    enum: TaskType,
    default: TaskType.OTHER,
  })
  taskType: TaskType;

  @Column({
    type: 'enum',
    enum: TaskStatus,
    default: TaskStatus.PENDING,
  })
  status: TaskStatus;

  @Column({
    type: 'enum',
    enum: TaskPriority,
    default: TaskPriority.MEDIUM,
  })
  priority: TaskPriority;

  // Assignment
  @Column({ nullable: true })
  assignedTo: string; // User ID

  @Column({ nullable: true })
  assignedByName: string;

  @Column({ type: 'timestamp', nullable: true })
  assignedAt: Date;

  // Creator
  @Column()
  createdBy: string; // User ID

  @Column()
  createdByName: string;

  // Related entity references
  @Column({ nullable: true })
  relatedEntityType: string; // e.g., 'Loan', 'LoanApplication', 'Customer'

  @Column({ nullable: true })
  relatedEntityId: string;

  // Dates
  @Column({ type: 'timestamp', nullable: true })
  dueDate: Date;

  @Column({ type: 'timestamp', nullable: true })
  startedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  completedAt: Date;

  // SLA
  @Column({ type: 'int', nullable: true })
  slaHours: number; // SLA in hours

  @Column({ type: 'timestamp', nullable: true })
  slaDueDate: Date;

  // Escalation
  @Column({ type: 'boolean', default: false })
  isEscalated: boolean;

  @Column({ nullable: true })
  escalatedTo: string; // User ID

  @Column({ type: 'timestamp', nullable: true })
  escalatedAt: Date;

  @Column({ type: 'text', nullable: true })
  escalationReason: string;

  // Comments and updates
  @Column({ type: 'jsonb', nullable: true })
  comments: Array<{
    userId: string;
    userName: string;
    comment: string;
    timestamp: Date;
  }>;

  @Column({ type: 'jsonb', nullable: true })
  attachments: Array<{
    fileName: string;
    filePath: string;
    uploadedBy: string;
    uploadedAt: Date;
  }>;

  @Column({ type: 'text', nullable: true })
  resolutionNotes: string;

  @Column({ type: 'text', nullable: true })
  remarks: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

