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
import { ServicingTaskType, ServicingTaskStatus } from '../dto/loan-servicing.dto';

@Entity('servicing_tasks')
@Index(['loanId'])
@Index(['taskType'])
@Index(['status'])
@Index(['dueDate'])
@Index(['assignedTo'])
export class ServicingTask {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  loanId: string;

  @Column({
    type: 'enum',
    enum: ServicingTaskType,
  })
  taskType: ServicingTaskType;

  @Column({
    type: 'enum',
    enum: ServicingTaskStatus,
    default: ServicingTaskStatus.PENDING,
  })
  status: ServicingTaskStatus;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'int', default: 5 })
  priority: number;

  @Column({ type: 'timestamp', nullable: true })
  dueDate: Date;

  @Column({ type: 'timestamp', nullable: true })
  completedAt: Date;

  @Column({ nullable: true })
  assignedTo: string;

  @Column({ type: 'jsonb', nullable: true })
  config: Record<string, any>;

  @Column({ type: 'jsonb', nullable: true })
  result: Record<string, any>;

  @Column({ type: 'text', nullable: true })
  errorMessage: string;

  @Column({ type: 'int', default: 0 })
  retryCount: number;

  @Column({ type: 'int', nullable: true })
  maxRetries: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ nullable: true })
  createdBy: string;

  @Column({ nullable: true })
  updatedBy: string;
}

