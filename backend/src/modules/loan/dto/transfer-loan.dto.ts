import { IsString, IsEnum, IsOptional, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ApplicantType } from '../../../common/enums/applicant-type.enum';

export class TransferLoanDto {
  @ApiProperty({ description: 'New applicant type', enum: ApplicantType, example: ApplicantType.CUSTOMER })
  @IsEnum(ApplicantType)
  newApplicantType: ApplicantType;

  @ApiProperty({ description: 'New applicant ID', example: 'new-customer-uuid' })
  @IsString()
  newApplicantId: string;

  @ApiPropertyOptional({ description: 'Transfer date (ISO 8601)', example: '2024-01-15' })
  @IsDateString()
  @IsOptional()
  transferDate?: string;

  @ApiPropertyOptional({ description: 'Reference number', example: 'TRF-2024-001' })
  @IsString()
  @IsOptional()
  referenceNumber?: string;

  @ApiPropertyOptional({ description: 'Remarks', example: 'Loan transferred due to customer merger' })
  @IsString()
  @IsOptional()
  remarks?: string;
}

