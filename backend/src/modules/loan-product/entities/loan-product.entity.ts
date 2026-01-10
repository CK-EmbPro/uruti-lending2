import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { RepaymentScheduleType } from '../../../common/enums/repayment-schedule-type.enum';
import { Loan } from '../../loan/entities/loan.entity';
import { LoanCharge } from './loan-charge.entity';

@Entity('loan_products')
@Index(['productCode'], { unique: true })
@Index(['productName'], { unique: true })
@Index(['companyId'])
export class LoanProduct {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  productCode: string;

  @Column({ unique: true })
  productName: string;

  @Column()
  companyId: string;

  @Column('decimal', { precision: 5, scale: 2 })
  rateOfInterest: number;

  @Column('decimal', { precision: 5, scale: 2, default: 0 })
  penaltyInterestRate: number;

  @Column('decimal', { precision: 15, scale: 2, nullable: true })
  maximumLoanAmount: number;

  @Column({ type: 'boolean', default: false })
  isTermLoan: boolean;

  @Column({
    type: 'enum',
    enum: RepaymentScheduleType,
    nullable: true,
  })
  repaymentScheduleType: RepaymentScheduleType;

  @Column({ type: 'int', nullable: true })
  cyclicDayOfTheMonth: number;

  @Column({ nullable: true })
  repaymentDateOn: string; // 'End of the current month' or 'Start of the next month'

  @Column({ type: 'int', default: 0 })
  minDaysBwDisbursementFirstRepayment: number;

  @Column({ type: 'int', nullable: true })
  daysPastDueThresholdForNpa: number;

  @Column({ type: 'int', default: 0 })
  gracePeriodInDays: number;

  @Column('decimal', { precision: 3, scale: 2, nullable: true })
  excessAmountAcceptanceLimit: number;

  @Column('decimal', { precision: 15, scale: 2, default: 0 })
  writeOffAmount: number;

  // Broken Period Interest (BPI) Configuration
  @Column({
    type: 'enum',
    enum: ['Amortized Over Tenure', 'Add to First EMI', 'Upfront Deduction'],
    nullable: true,
  })
  bpiRecoveryMethod: string; // How BPI is recovered

  @Column({ type: 'boolean', default: false })
  disabled: boolean;

  @Column({ type: 'text', nullable: true })
  termsAndConditions: string;

  @Column({ type: 'text', nullable: true })
  productDescription: string;

  @Column('decimal', { precision: 15, scale: 2, nullable: true })
  minimumLoanAmount: number;

  @Column({ type: 'int', nullable: true })
  minimumTerm: number; // in months

  @Column({ type: 'int', nullable: true })
  maximumTerm: number; // in months

  // Eligibility Criteria
  @Column({ type: 'int', nullable: true })
  minimumAge: number;

  @Column({ type: 'int', nullable: true })
  maximumAge: number;

  @Column('decimal', { precision: 15, scale: 2, nullable: true })
  minimumMonthlyIncome: number;

  @Column('decimal', { precision: 15, scale: 2, nullable: true })
  minimumAnnualIncome: number;

  @Column({ type: 'int', nullable: true })
  minimumCreditScore: number;

  @Column('decimal', { precision: 5, scale: 2, nullable: true })
  maximumDebtToIncomeRatio: number;

  @Column({ type: 'jsonb', nullable: true })
  employmentTypes: string[]; // ['Salaried', 'Self-Employed', 'Business Owner', etc.]

  @Column({ type: 'jsonb', nullable: true })
  requiredDocuments: string[]; // ['ID Proof', 'Address Proof', 'Income Proof', etc.]

  @Column({ type: 'jsonb', nullable: true })
  eligibleCountries: string[]; // ISO country codes

  @Column({ type: 'jsonb', nullable: true })
  eligibleRegions: string[]; // State/Province codes

  @Column({ type: 'boolean', default: false })
  requiresCollateral: boolean;

  @Column({ type: 'text', nullable: true })
  collateralRequirements: string;

  // Marketing & Audience-Facing Content
  @Column({ type: 'text', nullable: true })
  productTagline: string; // Short marketing tagline

