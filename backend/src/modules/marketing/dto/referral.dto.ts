import { IsString, IsOptional, IsDateString, IsObject, IsNumber, IsBoolean } from 'class-validator';
import { ReferralStatus } from '../../../common/enums/referral-status.enum';

export class CreateReferralDto {
  @IsString()
  referrerId: string;

  @IsString()
  referredCustomerId: string;

  @IsOptional()
  @IsString()
  referralCode?: string; // Auto-generated if not provided

  @IsOptional()
  @IsString()
  referralProgramId?: string;

  @IsOptional()
  @IsObject()
  programTerms?: Record<string, any>;

  @IsOptional()
  @IsString()
  remarks?: string;
}

export class UpdateReferralStatusDto {
  @IsString()
  status: string; // ReferralStatus enum value

  @IsOptional()
  @IsString()
  applicationId?: string;

  @IsOptional()
  @IsString()
  loanId?: string;

  @IsOptional()
  @IsDateString()
  applicationDate?: string;

  @IsOptional()
  @IsDateString()
  approvalDate?: string;

  @IsOptional()
  @IsDateString()
  disbursementDate?: string;

  @IsOptional()
  @IsDateString()
  completionDate?: string;

  @IsOptional()
  @IsString()
  remarks?: string;
}

export class CreditReferralBonusDto {
  @IsNumber()
  bonusAmount: number;

  @IsString()
  bonusType: string; // 'Fixed Amount', 'Percentage', 'Tiered'

  @IsOptional()
  @IsString()
  creditNotes?: string;

  @IsOptional()
  @IsString()
  remarks?: string;
}

export class QueryReferralsDto {
  @IsOptional()
  @IsString()
  referrerId?: string;

  @IsOptional()
  @IsString()
  referredCustomerId?: string;

  @IsOptional()
  @IsString()
  status?: string; // ReferralStatus enum value

  @IsOptional()
  @IsBoolean()
  bonusCredited?: boolean;
}

export class QueryReferralBonusesDto {
  @IsOptional()
  @IsString()
  referralId?: string;

  @IsOptional()
  @IsString()
  status?: string; // 'Pending', 'Approved', 'Credited', 'Cancelled'

  @IsOptional()
  @IsString()
  bonusType?: string; // 'Fixed Amount', 'Percentage', 'Tiered'
}

export class UpdateReferralBonusStatusDto {
  @IsString()
  status: string; // 'Pending', 'Approved', 'Credited', 'Cancelled'

  @IsOptional()
  @IsString()
  creditNotes?: string;

  @IsOptional()
  @IsString()
  remarks?: string;
}

