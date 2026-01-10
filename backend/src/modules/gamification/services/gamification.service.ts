import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, LessThanOrEqual, MoreThan } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { LoyaltyPoints, PointsSource, PointsTransactionType } from '../entities/loyalty-points.entity';
import { CustomerLoyaltySummary } from '../entities/loyalty-points.entity';
import { Badge, BadgeType } from '../entities/badge-achievement.entity';
import { CustomerBadge } from '../entities/badge-achievement.entity';
import { MembershipTierConfig, MembershipTier } from '../entities/membership-tier.entity';
import { Referral, ReferralStatus } from '../entities/referral-reward.entity';
import { RewardCatalog, RewardRedemption, RewardType, RedemptionStatus } from '../entities/reward-redemption.entity';
import { Leaderboard, LeaderboardType, LeaderboardPeriod } from '../entities/leaderboard.entity';
import { LeaderboardEntry } from '../entities/leaderboard.entity';
// Customer entity doesn't exist - using applicantId instead
import { Loan } from '../../loan/entities/loan.entity';
import {
  AwardPointsDto,
  RedeemPointsDto,
  CreateReferralDto,
  CreateBadgeDto,
  CreateRewardDto,
  GetLeaderboardDto,
} from '../dto/gamification.dto';

/**
 * Gamification Service
 * Manages points, badges, achievements, tiers, referrals, and rewards
 */
@Injectable()
export class GamificationService {
  private readonly logger = new Logger(GamificationService.name);

  constructor(
    @InjectRepository(LoyaltyPoints)
    private readonly loyaltyPointsRepository: Repository<LoyaltyPoints>,
    @InjectRepository(CustomerLoyaltySummary)
    private readonly loyaltySummaryRepository: Repository<CustomerLoyaltySummary>,
    @InjectRepository(Badge)
    private readonly badgeRepository: Repository<Badge>,
    @InjectRepository(CustomerBadge)
    private readonly customerBadgeRepository: Repository<CustomerBadge>,
    @InjectRepository(MembershipTierConfig)
    private readonly tierConfigRepository: Repository<MembershipTierConfig>,
    @InjectRepository(Referral)
    private readonly referralRepository: Repository<Referral>,
    @InjectRepository(RewardCatalog)
    private readonly rewardCatalogRepository: Repository<RewardCatalog>,
    @InjectRepository(RewardRedemption)
    private readonly redemptionRepository: Repository<RewardRedemption>,
    @InjectRepository(Leaderboard)
    private readonly leaderboardRepository: Repository<Leaderboard>,
    @InjectRepository(LeaderboardEntry)
    private readonly leaderboardEntryRepository: Repository<LeaderboardEntry>,
    // Customer repository removed - using applicantId instead
    @InjectRepository(Loan)
    private readonly loanRepository: Repository<Loan>,
  ) {}

  /**
   * Award points to customer
   */
  async awardPoints(dto: AwardPointsDto, userId?: string): Promise<LoyaltyPoints> {
    // Customer entity doesn't exist - customerId is actually applicantId
    // Validation removed - assuming customerId is valid

    const points = this.loyaltyPointsRepository.create({
      customerId: dto.customerId,
      loanId: dto.loanId || null,
      points: dto.points,
      transactionType: PointsTransactionType.EARNED,
      source: dto.source,
      pointsDate: dto.pointsDate ? new Date(dto.pointsDate) : new Date(),
      expiryDate: dto.expiryDate ? new Date(dto.expiryDate) : null,
      description: dto.description || null,
      reference: dto.reference || null,
    });

    const saved = await this.loyaltyPointsRepository.save(points);

    // Update customer loyalty summary
    await this.updateLoyaltySummary(dto.customerId);

    // Check for badge achievements
    await this.checkBadgeAchievements(dto.customerId);

    // Check for tier upgrade
    await this.checkTierUpgrade(dto.customerId);

    this.logger.log(`Awarded ${dto.points} points to customer ${dto.customerId} for ${dto.source}`);

    return saved;
  }

