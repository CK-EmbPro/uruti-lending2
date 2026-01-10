import { IsString, IsOptional, IsEnum, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum VerificationAction {
  APPROVE = 'approve',
  REJECT = 'reject',
  REQUEST_INFO = 'request_info',
}

export class VerifyLoanLinkDto {
  @ApiProperty({ 
    description: 'Verification action', 
    enum: VerificationAction,
    example: VerificationAction.APPROVE 
  })
  @IsEnum(VerificationAction)
  action: VerificationAction;

  @ApiProperty({ 
    description: 'Admin comments or notes', 
    required: false 
  })
  @IsOptional()
  @IsString()
  comments?: string;

  @ApiProperty({ 
    description: 'Verification method used', 
    required: false,
    example: 'MANUAL_REVIEW' 
  })
  @IsOptional()
  @IsString()
  verificationMethod?: string;
}

