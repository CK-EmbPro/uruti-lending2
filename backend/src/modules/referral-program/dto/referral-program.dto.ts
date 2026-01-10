import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNumber, IsOptional, IsEmail, IsEnum, Min, Max } from 'class-validator';

export enum ReferralStatus {
  PENDING = 'PENDING',
  SIGNED_UP = 'SIGNED_UP',
  APPLICATION_SUBMITTED = 'APPLICATION_SUBMITTED',
  LOAN_APPROVED = 'LOAN_APPROVED',
  LOAN_DISBURSED = 'LOAN_DISBURSED',
  REWARDED = 'REWARDED',
  EXPIRED = 'EXPIRED',
}

export class CreateReferralDto {
  @ApiProperty({ description: 'Referrer customer ID', example: 'uuid' })
  @IsString()
  referrerId: string;

  @ApiProperty({ description: 'Referred email', example: 'friend@example.com' })
  @IsEmail()
  referredEmail: string;

  @ApiPropertyOptional({ description: 'Referred phone', example: '+1234567890' })
  @IsOptional()
  @IsString()
  referredPhone?: string;

  @ApiPropertyOptional({ description: 'Referral code (auto-generated if not provided)', example: 'REF123456' })
  @IsOptional()
  @IsString()
  referralCode?: string;
}

export class ReferralResult {
  @ApiProperty({ description: 'Referral ID', example: 'uuid' })
  id: string;

  @ApiProperty({ description: 'Referral code', example: 'REF123456' })
  referralCode: string;

  @ApiProperty({ description: 'Referrer ID', example: 'uuid' })
  referrerId: string;

  @ApiProperty({ description: 'Referred email', example: 'friend@example.com' })
  referredEmail: string;

  @ApiProperty({ description: 'Status', enum: ReferralStatus })
  status: ReferralStatus;

  @ApiProperty({ description: 'Reward amount (if applicable)', example: 500 })
  rewardAmount?: number;

  @ApiProperty({ description: 'Referral link', example: 'https://app.example.com/signup?ref=REF123456' })
  referralLink: string;
}

export class GetReferralStatsDto {
  @ApiProperty({ description: 'Customer ID', example: 'uuid' })
  @IsString()
  customerId: string;
}

export class ReferralStatsResult {
  @ApiProperty({ description: 'Total referrals', example: 10 })
  totalReferrals: number;

  @ApiProperty({ description: 'Active referrals', example: 5 })
  activeReferrals: number;

  @ApiProperty({ description: 'Successful referrals (disbursed)', example: 3 })
  successfulReferrals: number;

  @ApiProperty({ description: 'Total rewards earned', example: 1500 })
  totalRewardsEarned: number;

  @ApiProperty({ description: 'Pending rewards', example: 500 })
  pendingRewards: number;

  @ApiProperty({ description: 'Referral breakdown by status', type: Object })
  breakdownByStatus: Record<ReferralStatus, number>;
}

