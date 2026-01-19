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
import { Company } from '../../company/entities/company.entity';
import { LoanProduct } from '../../loan-product/entities/loan-product.entity';

export enum ApplicationStatus {
  DRAFT = 'Draft',
  SUBMITTED = 'Submitted',
  UNDER_REVIEW = 'Under Review',
  APPROVED = 'Approved',
  REJECTED = 'Rejected',
  CANCELLED = 'Cancelled',
}

@Entity('loan_applications')
@Index(['status'])
@Index(['applicantId', 'applicantType'])
@Index(['loanProductId'])
export class LoanApplication {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  applicationNumber: string;

  @Column()
  companyId: string;

  @Column()
  applicantType: string; // Customer or Company

  @Column()
  applicantId: string;

  @Column()
  loanProductId: string;

  @Column('decimal', { precision: 15, scale: 2 })
  requestedAmount: number;

  @Column({ nullable: true })
  fullName: string;

  @Column({ nullable: true })
  email: string;

  @Column({ nullable: true })
  phoneNumber: string;

  @Column({ type: 'date', nullable: true })
  dateOfBirth: Date;

  @Column({ type: 'text', nullable: true })
  address: string;

  @Column('decimal', { precision: 15, scale: 2, nullable: true })
  annualIncome: number;

  @Column({ nullable: true })
  employmentStatus: string;

  @Column('decimal', { precision: 15, scale: 2, nullable: true })
  approvedAmount: number;

  @Column({
    type: 'enum',
    enum: ApplicationStatus,
    default: ApplicationStatus.DRAFT,
  })
  status: ApplicationStatus;

  @Column({ type: 'text', nullable: true })
  remarks: string;

  @Column({ type: 'date' })
  applicationDate: Date;

  @Column({ type: 'date', nullable: true })
  approvalDate: Date;

  @Column({ type: 'date', nullable: true })
  rejectionDate: Date;

  @Column({ nullable: true })
  rejectedBy: string;

  @Column({ nullable: true })
  approvedBy: string;

  @Column({ nullable: true })
  loanId: string; // Link to created loan

  @Column({ type: 'boolean', default: false })
  isSecuredLoan: boolean;

  @Column({ type: 'int', nullable: true })
  repaymentPeriods: number;

  @Column({ nullable: true })
  repaymentFrequency: string;

  @Column({ type: 'date', nullable: true })
  repaymentStartDate: Date;

  @Column({ nullable: true })
  repaymentMethod: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  repaymentStructure: string; // FIXED, GRADUATED, SEASONAL, BULLET - Selected by borrower

  @Column('decimal', { precision: 15, scale: 2, nullable: true })
  maximumLoanAmount: number; // Calculated from securities if secured

  // Credit Scoring Fields
  @Column({ type: 'int', nullable: true })
  creditScore: number; // Final weighted credit score (300-850)

  @Column({ type: 'json', nullable: true })
  scoringDetails: {
    finalScore: number;
    scoreBreakdown: any;
    weights: any;
    explanation: string;
    confidence: number;
    riskTier: string;
    calculatedAt: Date;
  }; // Full scoring result from weighted scoring engine

  @Column({ type: 'timestamp', nullable: true })
  creditScoreCalculatedAt: Date; // When credit score was last calculated

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => Company)
  @JoinColumn({ name: 'companyId' })
  company: Company;

  @ManyToOne(() => LoanProduct)
  @JoinColumn({ name: 'loanProductId' })
  loanProduct: LoanProduct;
}

