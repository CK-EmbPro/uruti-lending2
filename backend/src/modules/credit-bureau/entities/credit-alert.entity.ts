import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

export enum AlertType {
  SCORE_CHANGE = 'SCORE_CHANGE',
  NEW_INQUIRY = 'NEW_INQUIRY',
  NEW_ACCOUNT = 'NEW_ACCOUNT',
  PAYMENT_MISSED = 'PAYMENT_MISSED',
  PUBLIC_RECORD = 'PUBLIC_RECORD',
  CREDIT_UTILIZATION = 'CREDIT_UTILIZATION',
  ACCOUNT_CLOSED = 'ACCOUNT_CLOSED',
}

export enum AlertSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
}

@Entity('credit_alerts')
@Index(['companyId', 'customerId'])
@Index(['alertType'])
@Index(['createdAt'])
export class CreditAlert {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  companyId: string;

  @Column()
  customerId: string;

  @Column({
    type: 'enum',
    enum: AlertType,
  })
  alertType: AlertType;

  @Column({ type: 'text' })
  message: string;

  @Column({
    type: 'enum',
    enum: AlertSeverity,
    default: AlertSeverity.MEDIUM,
  })
  severity: AlertSeverity;

  @Column({ type: 'json', nullable: true })
  metadata: Record<string, any>;

  @Column({ type: 'boolean', default: false })
  isRead: boolean;

  @CreateDateColumn()
  createdAt: Date;
}

