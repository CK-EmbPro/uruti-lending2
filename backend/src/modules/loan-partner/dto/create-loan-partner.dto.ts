import {
  IsString,
  IsNumber,
  IsDateString,
  IsEnum,
  IsBoolean,
  IsOptional,
  IsArray,
  ValidateNested,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  FldgType,
  FldgLimitCalculationComponent,
  RepaymentScheduleType,
  OrganizationType,
} from '../entities/loan-partner.entity';
import { CreateLoanPartnerShareableDto } from './create-loan-partner-shareable.dto';

export class CreateLoanPartnerDto {
  @ApiProperty({ description: 'Partner code (unique)', example: 'PARTNER001' })
  @IsString()
  partnerCode: string;

  @ApiProperty({ description: 'Partner name', example: 'ABC Co-Lending Partner' })
  @IsString()
  partnerName: string;

  @ApiProperty({
    description: 'Partner loan share percentage (1-99)',
    example: 30,
    minimum: 1,
    maximum: 99,
  })
  @IsNumber()
  @Min(1)
  @Max(99)
  partnerLoanSharePercentage: number;

  @ApiProperty({
    description: 'Partner base interest rate',
    example: 8.5,
  })
  @IsNumber()
  partnerBaseInterestRate: number;

  @ApiProperty({ description: 'Effective date', example: '2024-01-01' })
  @IsDateString()
  effectiveDate: string;

  // FLDG Configuration
  @ApiPropertyOptional({
    description: 'FLDG trigger DPD threshold',
    example: 90,
  })
  @IsOptional()
  @IsNumber()
  fldgTriggerDpd?: number;

  @ApiPropertyOptional({
    description: 'FLDG limit calculation component',
    enum: FldgLimitCalculationComponent,
  })
  @IsOptional()
  @IsEnum(FldgLimitCalculationComponent)
  fldgLimitCalculationComponent?: FldgLimitCalculationComponent;

  @ApiPropertyOptional({
    description: 'Type of FLDG applicable',
    enum: FldgType,
  })
  @IsOptional()
  @IsEnum(FldgType)
  typeOfFldgApplicable?: FldgType;

  @ApiPropertyOptional({
    description: 'FLDG fixed deposit percentage (1-99)',
    example: 10,
    minimum: 1,
    maximum: 99,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(99)
  fldgFixedDepositPercentage?: number;

  @ApiPropertyOptional({
    description: 'FLDG corporate guarantee percentage (1-99)',
    example: 5,
    minimum: 1,
    maximum: 99,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(99)
  fldgCorporateGuaranteePercentage?: number;

  // Repayment Schedule Type
  @ApiPropertyOptional({
    description: 'Repayment schedule type',
    enum: RepaymentScheduleType,
    default: RepaymentScheduleType.EMI_PMT_BASED,
  })
  @IsOptional()
  @IsEnum(RepaymentScheduleType)
  repaymentScheduleType?: RepaymentScheduleType;

  // Organization Type
  @ApiPropertyOptional({
    description: 'Organization type',
    enum: OrganizationType,
  })
  @IsOptional()
  @IsEnum(OrganizationType)
  organizationType?: OrganizationType;

  // Accounting Accounts
  @ApiPropertyOptional({ description: 'Payable account' })
  @IsOptional()
  @IsString()
  payableAccount?: string;

  @ApiPropertyOptional({ description: 'Receivable account' })
  @IsOptional()
  @IsString()
  receivableAccount?: string;

  @ApiPropertyOptional({ description: 'Credit account' })
  @IsOptional()
  @IsString()
  creditAccount?: string;

  @ApiPropertyOptional({ description: 'FLDG account' })
  @IsOptional()
  @IsString()
  fldgAccount?: string;

  @ApiPropertyOptional({ description: 'Partner interest share account' })
  @IsOptional()
  @IsString()
  partnerInterestShare?: string;

  @ApiPropertyOptional({ description: 'Enable partner accounting', default: false })
  @IsOptional()
  @IsBoolean()
  enablePartnerAccounting?: boolean;

  // Options
  @ApiPropertyOptional({ description: 'Servicer fee', default: false })
  @IsOptional()
  @IsBoolean()
  servicerFee?: boolean;

  @ApiPropertyOptional({ description: 'Restructure of loans applicable', default: false })
  @IsOptional()
  @IsBoolean()
  restructureOfLoansApplicable?: boolean;

  @ApiPropertyOptional({ description: 'Waiving of charges applicable', default: false })
  @IsOptional()
  @IsBoolean()
  waivingOfChargesApplicable?: boolean;

  @ApiPropertyOptional({ description: 'Partial payment mechanism' })
  @IsOptional()
  @IsString()
  partialPaymentMechanism?: string;

  // Shareables
  @ApiPropertyOptional({
    description: 'Loan partner shareables',
    type: [CreateLoanPartnerShareableDto],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateLoanPartnerShareableDto)
  shareables?: CreateLoanPartnerShareableDto[];
}

