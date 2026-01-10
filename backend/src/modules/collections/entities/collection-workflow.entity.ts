import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { Loan } from '../../loan/entities/loan.entity';
import { CollectionNotice } from './collection-notice.entity';
import { CollectionStage } from '../../../common/enums/collection-stage.enum';

@Entity('collection_workflows')
@Index(['loanId'])
@Index(['startDate'])
@Index(['currentStage'])
export class CollectionWorkflow {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Loan)
  loan: Loan;

  @Column()
  loanId: string;

  @Column({ type: 'date' })
  startDate: Date;

  @Column({
    type: 'enum',
    enum: CollectionStage,
  })
  currentStage: CollectionStage;

  @Column({ type: 'int' })
  daysPastDue: number;

  @Column({ type: 'boolean', default: true })
  active: boolean;

  @Column({ type: 'date', nullable: true })
  endDate: Date;

  @Column({ nullable: true })
  assignedCollector: string;

  @Column({ nullable: true })
  assignedCollectorId: string;

  @Column({ type: 'int', default: 0 })
  noticeCount: number;

  @Column({ type: 'int', default: 0 })
  activityCount: number;

  @Column({ type: 'date', nullable: true })
  lastActivityDate: Date;

  @Column({ type: 'date', nullable: true })
  nextFollowUpDate: Date;

  @Column({ type: 'int', nullable: true })
  skipDays: number; // Days to skip before next action

  @OneToMany(() => CollectionNotice, (notice) => notice.workflow, {
    cascade: true,
    eager: false,
  })
  notices: CollectionNotice[];

  @Column({ nullable: true })
  remarks: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

