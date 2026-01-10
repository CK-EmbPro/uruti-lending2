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
import { CollectionStage } from '../../../common/enums/collection-stage.enum';

@Entity('delinquency_records')
@Index(['loanId'])
@Index(['recordDate'])
@Index(['collectionStage'])
export class DelinquencyRecord {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Loan)
  loan: Loan;

  @Column()
  loanId: string;

  @Column({ type: 'date' })
  recordDate: Date;

  @Column({ type: 'int' })
  daysPastDue: number;

  @Column({
    type: 'enum',
    enum: CollectionStage,
  })
  collectionStage: CollectionStage;

  @Column('decimal', { precision: 15, scale: 2, default: 0 })
  outstandingBalance: number;

  @Column('decimal', { precision: 15, scale: 2, default: 0 })
  lateFeeAssessed: number;

  @Column({ type: 'boolean', default: false })
  lateFeeWaived: boolean;

  @Column({ nullable: true })
  lateFeeWaiverReason: string;

  @Column({ type: 'boolean', default: false })
  creditBureauUpdated: boolean;

  @Column({ type: 'date', nullable: true })
  creditBureauUpdateDate: Date;

  @Column({ type: 'boolean', default: false })
  collectionWorkflowTriggered: boolean;

  @Column({ nullable: true })
  remarks: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

