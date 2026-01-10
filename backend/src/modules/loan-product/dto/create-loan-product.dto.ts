import {
  IsString,
  IsNumber,
  IsEnum,
  IsBoolean,
  IsOptional,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { RepaymentScheduleType } from '../../../common/enums/repayment-schedule-type.enum';

export class CreateLoanProductDto {
  @ApiProperty({ description: 'Unique product code', example: 'PL-001' })
  @IsString()
  productCode: string;

  @ApiProperty({ description: 'Product name', example: 'Personal Loan' })
  @IsString()
  productName: string;

  @ApiProperty({ description: 'Company ID', example: 'company-uuid' })
  @IsString()
  companyId: string;

  @ApiProperty({ description: 'Rate of interest (percentage)', example: 12.5, minimum: 0 })
  @IsNumber()
  @Min(0)
  rateOfInterest: number;

  @ApiPropertyOptional({ description: 'Penalty interest rate (percentage)', example: 2.0, minimum: 0 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  penaltyInterestRate?: number;

  @ApiPropertyOptional({ description: 'Maximum loan amount', example: 1000000, minimum: 0 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  maximumLoanAmount?: number;

  @ApiPropertyOptional({ description: 'Whether this is a term loan', example: true, default: false })
  @IsBoolean()
  @IsOptional()
  isTermLoan?: boolean;

  @ApiPropertyOptional({ description: 'Repayment schedule type', enum: RepaymentScheduleType, example: RepaymentScheduleType.MONTHLY_AS_PER_START_DATE })
  @IsEnum(RepaymentScheduleType)
  @IsOptional()
  repaymentScheduleType?: RepaymentScheduleType;

  @ApiPropertyOptional({ description: 'Cyclic day of the month for repayments', example: 15, minimum: 1, maximum: 31 })
  @IsNumber()
  @IsOptional()
  cyclicDayOfTheMonth?: number;

  @ApiPropertyOptional({ description: 'Minimum days between disbursement and first repayment', example: 30, minimum: 0 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  minDaysBwDisbursementFirstRepayment?: number;

  @ApiPropertyOptional({ description: 'Days past due threshold for NPA classification', example: 90, minimum: 0 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  daysPastDueThresholdForNpa?: number;

  @ApiPropertyOptional({ description: 'Grace period in days', example: 0, minimum: 0 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  gracePeriodInDays?: number;

  // Account references
  @ApiProperty({ description: 'Disbursement account', example: 'ACC-001' })
  @IsString()
  disbursementAccount: string;

  @ApiProperty({ description: 'Payment account', example: 'ACC-002' })
  @IsString()
  paymentAccount: string;

  @ApiProperty({ description: 'Loan account', example: 'ACC-003' })
  @IsString()
  loanAccount: string;

  @ApiProperty({ description: 'Interest income account', example: 'ACC-004' })
  @IsString()
  interestIncomeAccount: string;

  @ApiProperty({ description: 'Penalty income account', example: 'ACC-005' })
  @IsString()
  penaltyIncomeAccount: string;

  @ApiProperty({ description: 'Interest accrued account', example: 'ACC-006' })
  @IsString()
  interestAccruedAccount: string;

  @ApiProperty({ description: 'Interest receivable account', example: 'ACC-007' })
  @IsString()
  interestReceivableAccount: string;

  @ApiProperty({ description: 'Penalty accrued account', example: 'ACC-008' })
  @IsString()
  penaltyAccruedAccount: string;

  @ApiProperty({ description: 'Penalty receivable account', example: 'ACC-009' })
  @IsString()
  penaltyReceivableAccount: string;

  @ApiProperty({ description: 'Security deposit account', example: 'ACC-010' })
  @IsString()
  securityDepositAccount: string;

  @ApiProperty({ description: 'Customer refund account', example: 'ACC-011' })
  @IsString()
  customerRefundAccount: string;

  @ApiProperty({ description: 'Write-off account', example: 'ACC-012' })
  @IsString()
  writeOffAccount: string;

  @ApiProperty({ description: 'Write-off recovery account', example: 'ACC-013' })
  @IsString()
  writeOffRecoveryAccount: string;

  @ApiProperty({ description: 'Interest waiver account', example: 'ACC-014' })
  @IsString()
  interestWaiverAccount: string;

  @ApiProperty({ description: 'Penalty waiver account', example: 'ACC-015' })
  @IsString()
  penaltyWaiverAccount: string;

  @ApiPropertyOptional({ description: 'Product description', example: 'A flexible personal loan product for individuals' })
  @IsString()
  @IsOptional()
  productDescription?: string;

  @ApiPropertyOptional({ description: 'Terms and conditions (HTML or plain text)', example: '1. Borrower must be 18+ years old\n2. Minimum income requirement...' })
  @IsString()
  @IsOptional()
  termsAndConditions?: string;

  // Eligibility Criteria
  @ApiPropertyOptional({ description: 'Minimum loan amount', example: 5000 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  minimumLoanAmount?: number;

  @ApiPropertyOptional({ description: 'Minimum term in months', example: 12 })
  @IsNumber()
  @Min(1)
  @IsOptional()
  minimumTerm?: number;

  @ApiPropertyOptional({ description: 'Maximum term in months', example: 60 })
  @IsNumber()
  @Min(1)
  @IsOptional()
  maximumTerm?: number;

  @ApiPropertyOptional({ description: 'Minimum age', example: 18 })
  @IsNumber()
  @Min(18)
  @IsOptional()
  minimumAge?: number;

  @ApiPropertyOptional({ description: 'Maximum age', example: 65 })
  @IsNumber()
  @Min(18)
  @IsOptional()
  maximumAge?: number;

  @ApiPropertyOptional({ description: 'Minimum monthly income', example: 2000 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  minimumMonthlyIncome?: number;

  @ApiPropertyOptional({ description: 'Minimum annual income', example: 24000 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  minimumAnnualIncome?: number;

  @ApiPropertyOptional({ description: 'Minimum credit score', example: 650 })
  @IsNumber()
  @Min(300)
  @IsOptional()
  minimumCreditScore?: number;

  @ApiPropertyOptional({ description: 'Maximum debt-to-income ratio (%)', example: 40 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  maximumDebtToIncomeRatio?: number;

  @ApiPropertyOptional({ description: 'Employment types', example: ['Salaried', 'Self-Employed'] })
  @IsOptional()
  employmentTypes?: string[];

  @ApiPropertyOptional({ description: 'Required documents', example: ['ID Proof', 'Address Proof', 'Income Proof'] })
  @IsOptional()
  requiredDocuments?: string[];

  @ApiPropertyOptional({ description: 'Eligible countries (ISO codes)', example: ['US', 'CA'] })
  @IsOptional()
  eligibleCountries?: string[];

  @ApiPropertyOptional({ description: 'Eligible regions/states', example: ['CA', 'NY', 'TX'] })
  @IsOptional()
  eligibleRegions?: string[];

  @ApiPropertyOptional({ description: 'Requires collateral', example: false })
  @IsBoolean()
  @IsOptional()
  requiresCollateral?: boolean;

  @ApiPropertyOptional({ description: 'Collateral requirements description' })
  @IsString()
  @IsOptional()
  collateralRequirements?: string;

  // Marketing & Audience-Facing Content
  @ApiPropertyOptional({ description: 'Product tagline', example: 'Your financial freedom starts here' })
  @IsString()
  @IsOptional()
  productTagline?: string;

  @ApiPropertyOptional({ description: 'Short description for listings', example: 'Flexible personal loans with competitive rates' })
  @IsString()
  @IsOptional()
  shortDescription?: string;

  @ApiPropertyOptional({ description: 'Product highlights', example: ['Quick Approval', 'Low Interest Rates'] })
  @IsOptional()
  productHighlights?: string[];

  @ApiPropertyOptional({ description: 'Key features', example: ['No Prepayment Charges', 'Online Application'] })
  @IsOptional()
  keyFeatures?: string[];

  @ApiPropertyOptional({ description: 'Benefits list', example: ['Flexible repayment', 'Quick disbursement'] })
  @IsOptional()
  benefits?: string[];

  @ApiPropertyOptional({ description: 'Target audience description' })
  @IsString()
  @IsOptional()
  targetAudience?: string;

  @ApiPropertyOptional({ description: 'How it works description' })
  @IsString()
  @IsOptional()
  howItWorks?: string;

  @ApiPropertyOptional({ description: 'FAQs', example: [{ question: 'What is the interest rate?', answer: 'Starting from 12.5%' }] })
  @IsOptional()
  faqs?: Array<{ question: string; answer: string }>;

  @ApiPropertyOptional({ description: 'Product image URLs' })
  @IsOptional()
  productImages?: string[];

  @ApiPropertyOptional({ description: 'Promotional banner URL' })
  @IsString()
  @IsOptional()
  promotionalBannerUrl?: string;

  @ApiPropertyOptional({ description: 'Product icon URL' })
  @IsString()
  @IsOptional()
  productIconUrl?: string;

  // Product Options
  @ApiPropertyOptional({ description: 'Allows prepayment', example: true })
  @IsBoolean()
  @IsOptional()
  allowsPrepayment?: boolean;

  @ApiPropertyOptional({ description: 'Allows partial prepayment', example: true })
  @IsBoolean()
  @IsOptional()
  allowsPartialPrepayment?: boolean;

  @ApiPropertyOptional({ description: 'Allows refinancing', example: false })
  @IsBoolean()
  @IsOptional()
  allowsRefinancing?: boolean;

  @ApiPropertyOptional({ description: 'Allows top-up', example: false })
  @IsBoolean()
  @IsOptional()
  allowsTopUp?: boolean;

  @ApiPropertyOptional({ description: 'Prepayment charges (%)', example: 0 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  prepaymentCharges?: number;

  // Processing
  @ApiPropertyOptional({ description: 'Average processing time (days)', example: 3 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  averageProcessingTime?: number;

  @ApiPropertyOptional({ description: 'Average disbursement time (days)', example: 5 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  averageDisbursementTime?: number;

  @ApiPropertyOptional({ description: 'Processing time description', example: 'Approval within 24 hours' })
  @IsString()
  @IsOptional()
  processingTimeDescription?: string;

  // Classification
  @ApiPropertyOptional({ description: 'Loan category', example: 'Personal' })
  @IsString()
  @IsOptional()
  loanCategory?: string;

  @ApiPropertyOptional({ description: 'Product type', example: 'Unsecured' })
  @IsString()
  @IsOptional()
  productType?: string;

  @ApiPropertyOptional({ description: 'Use cases', example: ['Debt Consolidation', 'Home Improvement'] })
  @IsOptional()
  useCases?: string[];

  @ApiPropertyOptional({ description: 'Competitive advantages' })
  @IsOptional()
  competitiveAdvantages?: string[];

  @ApiPropertyOptional({ description: 'Comparison notes' })
  @IsString()
  @IsOptional()
  comparisonNotes?: string;

  @ApiPropertyOptional({ description: 'Application requirements description' })
  @IsString()
  @IsOptional()
  applicationRequirements?: string;

  @ApiPropertyOptional({ description: 'Minimum employment duration (months)', example: 6 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  minimumEmploymentDuration?: number;

  @ApiPropertyOptional({ description: 'Requires co-applicant', example: false })
  @IsBoolean()
  @IsOptional()
  requiresCoApplicant?: boolean;

  @ApiPropertyOptional({ description: 'Requires guarantor', example: false })
  @IsBoolean()
  @IsOptional()
  requiresGuarantor?: boolean;
}

