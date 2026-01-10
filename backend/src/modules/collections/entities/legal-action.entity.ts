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
import { LegalActionType } from '../../../common/enums/legal-action-type.enum';
import { LegalActionStatus } from '../../../common/enums/legal-action-status.enum';
import { Lawsuit } from './lawsuit.entity';
import { Judgment } from './judgment.entity';

@Entity('legal_actions')
@Index(['loanId'])
@Index(['initiatedDate'])
@Index(['status'])
export class LegalAction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Loan)
  loan: Loan;

  @Column()
  loanId: string;

  @Column({
    type: 'enum',
    enum: LegalActionType,
  })
  actionType: LegalActionType;

  @Column({
    type: 'enum',
    enum: LegalActionStatus,
    default: LegalActionStatus.PENDING_APPROVAL,
  })
  status: LegalActionStatus;

  @Column({ type: 'date' })
  initiatedDate: Date;

  @Column({ nullable: true })
  initiatedBy: string;

  @Column({ nullable: true })
  initiatedById: string;

  @Column({ type: 'boolean', default: false })
  approved: boolean;

  @Column({ nullable: true })
  approvedBy: string;

  @Column({ nullable: true })
  approvedById: string;

  @Column({ type: 'date', nullable: true })
  approvedDate: Date;

  @Column({ nullable: true })
  approvalRemarks: string;

  @Column({ nullable: true })
  attorneyName: string;

  @Column({ nullable: true })
  attorneyFirm: string;

  @Column({ nullable: true })
  attorneyContact: string;

  @Column('decimal', { precision: 15, scale: 2 })
  claimAmount: number;

  @Column('decimal', { precision: 15, scale: 2, default: 0 })
  legalFees: number;

  @Column('decimal', { precision: 15, scale: 2, default: 0 })
  courtCosts: number;

  @Column({ type: 'int' })
  daysPastDue: number;

  @OneToMany(() => Lawsuit, (lawsuit) => lawsuit.legalAction, {
    cascade: true,
    eager: false,
  })
  lawsuits: Lawsuit[];

  @OneToMany(() => Judgment, (judgment) => judgment.legalAction, {
    cascade: true,
    eager: false,
  })
  judgments: Judgment[];

  @Column({ nullable: true })
  remarks: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

