import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

export enum ActionType {
  FRIENDLY_REMINDER = 'FRIENDLY_REMINDER',
  DATE_CHANGE_OFFER = 'DATE_CHANGE_OFFER',
  BUDGETING_TIPS = 'BUDGETING_TIPS',
  INCREASED_REMINDERS = 'INCREASED_REMINDERS',
  RESTRICT_NEW_BORROWING = 'RESTRICT_NEW_BORROWING',
  VOLUNTARY_RESTRUCTURE = 'VOLUNTARY_RESTRUCTURE',
  SOFT_COLLECTIONS = 'SOFT_COLLECTIONS',
  DAILY_CONTACT = 'DAILY_CONTACT',
  FLAG_GUARANTORS = 'FLAG_GUARANTORS',
  ASSIGN_RECOVERY_TEAM = 'ASSIGN_RECOVERY_TEAM',
  PREPARE_LEGAL_ACTION = 'PREPARE_LEGAL_ACTION',
}

@Entity('pre_default_actions')
@Index(['loanId'])
@Index(['actionType'])
@Index(['executed'])
@Index(['executedAt'])
export class PreDefaultAction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  loanId: string;

  @Column({ type: 'varchar', length: '50' })
  actionType: ActionType;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'boolean', default: false })
  executed: boolean;

  @Column({ type: 'timestamp', nullable: true })
  executedAt?: Date;

  @Column({ type: 'jsonb', nullable: true })
  actionDetails: Record<string, any>;

  @Column({ type: 'int' })
  riskScoreAtAction: number; // Risk score when action was triggered

  @CreateDateColumn()
  createdAt: Date;
}

