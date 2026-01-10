import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { PredictionType } from './prediction-result.entity';

export enum ModelStatus {
  ACTIVE = 'ACTIVE',
  TRAINING = 'TRAINING',
  TESTING = 'TESTING',
  DEPRECATED = 'DEPRECATED',
}

export enum ModelType {
  RULE_BASED = 'RULE_BASED',
  MACHINE_LEARNING = 'MACHINE_LEARNING',
  HYBRID = 'HYBRID',
}

@Entity('prediction_models')
@Index(['predictionType', 'status'])
export class PredictionModel {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ type: 'enum', enum: PredictionType })
  predictionType: PredictionType;

  @Column({ type: 'enum', enum: ModelType })
  modelType: ModelType;

  @Column({ type: 'enum', enum: ModelStatus, default: ModelStatus.ACTIVE })
  status: ModelStatus;

  @Column({ type: 'varchar', length: 50 })
  version: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'json', nullable: true })
  parameters: Record<string, any>; // Model parameters/configuration

  @Column({ type: 'json', nullable: true })
  metrics: Record<string, any>; // Model performance metrics (accuracy, precision, recall, etc.)

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  accuracy: number | null; // Overall accuracy (0-100)

  @Column({ type: 'varchar', length: 500, nullable: true })
  modelPath: string | null; // Path to saved model file (for ML models)

  @Column({ type: 'varchar', length: 500, nullable: true })
  endpointUrl: string | null; // API endpoint for model inference (for external ML services)

  @Column({ type: 'timestamp', nullable: true })
  trainedAt: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  deployedAt: Date | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

