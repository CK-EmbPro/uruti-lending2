import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('data_insights')
@Index(['insightType'])
@Index(['generatedAt'])
export class DataInsight {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  insightType: string; // TREND, ANOMALY, PREDICTION, RECOMMENDATION

  @Column()
  title: string;

  @Column({ type: 'text' })
  description: string;

  @Column('decimal', { precision: 5, scale: 4 })
  confidence: number; // 0.0000 to 1.0000

  @Column({ type: 'jsonb', nullable: true })
  recommendations: string[];

  @Column({ type: 'jsonb', nullable: true })
  dataPoints: Record<string, any>;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @Column({ type: 'timestamp' })
  generatedAt: Date;

  @CreateDateColumn()
  createdAt: Date;
}

