import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('advanced_dashboards')
@Index(['createdBy'])
@Index(['isPublic'])
export class AdvancedDashboard {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  dashboardName: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'boolean', default: false })
  isPublic: boolean;

  @Column({ type: 'int', default: 0 })
  widgetCount: number;

  @Column({ type: 'int', default: 0 })
  viewCount: number;

  @Column({ type: 'jsonb', nullable: true })
  layout: Record<string, any>; // Dashboard layout configuration

  @Column({ type: 'jsonb', nullable: true })
  widgets: Array<{
    id: string;
    widgetType: string;
    title: string;
    config: Record<string, any>;
    position: { x: number; y: number; w: number; h: number };
  }>;

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

