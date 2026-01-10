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
import { LoanApplication } from '../../loan-application/entities/loan-application.entity';

export enum FraudAlertStatus {
  PENDING = 'Pending',
  INVESTIGATING = 'Investigating',
  RESOLVED = 'Resolved',
  FALSE_POSITIVE = 'False Positive',
  CONFIRMED = 'Confirmed',
}

export enum FraudAlertSeverity {
  LOW = 'Low',
  MEDIUM = 'Medium',
  HIGH = 'High',
  CRITICAL = 'Critical',
}

@Entity('fraud_alerts')
@Index(['applicationId'])
@Index(['status', 'severity'])
@Index(['detectedDate'])
export class FraudAlert {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  applicationId: string;

  @ManyToOne(() => LoanApplication)
  @JoinColumn({ name: 'applicationId' })
  application: LoanApplication;

  @Column({
    type: 'enum',
    enum: FraudAlertStatus,
    default: FraudAlertStatus.PENDING,
  })
  status: FraudAlertStatus;

  @Column({
    type: 'enum',
    enum: FraudAlertSeverity,
    default: FraudAlertSeverity.MEDIUM,
  })
  severity: FraudAlertSeverity;

  @Column()
  alertType: string; // e.g., 'Identity Mismatch', 'Document Fraud', 'Income Discrepancy'

  @Column({ type: 'text' })
  description: string; // Description of the suspicious pattern

  @Column({ type: 'json' })
  detectedPatterns: Record<string, any>; // Patterns that triggered the alert

  @Column({ type: 'json', nullable: true })
  evidence: Record<string, any>; // Evidence collected

  @Column({ nullable: true })
  assignedTo: string; // Fraud analyst user ID

  @Column({ type: 'text', nullable: true })
  investigationNotes: string;

  @Column({ type: 'text', nullable: true })
  resolution: string; // Resolution details

  @Column({ type: 'boolean', default: false })
  identityVerified: boolean;

  @Column({ type: 'boolean', default: false })
  reportedToLawEnforcement: boolean;

  @Column({ type: 'timestamp' })
  detectedDate: Date;

  @Column({ type: 'timestamp', nullable: true })
  resolvedDate: Date;

  @Column({ type: 'uuid', nullable: true })
  caseId: string | null;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  fraudScore: number | null; // Associated fraud score

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

