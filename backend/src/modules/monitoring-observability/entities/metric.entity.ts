import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { MetricType } from '../dto/monitoring-observability.dto';

@Entity('metrics')
@Index(['name'])
@Index(['timestamp'])
@Index(['type'])
export class Metric {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({
    type: 'enum',
    enum: MetricType,
  })
  type: MetricType;

  @Column('decimal', { precision: 15, scale: 4 })
  value: number;

  @Column({ type: 'jsonb', nullable: true })
  labels: Record<string, string>;

  @Column({ type: 'timestamp' })
  timestamp: Date;

  @CreateDateColumn()
  createdAt: Date;
}

