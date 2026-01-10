import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum TaskStatus {
  TODO = 'TODO',
  IN_PROGRESS = 'IN_PROGRESS',
  BLOCKED = 'BLOCKED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export enum TaskPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
}

@Entity('tasks')
@Index(['companyId'])
@Index(['assignedTo'])
@Index(['status'])
@Index(['priority'])
@Index(['dueDate'])
@Index(['entityType', 'entityId'])
export class Task {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  companyId: string;

  @Column()
  title: string;

  @Column({ type: 'text' })
  description: string;

  @Column({
    type: 'enum',
    enum: TaskStatus,
    default: TaskStatus.TODO,
  })
  status: TaskStatus;

  @Column({
    type: 'enum',
    enum: TaskPriority,
    default: TaskPriority.MEDIUM,
  })
  priority: TaskPriority;

  @Column({ nullable: true })
  assignedTo: string; // User ID

  @Column({ nullable: true })
  createdBy: string; // User ID

  @Column({ type: 'date', nullable: true })
  dueDate: Date;

  @Column({ type: 'date', nullable: true })
  completedAt: Date;

  @Column({ nullable: true })
  entityType: string; // Related entity type

  @Column({ nullable: true })
  entityId: string; // Related entity ID

  @Column({ type: 'json', nullable: true })
  tags: string[];

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  estimatedHours: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  timeSpent: number; // Hours

  @Column({ type: 'int', default: 0 })
  completionPercentage: number; // 0-100

  @Column({ type: 'json', nullable: true })
  dependsOn: string[]; // Task IDs this task depends on

  @Column({ type: 'json', nullable: true })
  comments: Array<{
    userId: string;
    userName: string;
    comment: string;
    createdAt: string;
  }>;

  @Column({ type: 'json', nullable: true })
  attachments: Array<{
    fileName: string;
    fileUrl: string;
    uploadedBy: string;
    uploadedAt: string;
  }>;

  @Column({ type: 'json', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

