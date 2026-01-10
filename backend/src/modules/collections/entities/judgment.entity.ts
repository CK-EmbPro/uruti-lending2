import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { LegalAction } from './legal-action.entity';

@Entity('judgments')
@Index(['legalActionId'])
@Index(['judgmentDate'])
export class Judgment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => LegalAction, (action) => action.judgments)
  legalAction: LegalAction;

  @Column()
  legalActionId: string;

  @Column({ type: 'date' })
  judgmentDate: Date;

  @Column('decimal', { precision: 15, scale: 2 })
  judgmentAmount: number;

  @Column('decimal', { precision: 15, scale: 2, default: 0 })
  principalAmount: number;

  @Column('decimal', { precision: 15, scale: 2, default: 0 })
  interestAmount: number;

  @Column('decimal', { precision: 15, scale: 2, default: 0 })
  legalFeesAmount: number;

  @Column('decimal', { precision: 15, scale: 2, default: 0 })
  courtCostsAmount: number;

  @Column({ nullable: true })
  judgmentType: string; // Default, Summary, Consent

  @Column({ nullable: true })
  caseNumber: string;

  @Column({ nullable: true })
  courtName: string;

  @Column({ type: 'boolean', default: false })
  satisfied: boolean;

  @Column({ type: 'date', nullable: true })
  satisfiedDate: Date;

  @Column('decimal', { precision: 15, scale: 2, default: 0 })
  satisfiedAmount: number;

  @Column({ nullable: true })
  satisfactionMethod: string; // Payment, Garnishment, Levy, etc.

  @Column({ nullable: true })
  remarks: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

