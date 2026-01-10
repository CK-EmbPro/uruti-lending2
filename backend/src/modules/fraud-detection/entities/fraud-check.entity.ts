import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

export enum FraudRiskLevel {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

@Entity('fraud_checks')
@Index(['applicationId'])
@Index(['email'])
@Index(['phone'])
@Index(['ipAddress'])
@Index(['createdAt'])
export class FraudCheck {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  applicationId: string;

  @Column()
  email: string;

  @Column()
  phone: string;

  @Column()
  ipAddress: string;

  @Column({ nullable: true })
  deviceFingerprint: string;

  @Column({
    type: 'enum',
    enum: FraudRiskLevel,
    default: FraudRiskLevel.LOW,
  })
  riskLevel: FraudRiskLevel;

  @Column({ type: 'int', default: 0 })
  riskScore: number; // 0-100

  @Column({ type: 'boolean', default: false })
  isFlagged: boolean;

  @Column({ type: 'json', nullable: true })
  indicators: string[];

  @Column({ type: 'json', nullable: true })
  factors: Record<string, number>;

  @Column({ type: 'boolean', default: false })
  requiresVerification: boolean;

  @CreateDateColumn()
  createdAt: Date;
}