  /**
   * Redeem points for reward
   */
  async redeemPoints(customerId: string, dto: RedeemPointsDto): Promise<RewardRedemption> {
    // Customer entity doesn't exist - customerId is actually applicantId
    // Validation removed

    const reward = await this.rewardCatalogRepository.findOne({ where: { id: dto.rewardId } });
    if (!reward) {
      throw new NotFoundException(`Reward ${dto.rewardId} not found`);
    }

    if (!reward.isActive) {
      throw new BadRequestException('Reward is not active');
    }

    const quantity = dto.quantity || 1;
    const totalPointsRequired = reward.pointsRequired * quantity;

    // Check customer points balance
    const summary = await this.getLoyaltySummary(customerId);
    if (summary.currentPointsBalance < totalPointsRequired) {
      throw new BadRequestException(
        `Insufficient points. Required: ${totalPointsRequired}, Available: ${summary.currentPointsBalance}`,
      );
    }

    // Check stock availability
    if (reward.stockQuantity >= 0 && reward.redeemedCount + quantity > reward.stockQuantity) {
      throw new BadRequestException('Reward out of stock');
    }

    // Create redemption
    const redemption = this.redemptionRepository.create({
      customerId,
      rewardId: dto.rewardId,
      pointsUsed: totalPointsRequired,
      status: RedemptionStatus.PENDING,
      redemptionDate: new Date(),
    });

    const saved = await this.redemptionRepository.save(redemption);

    // Deduct points
    const pointsDeduction = this.loyaltyPointsRepository.create({
      customerId,
      points: -totalPointsRequired,
      transactionType: PointsTransactionType.REDEEMED,
      source: PointsSource.MANUAL,
      pointsDate: new Date(),
      description: `Redeemed: ${reward.rewardName}`,
      reference: saved.id,
    });

    await this.loyaltyPointsRepository.save(pointsDeduction);

    // Update reward redeemed count
    reward.redeemedCount += quantity;
    await this.rewardCatalogRepository.save(reward);

    // Update loyalty summary
    await this.updateLoyaltySummary(customerId);

    this.logger.log(`Customer ${customerId} redeemed ${totalPointsRequired} points for reward ${reward.rewardName}`);

    return saved;
  }

  /**
   * Create referral
   */
  async createReferral(referrerId: string, dto: CreateReferralDto): Promise<Referral> {
    // Customer entity doesn't exist - referrerId is actually applicantId
    // Validation removed

    // Check if referral already exists
    const existing = await this.referralRepository.findOne({
      where: { referrerId, referredEmail: dto.referredEmail },
    });

    if (existing) {
      throw new BadRequestException('Referral already exists for this email');
    }

    // Generate unique referral code
    const referralCode = await this.generateReferralCode();

    const referral = this.referralRepository.create({
      referrerId,
      referralCode,
      referredEmail: dto.referredEmail,
      referredName: dto.referredName || null,
      status: ReferralStatus.PENDING,
      expiryDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days
    });

    return await this.referralRepository.save(referral);
  }

  /**
   * Get customer loyalty summary
   */
  async getLoyaltySummary(customerId: string): Promise<CustomerLoyaltySummary> {
    let summary = await this.loyaltySummaryRepository.findOne({
      where: { customerId },
      relations: ['customer'],
    });

    if (!summary) {
      // Create summary if it doesn't exist
      summary = this.loyaltySummaryRepository.create({
        customerId,
        membershipTier: MembershipTier.BRONZE,
        membershipSince: new Date(),
      });
      summary = await this.loyaltySummaryRepository.save(summary);
    }

    return summary;
  }

  /**
   * Get customer badges
   */
  async getCustomerBadges(customerId: string): Promise<CustomerBadge[]> {
    return await this.customerBadgeRepository.find({
      where: { customerId },
      relations: ['badge'],
      order: { earnedAt: 'DESC' },
    });
  }

  /**
   * Get leaderboard
   */
  async getLeaderboard(filters: GetLeaderboardDto): Promise<LeaderboardEntry[]> {
    const leaderboardType = filters.leaderboardType || LeaderboardType.OVERALL;
    const period: LeaderboardPeriod = (filters.period as LeaderboardPeriod) || LeaderboardPeriod.MONTHLY;
    const limit = filters.limit || 10;

    // Get or create leaderboard
    const periodStart = this.getPeriodStart(period);
    let leaderboard = await this.leaderboardRepository.findOne({
      where: {
        leaderboardType,
        period,
        periodStart,
      },
    });

    if (!leaderboard) {
      // Create and populate leaderboard
      leaderboard = await this.createLeaderboard(leaderboardType, period, periodStart);
    }

    // Get entries
    const entries = await this.leaderboardEntryRepository.find({
      where: { leaderboardId: leaderboard.id },
      relations: ['customer'],
      order: { rank: 'ASC' },
      take: limit,
    });

    return entries;
  }

  /**
   * Get rewards catalog
   */
  async getRewardsCatalog(tier?: string): Promise<RewardCatalog[]> {
    const query = this.rewardCatalogRepository.createQueryBuilder('reward')
      .where('reward.isActive = :isActive', { isActive: true });

    if (tier) {
      // Filter by tier eligibility
      query.andWhere(
        "(reward.eligibility->>'tier' IS NULL OR reward.eligibility->>'tier' = :tier)",
        { tier },
      );
    }

    query.orderBy('reward.pointsRequired', 'ASC');

    return await query.getMany();
  }

  // Private helper methods

