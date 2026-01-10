import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { ApplicantType } from '../../../common/enums/applicant-type.enum';

export enum PreApprovalStatus {
  ACTIVE = 'ACTIVE',
  EXPIRED = 'EXPIRED',
  USED = 'USED',
  CANCELLED = 'CANCELLED',
}

@Entity('pre_approvals')
@Index(['applicantId', 'applicantType'])
@Index(['preApprovalCode'], { unique: true })
@Index(['status', 'expiryDate'])
export class PreApproval {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  preApprovalCode: string;

  @Column()
  companyId: string;

  @Column({
    type: 'enum',
    enum: ApplicantType,
  })
  applicantType: ApplicantType;

  @Column()
  applicantId: string;

  @Column()
  loanProductId: string;

  @Column('decimal', { precision: 15, scale: 2 })
  preApprovedAmount: number;

  @Column('decimal', { precision: 5, scale: 2 })
  preApprovedRate: number;

  @Column({ type: 'int' })
  preApprovedTenure: number; // in months

  @Column({
    type: 'enum',
    enum: PreApprovalStatus,
    default: PreApprovalStatus.ACTIVE,
  })
  status: PreApprovalStatus;

  @Column({ type: 'int' })
  validityDays: number;

  @Column({ type: 'timestamp' })
  expiryDate: Date;

  @Column({ type: 'json', nullable: true })
  conditions: string[];

  @Column({ type: 'json', nullable: true })
  metadata: Record<string, any>; // Store credit score, income, etc.

  @Column({ nullable: true })
  usedInApplicationId: string; // Application ID that used this pre-approval

  @Column({ type: 'timestamp', nullable: true })
  usedAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

