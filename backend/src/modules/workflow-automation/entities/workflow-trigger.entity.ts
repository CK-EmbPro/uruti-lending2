import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum TriggerType {
  EVENT = 'EVENT',
  SCHEDULE = 'SCHEDULE',
  CONDITION = 'CONDITION',
}

export enum EventType {
  LOAN_APPLICATION_SUBMITTED = 'LOAN_APPLICATION_SUBMITTED',
  LOAN_APPLICATION_APPROVED = 'LOAN_APPLICATION_APPROVED',
  LOAN_APPLICATION_REJECTED = 'LOAN_APPLICATION_REJECTED',
  LOAN_DISBURSED = 'LOAN_DISBURSED',
  PAYMENT_MISSED = 'PAYMENT_MISSED',
  PAYMENT_RECEIVED = 'PAYMENT_RECEIVED',
  DOCUMENT_UPLOADED = 'DOCUMENT_UPLOADED',
  DOCUMENT_VERIFIED = 'DOCUMENT_VERIFIED',
  LOAN_CLOSED = 'LOAN_CLOSED',
  LOAN_NPA = 'LOAN_NPA',
  CUSTOMER_CREATED = 'CUSTOMER_CREATED',
}

export enum ScheduleFrequency {
  DAILY = 'DAILY',
  WEEKLY = 'WEEKLY',
  MONTHLY = 'MONTHLY',
  CUSTOM = 'CUSTOM',
}

@Entity('workflow_automation_triggers')
@Index(['workflowId'])
@Index(['triggerType', 'isActive'])
@Index(['eventType'])
export class WorkflowTrigger {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  workflowId: string; // Reference to workflow

  @Column()
  triggerName: string;

  @Column({
    type: 'enum',
    enum: TriggerType,
  })
  triggerType: TriggerType;

  @Column({
    type: 'enum',
    enum: EventType,
    nullable: true,
  })
  eventType: EventType | null;

  @Column({ nullable: true })
  entityType: string; // Filter by entity type

  @Column({
    type: 'enum',
    enum: ScheduleFrequency,
    nullable: true,
  })
  scheduleFrequency: ScheduleFrequency | null;

  @Column({ nullable: true })
  scheduleTime: string; // HH:mm format

  @Column({ type: 'json', nullable: true })
  scheduleDays: string[]; // For weekly schedules

  @Column({ type: 'json', nullable: true })
  conditions: Array<{
    field: string;
    operator: string;
    value: any;
  }>; // Conditions for conditional triggers

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'int', default: 0 })
  executionCount: number;

  @Column({ type: 'timestamp', nullable: true })
  lastExecutedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  nextExecutionAt: Date;

  @Column({ type: 'json', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

