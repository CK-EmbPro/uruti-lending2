import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum } from 'class-validator';
import { ApplicantType } from '../../../common/enums/applicant-type.enum';

export class PrefillApplicationDto {
  @ApiProperty({ description: 'Applicant ID (customer/employee ID)', example: 'uuid' })
  @IsString()
  applicantId: string;

  @ApiProperty({ description: 'Applicant type', enum: ApplicantType })
  @IsEnum(ApplicantType)
  applicantType: ApplicantType;

  @ApiPropertyOptional({ description: 'Loan product ID (if known)', example: 'uuid' })
  @IsOptional()
  @IsString()
  loanProductId?: string;

  @ApiPropertyOptional({ description: 'Email address (for customer lookup)', example: 'customer@example.com' })
  @IsOptional()
  @IsString()
  email?: string;

  @ApiPropertyOptional({ description: 'Phone number (for customer lookup)', example: '+1234567890' })
  @IsOptional()
  @IsString()
  phoneNumber?: string;
}

export class PrefillResultDto {
  @ApiProperty({ description: 'Prefilled application data' })
  applicationData: {
    applicantId?: string;
    applicantType?: ApplicantType;
    loanProductId?: string;
    requestedAmount?: number;
    remarks?: string;
    applicantEmailAddress?: string;
    applicantPhoneNumber?: string;
    [key: string]: any;
  };

  @ApiProperty({ description: 'Fields that were pre-filled', type: [String] })
  filledFields: string[];

  @ApiProperty({ description: 'Confidence score (0-1) for pre-filled data', example: 0.85 })
  confidenceScore: number;

  @ApiProperty({ description: 'Source of pre-filled data', example: 'Previous Application' })
  dataSource: string;

  @ApiProperty({ description: 'Suggestions for user', type: [String] })
  suggestions: string[];
}

