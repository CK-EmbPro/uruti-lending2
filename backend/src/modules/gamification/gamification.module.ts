import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { LoyaltyPoints, CustomerLoyaltySummary } from './entities/loyalty-points.entity';
import { Badge, CustomerBadge } from './entities/badge-achievement.entity';
import { MembershipTierConfig } from './entities/membership-tier.entity';
import { Referral } from './entities/referral-reward.entity';
import { RewardCatalog, RewardRedemption } from './entities/reward-redemption.entity';
import { Leaderboard, LeaderboardEntry } from './entities/leaderboard.entity';
import { GamificationService } from './services/gamification.service';
import { GamificationController } from './gamification.controller';
// Customer entity doesn't exist - removed
import { Loan } from '../loan/entities/loan.entity';

@Module({
  imports: [
    ScheduleModule,
    TypeOrmModule.forFeature([
      LoyaltyPoints,
      CustomerLoyaltySummary,
      Badge,
      CustomerBadge,
      MembershipTierConfig,
      Referral,
      RewardCatalog,
      RewardRedemption,
      Leaderboard,
      LeaderboardEntry,
      // Customer entity removed
      Loan,
    ]),
  ],
  controllers: [GamificationController],
  providers: [GamificationService],
  exports: [GamificationService],
})
export class GamificationModule {}

