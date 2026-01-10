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
import { Workflow } from './workflow.entity';

export enum TriggerType {
  EVENT = 'EVENT',
  SCHEDULE = 'SCHEDULE',
  MANUAL = 'MANUAL',
}

export enum EventType {
  LOAN_APPLICATION_SUBMITTED = 'LOAN_APPLICATION_SUBMITTED',
  LOAN_APPLICATION_APPROVED = 'LOAN_APPLICATION_APPROVED',
  LOAN_APPLICATION_REJECTED = 'LOAN_APPLICATION_REJECTED',
  LOAN_DISBURSED = 'LOAN_DISBURSED',
  LOAN_OVERDUE = 'LOAN_OVERDUE',
  PAYMENT_RECEIVED = 'PAYMENT_RECEIVED',
  PAYMENT_MISSED = 'PAYMENT_MISSED',
  DOCUMENT_UPLOADED = 'DOCUMENT_UPLOADED',
  CUSTOMER_CREATED = 'CUSTOMER_CREATED',
  LOAN_CLOSED = 'LOAN_CLOSED',
  CUSTOM = 'CUSTOM',
}

export enum ScheduleType {
  DAILY = 'DAILY',
  WEEKLY = 'WEEKLY',
  MONTHLY = 'MONTHLY',
  CUSTOM = 'CUSTOM',
}

@Entity('workflow_triggers')
@Index(['workflowId', 'isActive'])
@Index(['triggerType', 'eventType'])
export class WorkflowTrigger {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  workflowId: string;

  @ManyToOne(() => Workflow)
  @JoinColumn({ name: 'workflowId' })
  workflow: Workflow;

  @Column({ type: 'enum', enum: TriggerType })
  triggerType: TriggerType;

  @Column({ type: 'enum', enum: EventType, nullable: true })
  eventType: EventType | null; // For EVENT triggers

  @Column({ type: 'enum', enum: ScheduleType, nullable: true })
  scheduleType: ScheduleType | null; // For SCHEDULE triggers

  @Column({ type: 'varchar', length: 100, nullable: true })
  cronExpression: string | null; // For custom schedules

  @Column({ type: 'time', nullable: true })
  scheduleTime: string | null; // For daily/weekly schedules

  @Column({ type: 'json', nullable: true })
  conditions: Record<string, any>; // Conditional logic for triggering

  @Column({ type: 'json', nullable: true })
  parameters: Record<string, any>; // Additional parameters

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'int', default: 0 })
  executionCount: number;

  @Column({ type: 'timestamp', nullable: true })
  lastExecutedAt: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  nextExecutionAt: Date | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

