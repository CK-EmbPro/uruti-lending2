import {
  IsString,
  IsNumber,
  IsEnum,
  IsDateString,
  IsOptional,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ApplicantType } from '../../../common/enums/applicant-type.enum';
import { ApplicationStatus } from '../entities/loan-application.entity';

export class CreateLoanApplicationDto {
  @ApiProperty({ description: 'Company ID', example: 'company-uuid' })
  @IsString()
  companyId: string;

  @ApiProperty({ description: 'Type of applicant', enum: ApplicantType, example: ApplicantType.CUSTOMER })
  @IsEnum(ApplicantType)
  applicantType: ApplicantType;

  @ApiProperty({ description: 'Applicant ID', example: 'customer-uuid' })
  @IsString()
  applicantId: string;

  @ApiProperty({ description: 'Loan product ID', example: 'product-uuid' })
  @IsString()
  loanProductId: string;

  @ApiProperty({ description: 'Requested loan amount', example: 100000, minimum: 0 })
  @IsNumber()
  @Min(0)
  requestedAmount: number;

  @ApiPropertyOptional({ description: 'Application remarks', example: 'For business expansion' })
  @IsString()
  @IsOptional()
  remarks?: string;

  @ApiPropertyOptional({ description: 'Application date (ISO 8601)', example: '2024-01-01' })
  @IsDateString()
  @IsOptional()
  applicationDate?: string;

  @ApiPropertyOptional({
    description: 'Repayment structure selected by borrower',
    enum: ['FIXED', 'GRADUATED', 'SEASONAL', 'BULLET'],
    example: 'FIXED',
  })
  @IsString()
  @IsOptional()
  repaymentStructure?: string;

  @ApiPropertyOptional({ description: 'Initial status of the application', enum: ApplicationStatus })
  @IsEnum(ApplicationStatus)
  @IsOptional()
  status?: ApplicationStatus;

  @ApiProperty({ description: 'Full name of the applicant' })
  @IsString()
  fullName: string;

  @ApiProperty({ description: 'Email of the applicant' })
  @IsString()
  email: string;

  @ApiProperty({ description: 'Phone number of the applicant' })
  @IsString()
  phoneNumber: string;

  @ApiProperty({ description: 'Date of birth of the applicant' })
  @IsDateString()
  dateOfBirth: string;

  @ApiProperty({ description: 'Address of the applicant' })
  @IsString()
  address: string;

  @ApiPropertyOptional({ description: 'Annual income of the applicant' })
  @IsNumber()
  @Min(0)
  @IsOptional()
  annualIncome?: number;

  @ApiPropertyOptional({ description: 'Employment status of the applicant' })
  @IsString()
  @IsOptional()
  employmentStatus?: string;
}

