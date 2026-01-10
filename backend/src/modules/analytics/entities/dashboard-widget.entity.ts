import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { Dashboard } from './dashboard.entity';

export enum WidgetType {
  METRIC = 'Metric',
  CHART = 'Chart',
  TABLE = 'Table',
  KPI = 'KPI',
  ALERT = 'Alert',
}

export enum ChartType {
  LINE = 'Line',
  BAR = 'Bar',
  PIE = 'Pie',
  AREA = 'Area',
  DONUT = 'Donut',
}

export enum MetricType {
  PORTFOLIO_HEALTH = 'Portfolio Health',
  DELINQUENCY = 'Delinquency',
  OPERATIONAL = 'Operational',
  FINANCIAL = 'Financial',
  CUSTOMER = 'Customer',
}

@Entity('dashboard_widgets')
@Index(['dashboardId'])
export class DashboardWidget {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Dashboard, (dashboard) => dashboard.widgets, {
    onDelete: 'CASCADE',
  })
  dashboard: Dashboard;

  @Column()
  dashboardId: string;

  @Column({
    type: 'enum',
    enum: WidgetType,
  })
  widgetType: WidgetType;

  @Column({
    type: 'enum',
    enum: MetricType,
    nullable: true,
  })
  metricType: MetricType;

  @Column({
    type: 'enum',
    enum: ChartType,
    nullable: true,
  })
  chartType: ChartType;

  @Column()
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column()
  metricId: string; // Reference to specific metric

  @Column('jsonb', { nullable: true })
  config: any; // Widget-specific configuration

  @Column('int')
  positionX: number; // Grid position

  @Column('int')
  positionY: number; // Grid position

  @Column('int')
  width: number; // Grid width

  @Column('int')
  height: number; // Grid height

  @Column({ type: 'boolean', default: true })
  isVisible: boolean;

  @Column({ type: 'int', default: 0 })
  refreshInterval: number; // Seconds (0 = no auto-refresh)

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

