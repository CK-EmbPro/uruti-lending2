import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum InvestigationStatus {
  OPEN = 'OPEN',
  IN_PROGRESS = 'IN_PROGRESS',
  PENDING_EVIDENCE = 'PENDING_EVIDENCE',
  ESCALATED = 'ESCALATED',
  RESOLVED = 'RESOLVED',
  CLOSED = 'CLOSED',
}

export enum EscalationLevel {
  NONE = 'NONE',
  MANAGER = 'MANAGER',
  LEGAL = 'LEGAL',
  LAW_ENFORCEMENT = 'LAW_ENFORCEMENT',
}

@Entity('fraud_investigation_cases')
@Index(['status'])
@Index(['escalationLevel'])
@Index(['assignedTo'])
@Index(['createdAt'])
@Index(['slaDeadline'])
export class FraudInvestigationCase {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  caseNumber: string; // Unique case number

  @Column({ type: 'simple-array' })
  applicationIds: string[]; // Related application IDs

  @Column({ nullable: true })
  clusterId?: string; // If part of fraud ring

  @Column({
    type: 'enum',
    enum: InvestigationStatus,
    default: InvestigationStatus.OPEN,
  })
  status: InvestigationStatus;

  @Column({
    type: 'enum',
    enum: EscalationLevel,
    default: EscalationLevel.NONE,
  })
  escalationLevel: EscalationLevel;

  @Column({ nullable: true })
  assignedTo?: string; // Investigator user ID

  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
  totalAmount?: number; // Total fraud amount

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'jsonb', nullable: true })
  evidence: {
    screenshots?: string[];
    recordings?: string[];
    notes?: string[];
    documents?: string[];
  };

  @Column({ type: 'jsonb', nullable: true })
  findings: Record<string, any>; // Investigation findings

  @Column({ type: 'timestamp', nullable: true })
  slaDeadline: Date; // SLA deadline (24 hours from creation)

  @Column({ type: 'timestamp', nullable: true })
  investigationStartedAt?: Date;

  @Column({ type: 'timestamp', nullable: true })
  investigationCompletedAt?: Date;

  @Column({ type: 'boolean', default: false })
  lawEnforcementNotified: boolean;

  @Column({ type: 'timestamp', nullable: true })
  lawEnforcementNotifiedAt?: Date;

  @Column({ type: 'text', nullable: true })
  resolutionNotes?: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

