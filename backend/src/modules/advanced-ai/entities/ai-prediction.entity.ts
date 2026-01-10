import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { PredictionType } from '../dto/advanced-ai.dto';
import { AIModel } from './ai-model.entity';

@Entity('ai_predictions')
@Index(['modelId'])
@Index(['entityId'])
@Index(['predictionType'])
@Index(['createdAt'])
export class AIPrediction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  modelId: string;

  @ManyToOne(() => AIModel)
  @JoinColumn({ name: 'modelId' })
  model: AIModel;

  @Column({ nullable: true })
  entityId: string;

  @Column({
    type: 'enum',
    enum: PredictionType,
  })
  predictionType: PredictionType;

  @Column('decimal', { precision: 10, scale: 6 })
  prediction: number;

  @Column('decimal', { precision: 5, scale: 4 })
  confidence: number;

  @Column({ type: 'jsonb' })
  inputFeatures: Record<string, any>;

  @Column({ type: 'jsonb', nullable: true })
  outputDetails: Record<string, any>;

  @Column({ type: 'boolean', default: false })
  isActualized: boolean;

  @Column({ type: 'timestamp', nullable: true })
  actualizedDate: Date;

  @CreateDateColumn()
  createdAt: Date;
}

