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
import { LoanApplication } from '../../loan-application/entities/loan-application.entity';

export enum NoticeStatus {
  PENDING = 'Pending',
  GENERATED = 'Generated',
  SENT = 'Sent',
  DELIVERED = 'Delivered',
  ACKNOWLEDGED = 'Acknowledged',
}

@Entity('adverse_action_notices')
@Index(['applicationId'])
@Index(['status'])
@Index(['generatedDate'])
export class AdverseActionNotice {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  applicationId: string;

  @ManyToOne(() => LoanApplication)
  @JoinColumn({ name: 'applicationId' })
  application: LoanApplication;

  @Column({ unique: true })
  noticeNumber: string;

  @Column({
    type: 'enum',
    enum: NoticeStatus,
    default: NoticeStatus.PENDING,
  })
  status: NoticeStatus;

  @Column('decimal', { precision: 5, scale: 2, nullable: true })
  creditScore: number; // Credit score used in decision

  @Column({ type: 'json' })
  adverseFactors: string[]; // Factors that led to decline

  @Column({ type: 'text' })
  reasonForDecline: string; // Primary reason

  @Column({ type: 'json', nullable: true })
  creditBureauInfo: Record<string, any>; // Credit bureau information

  @Column({ type: 'text', nullable: true })
  counteroffer: string; // Counteroffer if applicable

  @Column({ type: 'text', nullable: true })
  reconsiderationInstructions: string; // Instructions for reconsideration

  @Column({ type: 'timestamp' })
  generatedDate: Date;

  @Column({ type: 'timestamp', nullable: true })
  sentDate: Date;

  @Column({ type: 'timestamp', nullable: true })
  deliveredDate: Date;

  @Column({ type: 'text', nullable: true })
  deliveryMethod: string; // 'Email', 'Mail', 'Portal'

  @Column({ type: 'boolean', default: false })
  complianceLogged: boolean;

  @Column({ type: 'timestamp', nullable: true })
  complianceLogDate: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

