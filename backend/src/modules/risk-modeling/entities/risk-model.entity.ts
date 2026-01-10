import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { ModelType, ModelStatus } from '../dto/risk-modeling.dto';

@Entity('risk_models')
@Index(['modelType'])
@Index(['status'])
@Index(['modelVersion'])
export class RiskModel {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  modelName: string;

  @Column({
    type: 'enum',
    enum: ModelType,
  })
  modelType: ModelType;

  @Column()
  modelVersion: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({
    type: 'enum',
    enum: ModelStatus,
    default: ModelStatus.TRAINING,
  })
  status: ModelStatus;

  @Column({ type: 'jsonb', nullable: true })
  modelConfig: Record<string, any>;

  @Column({ type: 'jsonb', nullable: true })
  features: string[];

  @Column({ type: 'text', nullable: true })
  modelPath: string; // Path to saved model file

  @Column({ type: 'jsonb', nullable: true })
  performanceMetrics: Record<string, any>;

  @Column({ type: 'int', default: 0 })
  predictionCount: number;

  @Column({ type: 'timestamp', nullable: true })
  lastTrainedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  activatedAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ nullable: true })
  createdBy: string;

  @Column({ nullable: true })
  updatedBy: string;
}

