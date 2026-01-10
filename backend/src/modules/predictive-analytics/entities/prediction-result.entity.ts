import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum PredictionType {
  DEFAULT_PROBABILITY = 'DEFAULT_PROBABILITY',
  CUSTOMER_LIFETIME_VALUE = 'CUSTOMER_LIFETIME_VALUE',
  CHURN_RISK = 'CHURN_RISK',
  OPTIMAL_PRICING = 'OPTIMAL_PRICING',
  LOAN_PERFORMANCE = 'LOAN_PERFORMANCE',
}

export enum RiskLevel {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

@Entity('prediction_results')
@Index(['entityId', 'entityType', 'predictionType'])
@Index(['predictionType', 'calculatedAt'])
export class PredictionResult {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  entityId: string; // Loan ID, Customer ID, or Application ID

  @Column()
  entityType: string; // 'loan', 'customer', 'application'

  @Column({ type: 'enum', enum: PredictionType })
  predictionType: PredictionType;

  @Column({ type: 'decimal', precision: 10, scale: 4 })
  score: number; // Prediction score (0-1 for probability, or value for CLV)

  @Column({ type: 'enum', enum: RiskLevel, nullable: true })
  riskLevel: RiskLevel | null;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  confidence: number | null; // Model confidence (0-100)

  @Column({ type: 'json', nullable: true })
  features: Record<string, any>; // Input features used for prediction

  @Column({ type: 'json', nullable: true })
  factors: Record<string, any>; // Contributing factors to the prediction

  @Column({ type: 'text', nullable: true })
  explanation: string | null; // Human-readable explanation

  @Column({ type: 'json', nullable: true })
  recommendations: Record<string, any>; // Actionable recommendations

  @Column({ type: 'varchar', length: 100, nullable: true })
  modelVersion: string | null; // ML model version used

  @Column({ type: 'timestamp' })
  calculatedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  expiresAt: Date | null; // When prediction expires (for time-sensitive predictions)

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

