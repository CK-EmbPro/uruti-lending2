import { IsDateString, IsOptional, IsString, IsEnum, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ConsentType, ConsentStatus } from '../entities/privacy-consent.entity';
import { RequestType, RequestStatus } from '../entities/privacy-consent.entity';

export class CreateConsentDto {
  @ApiPropertyOptional({ description: 'Application ID' })
  @IsString()
  @IsOptional()
  applicationId?: string;

  @ApiPropertyOptional({ description: 'Customer ID' })
  @IsString()
  @IsOptional()
  customerId?: string;

  @ApiProperty({
    description: 'Consent type',
    enum: ConsentType,
  })
  @IsEnum(ConsentType)
  consentType: ConsentType;

  @ApiProperty({ description: 'Consent status', enum: ConsentStatus })
  @IsEnum(ConsentStatus)
  status: ConsentStatus;

  @ApiPropertyOptional({ description: 'Consent text' })
  @IsString()
  @IsOptional()
  consentText?: string;

  @ApiPropertyOptional({ description: 'Explicit consent', default: false })
  @IsBoolean()
  @IsOptional()
  explicitConsent?: boolean;
}

export class WithdrawConsentDto {
  @ApiProperty({ description: 'Withdrawal reason' })
  @IsString()
  withdrawalReason: string;
}

export class CreatePrivacyRequestDto {
  @ApiProperty({ description: 'Customer ID' })
  @IsString()
  customerId: string;

  @ApiProperty({
    description: 'Request type',
    enum: RequestType,
  })
  @IsEnum(RequestType)
  requestType: RequestType;

  @ApiProperty({ description: 'Request description' })
  @IsString()
  description: string;

  @ApiPropertyOptional({ description: 'Request details' })
  @IsString()
  @IsOptional()
  requestDetails?: string;
}

export class ProcessPrivacyRequestDto {
  @ApiProperty({ description: 'Processing notes' })
  @IsString()
  processingNotes: string;

  @ApiPropertyOptional({ description: 'Response data (for access/portability requests)' })
  @IsString()
  @IsOptional()
  responseData?: string;
}

export class CompletePrivacyRequestDto {
  @ApiPropertyOptional({ description: 'Remarks' })
  @IsString()
  @IsOptional()
  remarks?: string;
}

export class RejectPrivacyRequestDto {
  @ApiProperty({ description: 'Rejection reason' })
  @IsString()
  rejectionReason: string;
}

