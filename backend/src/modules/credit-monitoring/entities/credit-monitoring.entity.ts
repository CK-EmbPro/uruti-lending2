import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { CreditBureau } from '../dto/credit-monitoring.dto';

@Entity('credit_monitoring')
@Index(['customerId'])
@Index(['isActive'])
@Index(['creditBureau'])
export class CreditMonitoring {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  customerId: string;

  @Column({
    type: 'enum',
    enum: CreditBureau,
  })
  creditBureau: CreditBureau;

  @Column({ type: 'int' })
  monitoringFrequency: number; // days

  @Column({ type: 'int', nullable: true })
  alertThreshold: number; // score change threshold

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'timestamp', nullable: true })
  lastCheckedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  nextCheckAt: Date;

  @Column({ type: 'int', default: 0 })
  checkCount: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ nullable: true })
  createdBy: string;

  @Column({ nullable: true })
  updatedBy: string;
}

