import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { OptimizationStatus } from '../dto/performance-optimization.dto';

@Entity('optimization_recommendations')
@Index(['profileId'])
@Index(['status'])
export class OptimizationRecommendation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  profileId: string;

  @Column()
  type: string; // ADD_CACHE, ADD_INDEX, QUERY_OPTIMIZATION, etc.

  @Column({ type: 'text' })
  description: string;

  @Column()
  impact: string; // LOW, MEDIUM, HIGH, CRITICAL

  @Column()
  estimatedImprovement: string; // e.g., "50%"

  @Column({
    type: 'enum',
    enum: OptimizationStatus,
    default: OptimizationStatus.PENDING,
  })
  status: OptimizationStatus;

  @Column({ type: 'jsonb', nullable: true })
  implementationDetails: Record<string, any>;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

