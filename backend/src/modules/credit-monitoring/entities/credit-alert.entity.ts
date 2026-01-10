import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { AlertSeverity } from '../dto/credit-monitoring.dto';
import { CreditMonitoring } from './credit-monitoring.entity';

@Entity('credit_alerts')
@Index(['customerId'])
@Index(['severity'])
@Index(['isRead'])
@Index(['alertDate'])
@Index(['monitoringId'])
export class CreditAlert {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  customerId: string;

  @Column({ nullable: true })
  monitoringId: string;

  @ManyToOne(() => CreditMonitoring, { nullable: true })
  @JoinColumn({ name: 'monitoringId' })
  monitoring: CreditMonitoring;

  @Column()
  alertType: string; // SIGNIFICANT_DECREASE, SIGNIFICANT_INCREASE, etc.

  @Column({
    type: 'enum',
    enum: AlertSeverity,
  })
  severity: AlertSeverity;

  @Column({ type: 'text' })
  message: string;

  @Column({ type: 'int' })
  currentScore: number;

  @Column({ type: 'int', nullable: true })
  previousScore: number;

  @Column({ type: 'int', nullable: true })
  scoreChange: number;

  @Column({ type: 'timestamp' })
  alertDate: Date;

  @Column({ type: 'boolean', default: false })
  isRead: boolean;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;
}