  private async updateLoyaltySummary(customerId: string): Promise<void> {
    const summary = await this.getLoyaltySummary(customerId);

    // Calculate totals from points transactions
    const pointsTransactions = await this.loyaltyPointsRepository.find({
      where: { customerId },
    });

    summary.totalPointsEarned = pointsTransactions
      .filter((t) => t.transactionType === PointsTransactionType.EARNED)
      .reduce((sum, t) => sum + t.points, 0);

    summary.totalPointsRedeemed = Math.abs(
      pointsTransactions
        .filter((t) => t.transactionType === PointsTransactionType.REDEEMED)
        .reduce((sum, t) => sum + t.points, 0),
    );

    summary.currentPointsBalance = summary.totalPointsEarned - summary.totalPointsRedeemed;

    // Calculate expiring points
    const thirtyDaysFromNow = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    summary.pointsExpiringSoon = pointsTransactions
      .filter(
        (t) =>
          t.transactionType === PointsTransactionType.EARNED &&
          t.expiryDate &&
          t.expiryDate <= thirtyDaysFromNow &&
          t.expiryDate > new Date() &&
          !t.isExpired,
      )
      .reduce((sum, t) => sum + t.points, 0);

    summary.lastPointsEarnedDate = pointsTransactions
      .filter((t) => t.transactionType === PointsTransactionType.EARNED)
      .sort((a, b) => b.pointsDate.getTime() - a.pointsDate.getTime())[0]?.pointsDate || null;

    await this.loyaltySummaryRepository.save(summary);
  }

  private async checkBadgeAchievements(customerId: string): Promise<void> {
    // Check if customer qualifies for any badges
    const summary = await this.getLoyaltySummary(customerId);
    const badges = await this.badgeRepository.find({ where: { isActive: true } });

    for (const badge of badges) {
      // Check if customer already has this badge
      const existing = await this.customerBadgeRepository.findOne({
        where: { customerId, badgeId: badge.id },
      });

      if (existing) {
        continue;
      }

      // Check criteria
      const qualifies = await this.checkBadgeCriteria(customerId, badge, summary);
      if (qualifies) {
        // Award badge
        const customerBadge = this.customerBadgeRepository.create({
          customerId,
          badgeId: badge.id,
          earnedAt: new Date(),
          progress: 100,
          isDisplayed: true,
        });

        await this.customerBadgeRepository.save(customerBadge);

        // Award points if badge has point reward
        if (badge.pointsReward > 0) {
          await this.awardPoints(
            {
              customerId,
              points: badge.pointsReward,
              source: PointsSource.ACHIEVEMENT,
              description: `Badge: ${badge.badgeName}`,
            },
            'SYSTEM',
          );
        }

        this.logger.log(`Customer ${customerId} earned badge: ${badge.badgeName}`);
      }
    }
  }

  private async checkBadgeCriteria(
    customerId: string,
    badge: Badge,
    summary: CustomerLoyaltySummary,
  ): Promise<boolean> {
    // Simplified criteria checking
    // In production, this would be more sophisticated
    const criteria = badge.criteria || {};

    switch (badge.badgeType) {
      case BadgeType.PAYMENT_HERO:
        return summary.onTimePayments >= (criteria.minOnTimePayments || 12);
      case BadgeType.EARLY_BIRD:
        return summary.earlyPayments >= (criteria.minEarlyPayments || 5);
      case BadgeType.REFERRAL_CHAMPION:
        return summary.referralsCount >= (criteria.minReferrals || 10);
      case BadgeType.LOYAL_CUSTOMER:
        const membershipDays =
          summary.membershipSince &&
          Math.floor((Date.now() - summary.membershipSince.getTime()) / (1000 * 60 * 60 * 24));
        return (membershipDays || 0) >= (criteria.minDays || 365);
      default:
        return false;
    }
  }

  private async checkTierUpgrade(customerId: string): Promise<void> {
    const summary = await this.getLoyaltySummary(customerId);
    const tiers = await this.tierConfigRepository.find({
      where: { isActive: true },
      order: { minPoints: 'DESC' }, // Highest tier first
    });

    for (const tier of tiers) {
      if (summary.currentPointsBalance >= tier.minPoints) {
        if (summary.membershipTier !== tier.tierName) {
          // Upgrade tier
          summary.membershipTier = tier.tierName;
          summary.tierUpgradeDate = new Date();
          await this.loyaltySummaryRepository.save(summary);

          this.logger.log(`Customer ${customerId} upgraded to ${tier.tierName} tier`);
        }
        break;
      }
    }
  }

  private async generateReferralCode(): Promise<string> {
    // Generate unique referral code
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    let isUnique = false;

    while (!isUnique) {
      code = '';
      for (let i = 0; i < 8; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
      }

      const existing = await this.referralRepository.findOne({
        where: { referralCode: code },
      });

      if (!existing) {
        isUnique = true;
      }
    }

    return code;
  }

