import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { RiskLevel } from '../dto/risk-modeling.dto';
import { RiskModel } from './risk-model.entity';
import { Loan } from '../../loan/entities/loan.entity';

@Entity('risk_predictions')
@Index(['modelId'])
@Index(['loanId'])
@Index(['customerId'])
@Index(['predictionDate'])
@Index(['riskLevel'])
export class RiskPrediction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  modelId: string;

  @ManyToOne(() => RiskModel)
  @JoinColumn({ name: 'modelId' })
  model: RiskModel;

  @Column({ nullable: true })
  loanId: string;

  @ManyToOne(() => Loan, { nullable: true })
  @JoinColumn({ name: 'loanId' })
  loan: Loan;

  @Column({ nullable: true })
  customerId: string;

  @Column('decimal', { precision: 5, scale: 4 })
  riskScore: number; // 0.0000 to 1.0000

  @Column({
    type: 'enum',
    enum: RiskLevel,
  })
  riskLevel: RiskLevel;

  @Column('decimal', { precision: 5, scale: 4 })
  confidence: number; // 0.0000 to 1.0000

  @Column({ type: 'jsonb', nullable: true })
  inputFeatures: Record<string, any>;

  @Column({ type: 'jsonb', nullable: true })
  riskFactors: Array<{
    factor: string;
    impact: number;
    description: string;
  }>;

  @Column({ type: 'jsonb', nullable: true })
  recommendations: string[];

  @Column({ type: 'timestamp' })
  predictionDate: Date;

  @Column({ type: 'boolean', default: false })
  isActualized: boolean; // Whether prediction came true

  @Column({ type: 'timestamp', nullable: true })
  actualizedDate: Date;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;
}

