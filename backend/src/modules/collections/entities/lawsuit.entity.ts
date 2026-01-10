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

@Entity('lawsuits')
@Index(['legalActionId'])
@Index(['filedDate'])
export class Lawsuit {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => LegalAction, (action) => action.lawsuits)
  legalAction: LegalAction;

  @Column()
  legalActionId: string;

  @Column({ nullable: true })
  caseNumber: string;

  @Column({ nullable: true })
  courtName: string;

  @Column({ nullable: true })
  courtAddress: string;

  @Column({ type: 'date', nullable: true })
  filedDate: Date;

  @Column({ type: 'date', nullable: true })
  servedDate: Date;

  @Column({ type: 'boolean', default: false })
  served: boolean;

  @Column({ nullable: true })
  serviceMethod: string; // Personal, Certified Mail, Publication

  @Column({ type: 'date', nullable: true })
  hearingDate: Date;

  @Column({ nullable: true })
  hearingLocation: string;

  @Column({ type: 'date', nullable: true })
  trialDate: Date;

  @Column({ nullable: true })
  trialLocation: string;

  @Column({ type: 'text', nullable: true })
  caseNotes: string;

  @Column({ nullable: true })
  currentStatus: string;

  @Column({ nullable: true })
  remarks: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

