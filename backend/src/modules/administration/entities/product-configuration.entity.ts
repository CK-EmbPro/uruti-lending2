import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { ProductStatus } from '../../../common/enums/product-status.enum';

@Entity('product_configurations')
@Index(['productCode'], { unique: true })
@Index(['status'])
@Index(['companyId'])
export class ProductConfiguration {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  productCode: string;

  @Column()
  productName: string;

  @Column()
  companyId: string;

  @Column({
    type: 'enum',
    enum: ProductStatus,
    default: ProductStatus.DRAFT,
  })
  status: ProductStatus;

  // Eligibility Criteria
  @Column('decimal', { precision: 15, scale: 2, nullable: true })
  minimumLoanAmount: number;

  @Column('decimal', { precision: 15, scale: 2, nullable: true })
  maximumLoanAmount: number;

  @Column({ type: 'int', nullable: true })
  minimumCreditScore: number;

  @Column({ type: 'int', nullable: true })
  minimumAge: number;

  @Column({ type: 'int', nullable: true })
  maximumAge: number;

  @Column('decimal', { precision: 5, scale: 2, nullable: true })
  maximumDebtToIncomeRatio: number;

  @Column({ type: 'jsonb', nullable: true })
  requiredDocuments: string[];

  @Column({ type: 'jsonb', nullable: true })
  employmentTypes: string[];

  // Pricing Configuration
  @Column('decimal', { precision: 5, scale: 2 })
  baseInterestRate: number;

  @Column('decimal', { precision: 5, scale: 2, nullable: true })
  minimumInterestRate: number;

  @Column('decimal', { precision: 5, scale: 2, nullable: true })
  maximumInterestRate: number;

  @Column({ type: 'jsonb', nullable: true })
  interestRateFactors: Record<string, any>; // Risk-based pricing factors

  // Workflow Configuration
  @Column({ type: 'jsonb', nullable: true })
  approvalWorkflow: Record<string, any>; // Approval steps and requirements

  @Column({ type: 'jsonb', nullable: true })
  disbursementWorkflow: Record<string, any>; // Disbursement steps

  // Product Settings
  @Column({ type: 'int', nullable: true })
  minimumTerm: number; // in months

  @Column({ type: 'int', nullable: true })
  maximumTerm: number; // in months

  @Column({ type: 'boolean', default: false })
  allowsPrepayment: boolean;

  @Column({ type: 'boolean', default: false })
  allowsRefinancing: boolean;

  @Column({ type: 'boolean', default: false })
  requiresCollateral: boolean;

  @Column({ type: 'text', nullable: true })
  productDescription: string;

  @Column({ type: 'text', nullable: true })
  termsAndConditions: string;

  // Testing & Activation
  @Column({ type: 'timestamp', nullable: true })
  testedAt: Date;

  @Column({ nullable: true })
  testedBy: string;

  @Column({ type: 'timestamp', nullable: true })
  activatedAt: Date;

  @Column({ nullable: true })
  activatedBy: string;

  @Column({ type: 'text', nullable: true })
  testResults: string;

  @Column({ type: 'text', nullable: true })
  remarks: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ nullable: true })
  createdBy: string;

  @Column({ nullable: true })
  updatedBy: string;
}

