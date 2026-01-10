import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { AIModelType } from '../dto/advanced-ai.dto';
import { ModelStatus } from '../../risk-modeling/dto/risk-modeling.dto';

@Entity('ai_models')
@Index(['modelType'])
@Index(['status'])
@Index(['modelVersion'])
export class AIModel {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  modelName: string;

  @Column({
    type: 'enum',
    enum: AIModelType,
  })
  modelType: AIModelType;

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

  @Column({ type: 'text', nullable: true })
  modelPath: string;

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
}