  @Column({ type: 'text', nullable: true })
  shortDescription: string; // 1-2 sentence description for listings

  @Column({ type: 'jsonb', nullable: true })
  productHighlights: string[]; // ['Quick Approval', 'Low Interest Rates', 'Flexible Repayment']

  @Column({ type: 'jsonb', nullable: true })
  keyFeatures: string[]; // ['No Prepayment Charges', 'Online Application', 'Instant Approval']

  @Column({ type: 'jsonb', nullable: true })
  benefits: string[]; // Detailed benefits list

  @Column({ type: 'text', nullable: true })
  targetAudience: string; // Description of target customers

  @Column({ type: 'text', nullable: true })
  howItWorks: string; // Step-by-step process description

  @Column({ type: 'jsonb', nullable: true })
  faqs: Array<{ question: string; answer: string }>; // FAQ structure

  @Column({ type: 'jsonb', nullable: true })
  productImages: string[]; // URLs to product images/banners

  @Column({ type: 'text', nullable: true })
  promotionalBannerUrl: string; // Main promotional banner

  @Column({ type: 'text', nullable: true })
  productIconUrl: string; // Product icon/logo URL

  // Product Options & Flexibility
  @Column({ type: 'boolean', default: true })
  allowsPrepayment: boolean;

  @Column({ type: 'boolean', default: false })
  allowsPartialPrepayment: boolean;

  @Column({ type: 'boolean', default: false })
  allowsRefinancing: boolean;

  @Column({ type: 'boolean', default: false })
  allowsTopUp: boolean;

  @Column('decimal', { precision: 5, scale: 2, nullable: true })
  prepaymentCharges: number; // Percentage or fixed amount

  // Processing & Disbursement
  @Column({ type: 'int', nullable: true })
  averageProcessingTime: number; // in days

  @Column({ type: 'int', nullable: true })
  averageDisbursementTime: number; // in days

  @Column({ type: 'text', nullable: true })
  processingTimeDescription: string; // Human-readable description

  // Product Category & Classification
  @Column({ nullable: true })
  loanCategory: string; // 'Personal', 'Business', 'Home', 'Auto', etc.

  @Column({ nullable: true })
  productType: string; // 'Secured', 'Unsecured', 'Line of Credit', etc.

  @Column({ type: 'jsonb', nullable: true })
  useCases: string[]; // ['Debt Consolidation', 'Home Improvement', 'Medical Expenses', etc.]

  // Comparison & Competitive Features
  @Column({ type: 'jsonb', nullable: true })
  competitiveAdvantages: string[]; // What makes this product better

  @Column({ type: 'text', nullable: true })
  comparisonNotes: string; // Notes for product comparison

  // Application Requirements
  @Column({ type: 'text', nullable: true })
  applicationRequirements: string; // Detailed requirements

  @Column({ type: 'int', nullable: true })
  minimumEmploymentDuration: number; // months

  @Column({ type: 'boolean', default: false })
  requiresCoApplicant: boolean;

  @Column({ type: 'boolean', default: false })
  requiresGuarantor: boolean;

  // Account references
  @Column()
  disbursementAccount: string;

  @Column()
  paymentAccount: string;

  @Column()
  loanAccount: string;

  @Column()
  interestIncomeAccount: string;

  @Column()
  penaltyIncomeAccount: string;

  @Column()
  interestAccruedAccount: string;

  @Column()
  interestReceivableAccount: string;

  @Column()
  penaltyAccruedAccount: string;

  @Column()
  penaltyReceivableAccount: string;

  @Column()
  securityDepositAccount: string;

  @Column()
  customerRefundAccount: string;

  @Column()
  writeOffAccount: string;

  @Column()
  writeOffRecoveryAccount: string;

  @Column()
  interestWaiverAccount: string;

  @Column()
  penaltyWaiverAccount: string;

  // Relationships
  @OneToMany(() => Loan, (loan) => loan.loanProduct)
  loans: Loan[];

  @OneToMany(() => LoanCharge, (charge) => charge.loanProduct, {
    cascade: true,
    eager: false,
  })
  loanCharges: LoanCharge[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