  private async createLeaderboard(
    type: LeaderboardType,
    period: LeaderboardPeriod,
    periodStart: Date,
  ): Promise<Leaderboard> {
    const leaderboard = this.leaderboardRepository.create({
      leaderboardType: type,
      period,
      periodStart,
      periodEnd: this.getPeriodEnd(period, periodStart),
      isActive: true,
    });

    const saved = await this.leaderboardRepository.save(leaderboard);

    // Populate leaderboard entries
    await this.populateLeaderboard(saved);

    return saved;
  }

  private async populateLeaderboard(leaderboard: Leaderboard): Promise<void> {
    // Get all customers with loyalty summaries
    const summaries = await this.loyaltySummaryRepository.find({
      relations: ['customer'],
    });

    // Calculate scores based on leaderboard type
    const entries = summaries.map((summary, index) => {
      let score = 0;
      switch (leaderboard.leaderboardType) {
        case LeaderboardType.POINTS:
          score = summary.currentPointsBalance;
          break;
        case LeaderboardType.PAYMENTS:
          score = summary.onTimePayments + summary.earlyPayments;
          break;
        case LeaderboardType.REFERRALS:
          score = summary.referralsCount;
          break;
        case LeaderboardType.OVERALL:
          score =
            summary.currentPointsBalance +
            summary.onTimePayments * 10 +
            summary.earlyPayments * 20 +
            summary.referralsCount * 50;
          break;
      }

      return {
        leaderboardId: leaderboard.id,
        customerId: summary.customerId,
        rank: 0, // Will be set after sorting
        score,
        metrics: {
          points: summary.currentPointsBalance,
          payments: summary.onTimePayments + summary.earlyPayments,
          referrals: summary.referralsCount,
          tier: summary.membershipTier,
        },
      };
    });

    // Sort by score descending
    entries.sort((a, b) => b.score - a.score);

    // Assign ranks
    entries.forEach((entry, index) => {
      entry.rank = index + 1;
    });

    // Save entries
    const leaderboardEntries = entries.map((e) =>
      this.leaderboardEntryRepository.create(e),
    );

    await this.leaderboardEntryRepository.save(leaderboardEntries);

    leaderboard.totalParticipants = entries.length;
    await this.leaderboardRepository.save(leaderboard);
  }

  private getPeriodStart(period: LeaderboardPeriod): Date {
    const now = new Date();
    switch (period) {
      case LeaderboardPeriod.DAILY:
        return new Date(now.getFullYear(), now.getMonth(), now.getDate());
      case LeaderboardPeriod.WEEKLY:
        const dayOfWeek = now.getDay();
        const diff = now.getDate() - dayOfWeek;
        return new Date(now.getFullYear(), now.getMonth(), diff);
      case LeaderboardPeriod.MONTHLY:
        return new Date(now.getFullYear(), now.getMonth(), 1);
      case LeaderboardPeriod.YEARLY:
        return new Date(now.getFullYear(), 0, 1);
      case LeaderboardPeriod.ALL_TIME:
        return new Date(0);
      default:
        return new Date(now.getFullYear(), now.getMonth(), 1);
    }
  }

  private getPeriodEnd(period: LeaderboardPeriod, start: Date): Date | null {
    if (period === LeaderboardPeriod.ALL_TIME) {
      return null;
    }

    const end = new Date(start);
    switch (period) {
      case LeaderboardPeriod.DAILY:
        end.setDate(end.getDate() + 1);
        break;
      case LeaderboardPeriod.WEEKLY:
        end.setDate(end.getDate() + 7);
        break;
      case LeaderboardPeriod.MONTHLY:
        end.setMonth(end.getMonth() + 1);
        break;
      case LeaderboardPeriod.YEARLY:
        end.setFullYear(end.getFullYear() + 1);
        break;
    }

    return end;
  }

  /**
   * Daily cron job to expire points
   */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async expirePoints(): Promise<void> {
    this.logger.log('Expiring loyalty points');
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const expiredPoints = await this.loyaltyPointsRepository.find({
      where: {
        transactionType: PointsTransactionType.EARNED,
        expiryDate: LessThanOrEqual(today),
        isExpired: false,
      },
    });

    for (const points of expiredPoints) {
      points.isExpired = true;
      await this.loyaltyPointsRepository.save(points);

      // Create expiration transaction
      const expiration = this.loyaltyPointsRepository.create({
        customerId: points.customerId,
        loanId: points.loanId,
        points: -points.points,
        transactionType: PointsTransactionType.EXPIRED,
        source: PointsSource.MANUAL,
        pointsDate: today,
        description: `Points expired: ${points.description || 'N/A'}`,
        reference: points.id,
      });

      await this.loyaltyPointsRepository.save(expiration);

      // Update summary
      await this.updateLoyaltySummary(points.customerId);
    }

    this.logger.log(`Expired ${expiredPoints.length} points transactions`);
  }
}

