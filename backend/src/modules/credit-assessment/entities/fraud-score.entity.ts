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

export enum FraudScoreSource {
  ML_MODEL = 'ML_MODEL',
  EXTERNAL_API = 'EXTERNAL_API',
  RULE_BASED = 'RULE_BASED',
  BEHAVIORAL = 'BEHAVIORAL',
  DEVICE_FINGERPRINT = 'DEVICE_FINGERPRINT',
}

export enum RiskLevel {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

@Entity('fraud_scores')
@Index(['applicationId'])
@Index(['score', 'riskLevel'])
@Index(['createdAt'])
export class FraudScore {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  applicationId: string;

  @ManyToOne(() => LoanApplication)
  @JoinColumn({ name: 'applicationId' })
  application: LoanApplication;

  @Column({ type: 'decimal', precision: 5, scale: 2 })
  score: number; // 0-100, higher = more risky

  @Column({ type: 'enum', enum: RiskLevel })
  riskLevel: RiskLevel;

  @Column({ type: 'enum', enum: FraudScoreSource })
  source: FraudScoreSource;

  @Column({ type: 'json', nullable: true })
  factors: Record<string, any>; // Contributing factors to the score

  @Column({ type: 'json', nullable: true })
  deviceFingerprint: Record<string, any>; // Device information

  @Column({ type: 'json', nullable: true })
  behavioralData: Record<string, any>; // Behavioral patterns

  @Column({ type: 'varchar', length: 45, nullable: true })
  ipAddress: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  userAgent: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  deviceId: string | null;

  @Column({ type: 'boolean', default: false })
  isBlacklisted: boolean;

  @Column({ type: 'boolean', default: false })
  isWhitelisted: boolean;

  @Column({ type: 'json', nullable: true })
  externalApiResponse: Record<string, any>; // Response from external fraud API

  @Column({ type: 'text', nullable: true })
  explanation: string | null; // Human-readable explanation of the score

  @Column({ type: 'uuid', nullable: true })
  caseId: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

