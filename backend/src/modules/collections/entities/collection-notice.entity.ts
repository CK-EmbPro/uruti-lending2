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
import { CollectionNoticeType } from '../../../common/enums/collection-notice-type.enum';
import { CollectionChannel } from '../../../common/enums/collection-channel.enum';
import { CollectionWorkflow } from './collection-workflow.entity';

@Entity('collection_notices')
@Index(['loanId'])
@Index(['sentDate'])
@Index(['noticeType'])
export class CollectionNotice {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Loan)
  loan: Loan;

  @Column()
  loanId: string;

  @Column({
    type: 'enum',
    enum: CollectionNoticeType,
  })
  noticeType: CollectionNoticeType;

  @Column({
    type: 'enum',
    enum: CollectionChannel,
  })
  channel: CollectionChannel;

  @Column({ type: 'date' })
  sentDate: Date;

  @Column({ type: 'date', nullable: true })
  scheduledDate: Date;

  @Column({ type: 'int' })
  daysPastDue: number;

  @Column('decimal', { precision: 15, scale: 2 })
  outstandingBalance: number;

  @Column({ nullable: true })
  recipientEmail: string;

  @Column({ nullable: true })
  recipientPhone: string;

  @Column({ nullable: true })
  recipientAddress: string;

  @Column({ type: 'boolean', default: false })
  sent: boolean;

  @Column({ type: 'date', nullable: true })
  actualSentDate: Date;

  @Column({ type: 'boolean', default: false })
  delivered: boolean;

  @Column({ type: 'date', nullable: true })
  deliveredDate: Date;

  @Column({ type: 'boolean', default: false })
  opened: boolean;

  @Column({ type: 'date', nullable: true })
  openedDate: Date;

  @Column({ nullable: true })
  templateId: string;

  @Column({ type: 'text', nullable: true })
  content: string;

  @ManyToOne(() => CollectionWorkflow, { nullable: true })
  workflow: CollectionWorkflow;

  @Column({ nullable: true })
  workflowId: string;

  @Column({ nullable: true })
  remarks: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

