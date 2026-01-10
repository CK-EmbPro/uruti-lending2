import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { RiskLevel } from '../dto/predictive-default.dto';

@Entity('default_risk_scores')
@Index(['loanId'])
@Index(['riskLevel'])
@Index(['calculatedAt'])
@Index(['alertTriggered'])
export class DefaultRiskScore {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  loanId: string;

  @Column({ type: 'int' })
  riskScore: number; // 0-100

  @Column({ type: 'varchar', length: '20' })
  riskLevel: RiskLevel;

  @Column({ type: 'int', default: 0 })
  scoreChange: number; // Change from previous day

  @Column({ type: 'jsonb', nullable: true })
  indicators: any; // EarlyWarningIndicatorsDto

  @Column({ type: 'jsonb', nullable: true })
  behavioralDrift: any; // BehavioralDriftDto

  @Column({ type: 'boolean', default: false })
  alertTriggered: boolean;

  @Column({ type: 'date' })
  calculatedAt: Date;

  @Column({ type: 'date', nullable: true })
  predictedDefaultDate?: Date;

  @Column({ type: 'int', nullable: true })
  daysUntilPredictedDefault?: number;

  @CreateDateColumn()
  createdAt: Date;
}

