import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { Loan } from '../../loan/entities/loan.entity';
import { CollectionActivityType } from '../../../common/enums/collection-activity-type.enum';
import { CollectionChannel } from '../../../common/enums/collection-channel.enum';
import { CollectionWorkflow } from './collection-workflow.entity';

@Entity('collection_activities')
@Index(['loanId'])
@Index(['activityDate'])
@Index(['activityType'])
export class CollectionActivity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Loan)
  loan: Loan;

  @Column()
  loanId: string;

  @ManyToOne(() => CollectionWorkflow, { nullable: true })
  workflow: CollectionWorkflow;

  @Column({ nullable: true })
  workflowId: string;

  @Column({
    type: 'enum',
    enum: CollectionActivityType,
  })
  activityType: CollectionActivityType;

  @Column({
    type: 'enum',
    enum: CollectionChannel,
  })
  channel: CollectionChannel;

  @Column({ type: 'date' })
  activityDate: Date;

  @Column({ type: 'time', nullable: true })
  activityTime: string;

  @Column({ nullable: true })
  performedBy: string;

  @Column({ nullable: true })
  performedById: string;

  @Column({ type: 'text', nullable: true })
  conversationNotes: string;

  @Column({ type: 'boolean', default: false })
  rightPartyContact: boolean;

  @Column({ type: 'boolean', default: false })
  ceaseAndDesist: boolean;

  @Column({ nullable: true })
  contactPhone: string;

  @Column({ nullable: true })
  contactEmail: string;

  @Column({ nullable: true })
  contactAddress: string;

  @Column({ type: 'int', nullable: true })
  callDuration: number; // in seconds

  @Column({ type: 'boolean', default: false })
  callbackRequested: boolean;

  @Column({ type: 'date', nullable: true })
  callbackDate: Date;

  @Column({ nullable: true })
  outcome: string; // Promise to Pay, Payment Arrangement, Refused, No Answer, etc.

  @Column({ nullable: true })
  remarks: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

