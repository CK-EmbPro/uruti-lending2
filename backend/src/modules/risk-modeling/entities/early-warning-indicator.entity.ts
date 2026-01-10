import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { RiskLevel } from '../dto/risk-modeling.dto';
import { Loan } from '../../loan/entities/loan.entity';

@Entity('early_warning_indicators')
@Index(['loanId'])
@Index(['severity'])
@Index(['isResolved'])
@Index(['triggeredDate'])
export class EarlyWarningIndicator {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  loanId: string;

  @ManyToOne(() => Loan)
  @JoinColumn({ name: 'loanId' })
  loan: Loan;

  @Column()
  indicatorName: string;

  @Column({
    type: 'enum',
    enum: RiskLevel,
  })
  severity: RiskLevel;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'jsonb', nullable: true })
  indicatorData: Record<string, any>;

  @Column({ type: 'timestamp' })
  triggeredDate: Date;

  @Column({ type: 'boolean', default: false })
  isResolved: boolean;

  @Column({ type: 'timestamp', nullable: true })
  resolvedDate: Date;

  @Column({ nullable: true })
  resolvedBy: string;

  @Column({ type: 'text', nullable: true })
  resolutionNotes: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

