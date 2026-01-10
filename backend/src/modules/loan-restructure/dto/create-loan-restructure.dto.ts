import {
  IsString,
  IsNumber,
  IsEnum,
  IsDateString,
  IsBoolean,
  IsOptional,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  RestructureType,
  InterestTreatment,
} from '../../../common/enums/restructure-type.enum';

export class CreateLoanRestructureDto {
  @ApiProperty({ description: 'Loan ID', example: 'loan-uuid' })
  @IsString()
  loanId: string;

  @ApiProperty({
    description: 'Restructure type',
    enum: RestructureType,
    example: RestructureType.NORMAL_RESTRUCTURE,
  })
  @IsEnum(RestructureType)
  restructureType: RestructureType;

  @ApiProperty({
    description: 'Restructure date (ISO 8601)',
    example: '2024-01-15T00:00:00Z',
  })
  @IsDateString()
  restructureDate: string;

  @ApiPropertyOptional({
    description: 'Reason for restructure',
    example: 'Borrower facing financial difficulties',
  })
  @IsString()
  @IsOptional()
  reasonForRestructure?: string;

  // Principal adjustments
  @ApiPropertyOptional({
    description: 'Principal amount to adjust',
    example: 0,
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  @IsOptional()
  principalAdjusted?: number;

  // Interest adjustments
  @ApiPropertyOptional({
    description: 'Interest amount to adjust',
    example: 0,
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  @IsOptional()
  adjustedInterestAmount?: number;

  @ApiPropertyOptional({
    description: 'Unaccrued interest to adjust',
    example: 0,
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  @IsOptional()
  adjustedUnaccruedInterest?: number;

  @ApiPropertyOptional({
    description: 'Interest waiver amount',
    example: 0,
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  @IsOptional()
  interestWaiverAmount?: number;

  @ApiPropertyOptional({
    description: 'Unaccrued interest waiver',
    example: 0,
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  @IsOptional()
  unaccruedInterestWaiver?: number;

  // Penalty adjustments
  @ApiPropertyOptional({
    description: 'Penalty interest waiver',
    example: 0,
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  @IsOptional()
  penalInterestWaiver?: number;

  // Charges adjustments
  @ApiPropertyOptional({
    description: 'Other charges waiver',
    example: 0,
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  @IsOptional()
  otherChargesWaiver?: number;

  // Treatment options
  @ApiPropertyOptional({
    description: 'Treatment of normal interest',
    enum: InterestTreatment,
    example: InterestTreatment.CAPITALIZE,
  })
  @IsEnum(InterestTreatment)
  @IsOptional()
  treatmentOfNormalInterest?: InterestTreatment;

  @ApiPropertyOptional({
    description: 'Treatment of unaccrued interest',
    enum: InterestTreatment,
    example: InterestTreatment.CAPITALIZE,
  })
  @IsEnum(InterestTreatment)
  @IsOptional()
  unaccruedInterestTreatment?: InterestTreatment;

  @ApiPropertyOptional({
    description: 'Treatment of penal interest',
    enum: InterestTreatment,
    example: InterestTreatment.CAPITALIZE,
  })
  @IsEnum(InterestTreatment)
  @IsOptional()
  treatmentOfPenalInterest?: InterestTreatment;

  @ApiPropertyOptional({
    description: 'Treatment of other charges',
    enum: InterestTreatment,
    example: InterestTreatment.CAPITALIZE,
  })
  @IsEnum(InterestTreatment)
  @IsOptional()
  treatmentOfOtherCharges?: InterestTreatment;

  // New loan details
  @ApiPropertyOptional({
    description: 'New rate of interest (percentage)',
    example: 12.5,
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  @IsOptional()
  newRateOfInterest?: number;

  @ApiPropertyOptional({
    description: 'New repayment start date (ISO 8601)',
    example: '2024-02-01',
  })
  @IsDateString()
  @IsOptional()
  repaymentStartDate?: string;

  @ApiPropertyOptional({
    description: 'New repayment method',
    example: 'Repay Over Number of Periods',
  })
  @IsString()
  @IsOptional()
  newRepaymentMethod?: string;

  @ApiPropertyOptional({
    description: 'New repayment period in months',
    example: 24,
    minimum: 1,
  })
  @IsNumber()
  @Min(1)
  @IsOptional()
  newRepaymentPeriodInMonths?: number;

  @ApiPropertyOptional({
    description: 'New monthly repayment amount',
    example: 5000,
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  @IsOptional()
  newMonthlyRepaymentAmount?: number;

  // Restructure charges
  @ApiPropertyOptional({
    description: 'Restructure charges',
    example: 0,
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  @IsOptional()
  restructureCharges?: number;

  @ApiPropertyOptional({
    description: 'Waive off restructure charges',
    example: false,
  })
  @IsBoolean()
  @IsOptional()
  waiveOffRestructureCharges?: boolean;

  // Watch period
  @ApiPropertyOptional({
    description: 'Watch period end date (ISO 8601)',
    example: '2024-07-01',
  })
  @IsDateString()
  @IsOptional()
  watchPeriodEndDate?: string;
}

