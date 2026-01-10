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
}

