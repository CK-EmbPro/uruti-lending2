import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { ChartType } from '../dto/advanced-analytics-bi.dto';

@Entity('data_visualizations')
@Index(['chartType'])
@Index(['createdBy'])
export class DataVisualization {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  visualizationName: string;

  @Column({
    type: 'enum',
    enum: ChartType,
  })
  chartType: ChartType;

  @Column({ type: 'text' })
  dataQuery: string;

  @Column({ type: 'jsonb' })
  chartConfig: Record<string, any>;

  @Column({ type: 'int', default: 0 })
  viewCount: number;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ nullable: true })
  createdBy: string;

  @Column({ nullable: true })
  updatedBy: string;
}

