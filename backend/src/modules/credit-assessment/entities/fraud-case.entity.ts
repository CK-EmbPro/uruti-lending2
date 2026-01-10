import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  OneToMany,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
// Using forward references to avoid circular dependencies

export enum FraudCaseStatus {
  OPEN = 'OPEN',
  INVESTIGATING = 'INVESTIGATING',
  ESCALATED = 'ESCALATED',
  RESOLVED = 'RESOLVED',
  CLOSED = 'CLOSED',
}

export enum FraudCaseType {
  IDENTITY_THEFT = 'IDENTITY_THEFT',
  DOCUMENT_FRAUD = 'DOCUMENT_FRAUD',
  APPLICATION_FRAUD = 'APPLICATION_FRAUD',
  ACCOUNT_TAKEOVER = 'ACCOUNT_TAKEOVER',
  SYNTHETIC_IDENTITY = 'SYNTHETIC_IDENTITY',
  COLLUSION = 'COLLUSION',
  OTHER = 'OTHER',
}

@Entity('fraud_cases')
@Index(['status', 'priority'])
@Index(['assignedTo'])
@Index(['createdAt'])
export class FraudCase {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 50, unique: true })
  caseNumber: string;

  @Column({ type: 'enum', enum: FraudCaseType })
  caseType: FraudCaseType;

  @Column({ type: 'enum', enum: FraudCaseStatus, default: FraudCaseStatus.OPEN })
  status: FraudCaseStatus;

  @Column({ type: 'int', default: 1 })
  priority: number; // 1-5, 1 = highest priority

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  assignedTo: string | null; // Fraud analyst user ID

  @Column({ type: 'json', nullable: true })
  relatedApplications: string[]; // Array of application IDs

  // Relations are handled via caseId foreign keys in FraudAlert and FraudScore

  @Column({ type: 'json', nullable: true })
  evidence: Record<string, any>; // Collected evidence

  @Column({ type: 'json', nullable: true })
  investigationNotes: Record<string, any>; // Investigation timeline

  @Column({ type: 'text', nullable: true })
  resolution: string | null;

  @Column({ type: 'boolean', default: false })
  reportedToLawEnforcement: boolean;

  @Column({ type: 'timestamp', nullable: true })
  reportedDate: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  resolvedDate: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  escalatedDate: Date | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

