import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { SLAStatus } from '../../../common/enums/sla-status.enum';

@Entity('sla_trackings')
@Index(['taskId'])
@Index(['status'])
@Index(['slaDueDate'])
@Index(['breached'])
export class SLATracking {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  taskId: string; // Reference to Task entity

  @Column()
  taskTitle: string; // Denormalized for quick access

  // SLA Configuration
  @Column({ type: 'int' })
  slaHours: number; // SLA in hours

  @Column({ type: 'timestamp' })
  slaStartDate: Date;

  @Column({ type: 'timestamp' })
  slaDueDate: Date;

  // Status
  @Column({
    type: 'enum',
    enum: SLAStatus,
    default: SLAStatus.ON_TRACK,
  })
  status: SLAStatus;

  @Column({ type: 'boolean', default: false })
  breached: boolean;

  @Column({ type: 'timestamp', nullable: true })
  breachedAt: Date;

  // Alert Configuration
  @Column({ type: 'int', default: 24 })
  alertBeforeHours: number; // Alert X hours before SLA due

  @Column({ type: 'boolean', default: false })
  alertSent: boolean;

  @Column({ type: 'timestamp', nullable: true })
  alertSentAt: Date;

  @Column({ type: 'boolean', default: false })
  escalationAlertSent: boolean;

  @Column({ type: 'timestamp', nullable: true })
  escalationAlertSentAt: Date;

  // Assignment
  @Column({ nullable: true })
  assignedTo: string; // User ID

  @Column({ nullable: true })
  assignedToName: string;

  @Column({ nullable: true })
  escalatedTo: string; // User ID (supervisor/manager)

  @Column({ nullable: true })
  escalatedToName: string;

  @Column({ type: 'timestamp', nullable: true })
  escalatedAt: Date;

  @Column({ type: 'text', nullable: true })
  escalationReason: string;

  // Completion
  @Column({ type: 'timestamp', nullable: true })
  completedAt: Date;

  @Column({ type: 'int', nullable: true })
  actualHours: number; // Actual hours taken

  @Column({ type: 'int', nullable: true })
  breachMinutes: number; // Minutes breached (if any)

  // Tracking
  @Column({ type: 'jsonb', nullable: true })
  statusHistory: Array<{
    status: SLAStatus;
    timestamp: Date;
    updatedBy: string;
    notes?: string;
  }>;

  @Column({ type: 'text', nullable: true })
  remarks: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

