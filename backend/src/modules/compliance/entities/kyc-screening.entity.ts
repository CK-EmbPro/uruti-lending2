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

export enum ScreeningType {
  OFAC = 'OFAC',
  SANCTIONS = 'SANCTIONS',
  PEP = 'PEP',
  ADVERSE_MEDIA = 'ADVERSE_MEDIA',
  CUSTOM = 'CUSTOM',
}

export enum ScreeningStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  CLEARED = 'CLEARED',
  FLAGGED = 'FLAGGED',
  FALSE_POSITIVE = 'FALSE_POSITIVE',
  SAR_FILED = 'SAR_FILED',
}

export enum MatchSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

@Entity('kyc_screenings')
@Index(['applicationId'])
@Index(['screeningDate'])
@Index(['status'])
export class KYCScreening {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => LoanApplication)
  application: LoanApplication;

  @Column()
  applicationId: string;

  @Column({
    type: 'enum',
    enum: ScreeningType,
    default: ScreeningType.OFAC,
  })
  screeningType: ScreeningType;

  @Column({ type: 'date' })
  screeningDate: Date;

  @Column({
    type: 'enum',
    enum: ScreeningStatus,
    default: ScreeningStatus.PENDING,
  })
  status: ScreeningStatus;

  // Screening Results
  @Column({ type: 'boolean', default: false })
  matchFound: boolean;

  @Column({ type: 'int', default: 0 })
  matchCount: number;

  @Column({
    type: 'enum',
    enum: MatchSeverity,
    nullable: true,
  })
  matchSeverity: MatchSeverity;

  // Match Details (JSON)
  @Column('jsonb', { nullable: true })
  matches: any; // Array of match details

  @Column('jsonb', { nullable: true })
  screeningData: any; // Full screening response

  // Investigation
  @Column({ nullable: true })
  investigatedBy: string;

  @Column({ type: 'timestamp', nullable: true })
  investigatedAt: Date;

  @Column('text', { nullable: true })
  investigationNotes: string;

  @Column({ type: 'boolean', default: false })
  requiresSAR: boolean; // Suspicious Activity Report

  // SAR Filing
  @Column({ type: 'boolean', default: false })
  sarFiled: boolean;

  @Column({ nullable: true })
  sarFiledBy: string;

  @Column({ type: 'timestamp', nullable: true })
  sarFiledAt: Date;

  @Column({ nullable: true })
  sarReference: string; // SAR filing reference number

  @Column('text', { nullable: true })
  sarNotes: string;

  // Resolution
  @Column({ nullable: true })
  resolvedBy: string;

  @Column({ type: 'timestamp', nullable: true })
  resolvedAt: Date;

  @Column('text', { nullable: true })
  resolutionNotes: string;

  @Column('text', { nullable: true })
  remarks: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

