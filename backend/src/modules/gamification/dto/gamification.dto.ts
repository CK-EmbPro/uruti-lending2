import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsEnum,
  IsNumber,
  IsUUID,
  IsDateString,
  IsBoolean,
  IsObject,
  IsInt,
  IsEmail,
  Min,
  Max,
} from 'class-validator';
import { PointsSource, PointsTransactionType } from '../entities/loyalty-points.entity';
import { BadgeType, BadgeRarity } from '../entities/badge-achievement.entity';
import { MembershipTier } from '../entities/membership-tier.entity';
import { RewardType, RedemptionStatus } from '../entities/reward-redemption.entity';
import { LeaderboardType, LeaderboardPeriod } from '../entities/leaderboard.entity';

export class AwardPointsDto {
  @ApiProperty({ description: 'Customer ID' })
  @IsUUID()
  customerId: string;

  @ApiProperty({ description: 'Points to award' })
  @IsInt()
  @Min(1)
  points: number;

  @ApiProperty({ description: 'Points source', enum: PointsSource })
  @IsEnum(PointsSource)
  source: PointsSource;

  @ApiPropertyOptional({ description: 'Loan ID (if applicable)' })
  @IsUUID()
  @IsOptional()
  loanId?: string;

  @ApiPropertyOptional({ description: 'Points date (YYYY-MM-DD)' })
  @IsDateString()
  @IsOptional()
  pointsDate?: string;

  @ApiPropertyOptional({ description: 'Expiry date (YYYY-MM-DD)' })
  @IsDateString()
  @IsOptional()
  expiryDate?: string;

  @ApiPropertyOptional({ description: 'Description' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ description: 'Reference' })
  @IsString()
  @IsOptional()
  reference?: string;
}

export class RedeemPointsDto {
  @ApiProperty({ description: 'Reward catalog ID' })
  @IsUUID()
  rewardId: string;

  @ApiPropertyOptional({ description: 'Quantity (default: 1)' })
  @IsInt()
  @Min(1)
  @IsOptional()
  quantity?: number;
}

export class CreateReferralDto {
  @ApiProperty({ description: 'Referred person email' })
  @IsEmail()
  referredEmail: string;

  @ApiPropertyOptional({ description: 'Referred person name' })
  @IsString()
  @IsOptional()
  referredName?: string;
}

export class CreateBadgeDto {
  @ApiProperty({ description: 'Badge code' })
  @IsString()
  badgeCode: string;

  @ApiProperty({ description: 'Badge name' })
  @IsString()
  badgeName: string;

  @ApiPropertyOptional({ description: 'Description' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ description: 'Badge type', enum: BadgeType })
  @IsEnum(BadgeType)
  badgeType: BadgeType;

  @ApiPropertyOptional({ description: 'Rarity', enum: BadgeRarity, default: BadgeRarity.COMMON })
  @IsEnum(BadgeRarity)
  @IsOptional()
  rarity?: BadgeRarity;

  @ApiPropertyOptional({ description: 'Points reward' })
  @IsInt()
  @Min(0)
  @IsOptional()
  pointsReward?: number;

  @ApiPropertyOptional({ description: 'Criteria' })
  @IsObject()
  @IsOptional()
  criteria?: Record<string, any>;
}

export class CreateRewardDto {
  @ApiProperty({ description: 'Reward code' })
  @IsString()
  rewardCode: string;

  @ApiProperty({ description: 'Reward name' })
  @IsString()
  rewardName: string;

  @ApiProperty({ description: 'Reward type', enum: RewardType })
  @IsEnum(RewardType)
  rewardType: RewardType;

  @ApiProperty({ description: 'Points required' })
  @IsInt()
  @Min(1)
  pointsRequired: number;

  @ApiPropertyOptional({ description: 'Cash value' })
  @IsNumber()
  @Min(0)
  @IsOptional()
  cashValue?: number;

  @ApiPropertyOptional({ description: 'Stock quantity (-1 for unlimited)' })
  @IsInt()
  @IsOptional()
  stockQuantity?: number;
}

export class GetLeaderboardDto {
  @ApiPropertyOptional({ description: 'Leaderboard type', enum: LeaderboardType })
  @IsEnum(LeaderboardType)
  @IsOptional()
  leaderboardType?: LeaderboardType;

  @ApiPropertyOptional({ description: 'Period', enum: LeaderboardPeriod })
  @IsString()
  @IsOptional()
  period?: string;

  @ApiPropertyOptional({ description: 'Top N results', minimum: 1, maximum: 100, default: 10 })
  @IsInt()
  @Min(1)
  @Max(100)
  @IsOptional()
  limit?: number;
}

