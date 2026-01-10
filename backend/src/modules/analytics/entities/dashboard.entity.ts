import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { DashboardWidget } from './dashboard-widget.entity';

@Entity('dashboards')
@Index(['userId'])
@Index(['companyId'])
export class Dashboard {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @Column({ nullable: true })
  companyId: string;

  @Column()
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'boolean', default: false })
  isDefault: boolean;

  @Column({ type: 'boolean', default: false })
  isPublic: boolean; // Shareable with other users

  @Column('jsonb', { nullable: true })
  layout: any; // Grid layout configuration

  @Column('jsonb', { nullable: true })
  filters: any; // Default filters for this dashboard

  @OneToMany(() => DashboardWidget, (widget) => widget.dashboard, {
    cascade: true,
    eager: true,
  })
  widgets: DashboardWidget[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

