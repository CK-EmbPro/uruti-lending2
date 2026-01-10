import {
  IsString,
  IsNumber,
  IsEnum,
  IsDateString,
  IsBoolean,
  IsOptional,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ApplicantType } from '../../../common/enums/applicant-type.enum';
import { RepaymentFrequency } from '../../../common/enums/repayment-frequency.enum';
import { RepaymentScheduleType } from '../../../common/enums/repayment-schedule-type.enum';
import { MoratoriumType } from '../../../common/enums/moratorium-type.enum';
import { InterestTreatment } from '../../../common/enums/interest-treatment.enum';

export class CreateLoanDto {
  @ApiProperty({ description: 'Unique loan number', example: 'LOAN-2024-001' })
  @IsString()
  loanNumber: string;

  @ApiProperty({ description: 'Company ID', example: 'company-uuid' })
  @IsString()
  companyId: string;

  @ApiProperty({ description: 'Type of applicant', enum: ApplicantType, example: ApplicantType.CUSTOMER })
  @IsEnum(ApplicantType)
  applicantType: ApplicantType;

  @ApiProperty({ description: 'Applicant ID (Customer or Company)', example: 'customer-uuid' })
  @IsString()
  applicantId: string;

  @ApiProperty({ description: 'Loan product ID', example: 'product-uuid' })
  @IsString()
  loanProductId: string;

  @ApiProperty({ description: 'Loan amount', example: 100000, minimum: 0 })
  @IsNumber()
  @Min(0)
  loanAmount: number;

  @ApiPropertyOptional({ description: 'Rate of interest (percentage)', example: 12.5, minimum: 0 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  rateOfInterest?: number;

  @ApiPropertyOptional({ description: 'Penalty interest rate (percentage)', example: 2.0, minimum: 0 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  penaltyInterestRate?: number;

  @ApiPropertyOptional({ description: 'Number of repayment periods', example: 12 })
  @IsNumber()
  @IsOptional()
  repaymentPeriods?: number;

  @ApiPropertyOptional({ description: 'Repayment frequency', enum: RepaymentFrequency, example: RepaymentFrequency.MONTHLY })
  @IsEnum(RepaymentFrequency)
  @IsOptional()
  repaymentFrequency?: RepaymentFrequency;

  @ApiPropertyOptional({ description: 'Repayment method', example: 'Cash' })
  @IsString()
  @IsOptional()
  repaymentMethod?: string;

  @ApiPropertyOptional({ description: 'Repayment start date (ISO 8601)', example: '2024-01-15' })
  @IsDateString()
  @IsOptional()
  repaymentStartDate?: string;

  @ApiPropertyOptional({ description: 'Repayment schedule type', enum: RepaymentScheduleType, example: RepaymentScheduleType.MONTHLY_AS_PER_START_DATE })
  @IsEnum(RepaymentScheduleType)
  @IsOptional()
  repaymentScheduleType?: RepaymentScheduleType;

  @ApiPropertyOptional({ description: 'Repayment structure selected by borrower', enum: ['FIXED', 'GRADUATED', 'SEASONAL', 'BULLET'], example: 'FIXED' })
  @IsString()
  @IsOptional()
  repaymentStructure?: string;

  @ApiPropertyOptional({ description: 'Whether this is a term loan', example: true, default: false })
  @IsBoolean()
  @IsOptional()
  isTermLoan?: boolean;

  @ApiPropertyOptional({ description: 'Whether this is a secured loan', example: false, default: false })
  @IsBoolean()
  @IsOptional()
  isSecuredLoan?: boolean;

  @ApiProperty({ description: 'Posting date (ISO 8601)', example: '2024-01-01' })
  @IsDateString()
  postingDate: string;

  @ApiPropertyOptional({ description: 'Cost center', example: 'CC-001' })
  @IsString()
  @IsOptional()
  costCenter?: string;

  @ApiPropertyOptional({ description: 'Moratorium tenure (number of months)', example: 3, minimum: 0 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  moratoriumTenure?: number;

  @ApiPropertyOptional({ description: 'Moratorium type', enum: MoratoriumType, example: MoratoriumType.EMI })
  @IsEnum(MoratoriumType)
  @IsOptional()
  moratoriumType?: MoratoriumType;

  @ApiPropertyOptional({ description: 'Interest treatment during moratorium', enum: InterestTreatment, example: InterestTreatment.CAPITALIZE })
  @IsEnum(InterestTreatment)
  @IsOptional()
  interestTreatmentDuringMoratorium?: InterestTreatment;
}

