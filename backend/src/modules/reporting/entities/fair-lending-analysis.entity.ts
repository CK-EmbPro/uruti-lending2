import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum FairLendingAnalysisType {
  APPROVAL_RATE = 'APPROVAL_RATE',
  PRICING = 'PRICING',
  MARKETING = 'MARKETING',
}

export enum ProtectedClass {
  RACE = 'RACE',
  GENDER = 'GENDER',
  ETHNICITY = 'ETHNICITY',
  AGE = 'AGE',
  DISABILITY = 'DISABILITY',
}

@Entity('fair_lending_analyses')
@Index(['analysisDate'])
@Index(['analysisType'])
export class FairLendingAnalysis {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: FairLendingAnalysisType,
    default: FairLendingAnalysisType.APPROVAL_RATE,
  })
  analysisType: FairLendingAnalysisType;

  @Column({ type: 'date' })
  analysisDate: Date;

  @Column({ type: 'date', nullable: true })
  periodStartDate: Date;

  @Column({ type: 'date', nullable: true })
  periodEndDate: Date;

  @Column({ nullable: true })
  companyId: string;

  @Column({ nullable: true })
  loanProductId: string;

  // Protected Class Analysis (JSON)
  // Structure: { protectedClass: { category: { applications, approvals, denials, rates }, ... }, ... }
  @Column('jsonb', { nullable: true })
  protectedClassData: any;

  // Statistical Analysis
  @Column('decimal', { precision: 5, scale: 2, nullable: true })
  overallApprovalRate: number; // Percentage

  @Column('jsonb', { nullable: true })
  approvalRatesByClass: any;

  @Column('jsonb', { nullable: true })
  pricingDisparities: any;

  // Disparity Detection
  @Column('jsonb', { nullable: true })
  significantDisparities: any; // Array of detected disparities

  @Column('decimal', { precision: 5, scale: 2, nullable: true })
  maxDisparityRatio: number; // Highest ratio between groups

  @Column({ nullable: true })
  maxDisparityClass: string;

  // Review & Action
  @Column({ type: 'boolean', default: false })
  reviewed: boolean;

  @Column({ nullable: true })
  reviewedBy: string;

  @Column({ type: 'timestamp', nullable: true })
  reviewedAt: Date;

  @Column({ type: 'boolean', default: false })
  correctiveActionRequired: boolean;

  @Column('text', { nullable: true })
  correctiveActionPlan: string;

  @Column('text', { nullable: true })
  remarks: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

