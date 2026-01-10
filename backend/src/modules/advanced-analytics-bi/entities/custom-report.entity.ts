import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { ReportType, ReportStatus } from '../dto/advanced-analytics-bi.dto';

@Entity('custom_reports')
@Index(['reportType'])
@Index(['status'])
@Index(['createdBy'])
export class CustomReport {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  reportName: string;

  @Column({
    type: 'enum',
    enum: ReportType,
  })
  reportType: ReportType;

  @Column({ type: 'text' })
  dataSource: string; // SQL query or data source reference

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({
    type: 'enum',
    enum: ReportStatus,
    default: ReportStatus.DRAFT,
  })
  status: ReportStatus;

  @Column({ type: 'jsonb', nullable: true })
  parameters: Record<string, any>;

  @Column({ type: 'boolean', default: false })
  isScheduled: boolean;

  @Column({ nullable: true })
  scheduleCron: string;

  @Column({ type: 'int', default: 0 })
  executionCount: number;

  @Column({ type: 'timestamp', nullable: true })
  lastExecutedAt: Date;

  @Column({ type: 'jsonb', nullable: true })
  lastResult: Record<string, any>;

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

