import { IsString, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ApplicantType } from '../../../common/enums/applicant-type.enum';

export class CheckDuplicateCustomerDto {
  @ApiProperty({ description: 'Applicant type', enum: ApplicantType, example: ApplicantType.CUSTOMER })
  @IsEnum(ApplicantType)
  applicantType: ApplicantType;

  @ApiPropertyOptional({ description: 'Customer name', example: 'John Doe' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ description: 'Email address', example: 'john.doe@example.com' })
  @IsString()
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({ description: 'Phone number', example: '+1234567890' })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiPropertyOptional({ description: 'PAN number', example: 'ABCDE1234F' })
  @IsString()
  @IsOptional()
  pan?: string;

  @ApiPropertyOptional({ description: 'Aadhaar number', example: '123456789012' })
  @IsString()
  @IsOptional()
  aadhaar?: string;

  @ApiPropertyOptional({ description: 'Company ID to filter duplicates within', example: 'company-uuid' })
  @IsString()
  @IsOptional()
  companyId?: string;
}

