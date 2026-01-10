import {
  IsString,
  IsOptional,
  IsArray,
  ValidateNested,
  IsEnum,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ApplicantType } from '../../../common/enums/applicant-type.enum';
import { CreatePledgeDto } from './create-pledge.dto';

export class CreateLoanSecurityAssignmentDto {
  @ApiPropertyOptional({ description: 'Loan ID', example: 'loan-uuid' })
  @IsString()
  @IsOptional()
  loanId?: string;

  @ApiPropertyOptional({ description: 'Loan Application ID', example: 'application-uuid' })
  @IsString()
  @IsOptional()
  loanApplicationId?: string;

  @ApiProperty({ description: 'Applicant Type', enum: ApplicantType, example: ApplicantType.CUSTOMER })
  @IsEnum(ApplicantType)
  applicantType: ApplicantType;

  @ApiProperty({ description: 'Applicant ID', example: 'applicant-uuid' })
  @IsString()
  applicantId: string;

  @ApiProperty({ description: 'Company ID', example: 'company-uuid' })
  @IsString()
  companyId: string;

  @ApiProperty({ description: 'List of securities to pledge', type: [CreatePledgeDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreatePledgeDto)
  pledges: CreatePledgeDto[];

  @ApiPropertyOptional({ description: 'Reference number', example: 'REF-12345' })
  @IsString()
  @IsOptional()
  referenceNo?: string;

  @ApiPropertyOptional({ description: 'Description', example: 'Property pledge for home loan' })
  @IsString()
  @IsOptional()
  description?: string;
}

