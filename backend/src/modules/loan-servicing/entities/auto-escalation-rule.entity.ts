import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { EscalationLevel } from '../dto/loan-servicing.dto';

@Entity('auto_escalation_rules')
@Index(['isActive'])
export class AutoEscalationRule {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  ruleName: string;

  @Column({ type: 'text' })
  triggerCondition: string;

  @Column({
    type: 'enum',
    enum: EscalationLevel,
  })
  escalationLevel: EscalationLevel;

  @Column({ type: 'jsonb', nullable: true })
  actions: string[];

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'int', default: 0 })
  triggerCount: number;

  @Column({ type: 'timestamp', nullable: true })
  lastTriggeredAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ nullable: true })
  createdBy: string;

  @Column({ nullable: true })
  updatedBy: string;
}

