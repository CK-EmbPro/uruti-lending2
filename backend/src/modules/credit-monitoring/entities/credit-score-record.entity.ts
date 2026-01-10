import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { CreditBureau, CreditScoreChangeType } from '../dto/credit-monitoring.dto';
import { CreditMonitoring } from './credit-monitoring.entity';

@Entity('credit_score_records')
@Index(['customerId'])
@Index(['creditBureau'])
@Index(['scoreDate'])
@Index(['monitoringId'])
export class CreditScoreRecord {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  customerId: string;

  @Column({ nullable: true })
  monitoringId: string;

  @ManyToOne(() => CreditMonitoring, { nullable: true })
  @JoinColumn({ name: 'monitoringId' })
  monitoring: CreditMonitoring;

  @Column({
    type: 'enum',
    enum: CreditBureau,
  })
  creditBureau: CreditBureau;

  @Column({ type: 'int' })
  creditScore: number;

  @Column({ type: 'date' })
  scoreDate: Date;

  @Column({ type: 'int', nullable: true })
  previousScore: number;

  @Column({ type: 'int', nullable: true })
  scoreChange: number;

  @Column({
    type: 'enum',
    enum: CreditScoreChangeType,
    nullable: true,
  })
  changeType: CreditScoreChangeType;

  @Column({ type: 'jsonb', nullable: true })
  creditFactors: Record<string, any>;

  @Column({ type: 'jsonb', nullable: true })
  reportData: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;
}

