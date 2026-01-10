import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { LoanApplication } from '../../loan-application/entities/loan-application.entity';

export enum ConsentType {
  MARKETING = 'MARKETING',
  DATA_SHARING = 'DATA_SHARING',
  CREDIT_BUREAU = 'CREDIT_BUREAU',
  THIRD_PARTY = 'THIRD_PARTY',
  ANALYTICS = 'ANALYTICS',
  COMMUNICATION = 'COMMUNICATION',
}

export enum ConsentStatus {
  GRANTED = 'GRANTED',
  DENIED = 'DENIED',
  WITHDRAWN = 'WITHDRAWN',
  PENDING = 'PENDING',
}

export enum RequestType {
  ACCESS = 'ACCESS',
  DELETION = 'DELETION',
  RECTIFICATION = 'RECTIFICATION',
  PORTABILITY = 'PORTABILITY',
  RESTRICTION = 'RESTRICTION',
  OBJECTION = 'OBJECTION',
}

export enum RequestStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  REJECTED = 'REJECTED',
  CANCELLED = 'CANCELLED',
}

@Entity('privacy_consents')
@Index(['applicationId'])
@Index(['consentDate'])
@Index(['status'])
export class PrivacyConsent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => LoanApplication, { nullable: true })
  application: LoanApplication;

  @Column({ nullable: true })
  applicationId: string;

  @Column({ nullable: true })
  customerId: string; // Can be linked to application or standalone

  @Column({
    type: 'enum',
    enum: ConsentType,
  })
  consentType: ConsentType;

  @Column({ type: 'date' })
  consentDate: Date;

  @Column({
    type: 'enum',
    enum: ConsentStatus,
    default: ConsentStatus.PENDING,
  })
  status: ConsentStatus;

  @Column('text', { nullable: true })
  consentText: string; // Privacy notice text shown

  @Column({ type: 'boolean', default: false })
  explicitConsent: boolean; // Explicit opt-in required

  @Column({ type: 'timestamp', nullable: true })
  withdrawnAt: Date;

  @Column('text', { nullable: true })
  withdrawalReason: string;

  @Column('text', { nullable: true })
  remarks: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

@Entity('privacy_requests')
@Index(['customerId'])
@Index(['requestDate'])
@Index(['status'])
export class PrivacyRequest {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  customerId: string;

  @Column({
    type: 'enum',
    enum: RequestType,
  })
  requestType: RequestType;

  @Column({ type: 'date' })
  requestDate: Date;

  @Column({
    type: 'enum',
    enum: RequestStatus,
    default: RequestStatus.PENDING,
  })
  status: RequestStatus;

  @Column('text')
  description: string;

  @Column('text', { nullable: true })
  requestDetails: string; // Specific details of the request

  // Processing
  @Column({ nullable: true })
  processedBy: string;

  @Column({ type: 'timestamp', nullable: true })
  processedAt: Date;

  @Column('text', { nullable: true })
  processingNotes: string;

  @Column('text', { nullable: true })
  responseData: string; // Data provided for access/portability requests

  @Column({ type: 'timestamp', nullable: true })
  completedAt: Date;

  @Column('text', { nullable: true })
  rejectionReason: string;

  @Column('text', { nullable: true })
  remarks: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

