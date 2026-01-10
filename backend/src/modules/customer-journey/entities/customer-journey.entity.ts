import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum JourneyStage {
  AWARENESS = 'AWARENESS',
  INTEREST = 'INTEREST',
  CONSIDERATION = 'CONSIDERATION',
  APPLICATION = 'APPLICATION',
  APPROVAL = 'APPROVAL',
  DISBURSEMENT = 'DISBURSEMENT',
  ACTIVE_LOAN = 'ACTIVE_LOAN',
  REPAYMENT = 'REPAYMENT',
  CLOSURE = 'CLOSURE',
  RETENTION = 'RETENTION',
}

export enum TouchpointType {
  WEBSITE_VISIT = 'WEBSITE_VISIT',
  CALCULATOR_USE = 'CALCULATOR_USE',
  APPLICATION_START = 'APPLICATION_START',
  APPLICATION_SUBMIT = 'APPLICATION_SUBMIT',
  DOCUMENT_UPLOAD = 'DOCUMENT_UPLOAD',
  APPROVAL_NOTIFICATION = 'APPROVAL_NOTIFICATION',
  LOAN_DISBURSEMENT = 'LOAN_DISBURSEMENT',
  PAYMENT = 'PAYMENT',
  SUPPORT_CONTACT = 'SUPPORT_CONTACT',
  PORTAL_LOGIN = 'PORTAL_LOGIN',
}

@Entity('customer_journeys')
@Index(['customerId'])
@Index(['companyId'])
@Index(['currentStage'])
@Index(['createdAt'])
export class CustomerJourney {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  companyId: string;

  @Column()
  customerId: string;

  @Column({
    type: 'enum',
    enum: JourneyStage,
    default: JourneyStage.AWARENESS,
  })
  currentStage: JourneyStage;

  @Column({ type: 'json' })
  timeline: Array<{
    date: string;
    stage: JourneyStage;
    touchpoint: TouchpointType;
    description: string;
    metadata: Record<string, any>;
  }>;

  @Column({ type: 'json', nullable: true })
  timeInStages: Record<JourneyStage, number>;

  @Column({ type: 'int', nullable: true })
  totalDuration: number; // Days

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  conversionRate: number; // 0-1

  @Column({ type: 'json', nullable: true })
  dropOffPoints: Array<{
    stage: JourneyStage;
    date: string;
    reason: string;
  }>;

  @Column({ type: 'int', nullable: true })
  engagementScore: number; // 0-100

  @Column({ type: 'json', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

