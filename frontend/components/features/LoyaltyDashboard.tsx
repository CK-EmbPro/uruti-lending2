'use client';

import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import {
  gamificationApi,
  CustomerLoyaltySummary,
  CustomerBadge,
  RewardCatalog,
  LeaderboardEntry,
  MembershipTier,
  BadgeRarity,
} from '@/lib/api/gamification';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import {
  Award,
  Star,
  Trophy,
  Gift,
  Users,
  TrendingUp,
  Crown,
  Sparkles,
  Share2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

interface LoyaltyDashboardProps {
  customerId?: string;
}

const tierColors: Record<MembershipTier, string> = {
  [MembershipTier.BRONZE]: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  [MembershipTier.SILVER]: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
  [MembershipTier.GOLD]: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  [MembershipTier.PLATINUM]: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
};

const rarityColors: Record<BadgeRarity, string> = {
  [BadgeRarity.COMMON]: 'bg-gray-100 text-gray-800',
  [BadgeRarity.RARE]: 'bg-blue-100 text-blue-800',
  [BadgeRarity.EPIC]: 'bg-purple-100 text-purple-800',
  [BadgeRarity.LEGENDARY]: 'bg-yellow-100 text-yellow-800',
};

export function LoyaltyDashboard({ customerId }: LoyaltyDashboardProps) {
  const [selectedTab, setSelectedTab] = useState<'overview' | 'badges' | 'rewards' | 'leaderboard' | 'referrals'>('overview');
  const [referralEmail, setReferralEmail] = useState('');

  // Get loyalty summary
  const { data: summary, isLoading: summaryLoading, refetch: refetchSummary } = useQuery({
    queryKey: ['loyaltySummary', customerId],
    queryFn: () => gamificationApi.getLoyaltySummary(customerId || ''),
    enabled: !!customerId,
  });

  // Get badges
  const { data: badges, isLoading: badgesLoading } = useQuery({
    queryKey: ['customerBadges', customerId],
    queryFn: () => gamificationApi.getCustomerBadges(customerId || ''),
    enabled: !!customerId && selectedTab === 'badges',
  });

  // Get rewards
  const { data: rewards, isLoading: rewardsLoading } = useQuery({
    queryKey: ['rewardsCatalog', summary?.membershipTier],
    queryFn: () => gamificationApi.getRewardsCatalog(summary?.membershipTier),
    enabled: selectedTab === 'rewards',
  });

  // Get leaderboard
  const { data: leaderboard, isLoading: leaderboardLoading } = useQuery({
    queryKey: ['leaderboard'],
    queryFn: () => gamificationApi.getLeaderboard({ limit: 10 }),
    enabled: selectedTab === 'leaderboard',
  });

  // Create referral mutation
  const createReferralMutation = useMutation({
    mutationFn: (data: { referredEmail: string; referredName?: string }) =>
      gamificationApi.createReferral(data),
    onSuccess: (data) => {
      toast.success(`Referral created! Share code: ${data.referralCode}`);
      setReferralEmail('');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create referral');
    },
  });

  // Redeem points mutation
  const redeemMutation = useMutation({
    mutationFn: (data: { rewardId: string; quantity?: number }) =>
      gamificationApi.redeemPoints(data),
    onSuccess: () => {
      toast.success('Reward redeemed successfully!');
      refetchSummary();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to redeem reward');
    },
  });

  const handleCreateReferral = () => {
    if (!referralEmail) {
      toast.error('Please enter an email address');
      return;
    }
    createReferralMutation.mutate({ referredEmail: referralEmail });
  };

  const handleRedeem = (rewardId: string) => {
    if (!window.confirm('Are you sure you want to redeem this reward?')) {
      return;
    }
    redeemMutation.mutate({ rewardId });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Award className="w-6 h-6" />
            Loyalty & Rewards
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Earn points, unlock badges, and redeem rewards
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex -mb-px">
          {[
            { id: 'overview', label: 'Overview', icon: Star },
            { id: 'badges', label: 'Badges', icon: Award },
            { id: 'rewards', label: 'Rewards', icon: Gift },
            { id: 'leaderboard', label: 'Leaderboard', icon: Trophy },
            { id: 'referrals', label: 'Referrals', icon: Share2 },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setSelectedTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2 border-b-2 font-medium text-sm ${
                  selectedTab === tab.id
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Overview Tab */}
      {selectedTab === 'overview' && (
        <>
          {summaryLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="p-6">
                  <Skeleton className="h-8 w-32 mb-2" />
                  <Skeleton className="h-4 w-20" />
                </Card>
              ))}
            </div>
          ) : summary ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="p-6 border-l-4 border-blue-500">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Points Balance</p>
                    <Sparkles className="w-5 h-5 text-blue-500" />
                  </div>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">
                    {summary.currentPointsBalance.toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {summary.totalPointsEarned.toLocaleString()} lifetime points earned
                  </p>
                </Card>

                <Card className="p-6 border-l-4 border-yellow-500">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Membership Tier</p>
                    <Crown className="w-5 h-5 text-yellow-500" />
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={tierColors[summary.membershipTier as MembershipTier]}>
                      {summary.membershipTier}
                    </Badge>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    {summary.tierPoints} points toward next tier
                  </p>
                </Card>

                <Card className="p-6">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Achievements</p>
                    <Award className="w-5 h-5 text-gray-400" />
                  </div>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">
                    {badges?.length || 0}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Badges earned
                  </p>
                </Card>
              </div>

              <Card className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Activity Summary</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">On-Time Payments</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {summary.onTimePayments}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Early Payments</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {summary.earlyPayments}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Referrals</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {summary.referralsCount}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Points Expiring Soon</p>
                    <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                      {summary.pointsExpiringSoon}
                    </p>
                  </div>
                </div>
              </Card>
            </>
          ) : (
            <Card className="p-6">
              <p className="text-gray-600 dark:text-gray-400">No loyalty data found</p>
            </Card>
          )}
        </>
      )}

      {/* Badges Tab */}
      {selectedTab === 'badges' && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Your Badges</h3>
          {badgesLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-32 w-full" />
              ))}
            </div>
          ) : badges && badges.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {badges.map((customerBadge) => (
                <div
                  key={customerBadge.id}
                  className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 text-center"
                >
                  <div className="w-16 h-16 mx-auto mb-2 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center">
                    <Award className="w-8 h-8 text-white" />
                  </div>
                  <p className="font-medium text-gray-900 dark:text-white text-sm">
                    {customerBadge.badge.badgeName}
                  </p>
                  <Badge className={rarityColors[customerBadge.badge.rarity as BadgeRarity]} size="sm">
                    {customerBadge.badge.rarity}
                  </Badge>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {format(new Date(customerBadge.earnedAt), 'MMM yyyy')}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Award className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">No badges earned yet</p>
            </div>
          )}
        </Card>
      )}

      {/* Rewards Tab */}
      {selectedTab === 'rewards' && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Rewards Catalog</h3>
          {rewardsLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-24 w-full" />
              ))}
            </div>
          ) : rewards && rewards.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {rewards.map((reward) => (
                <div
                  key={reward.id}
                  className="border border-gray-200 dark:border-gray-700 rounded-lg p-4"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 dark:text-white">
                        {reward.rewardName}
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {reward.description}
                      </p>
                    </div>
                    <Gift className="w-5 h-5 text-gray-400" />
                  </div>
                  <div className="flex items-center justify-between mt-4">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Points Required</p>
                      <p className="text-xl font-bold text-gray-900 dark:text-white">
                        {reward.pointsRequired}
                      </p>
                    </div>
                    <Button
                      onClick={() => handleRedeem(reward.id)}
                      disabled={
                        redeemMutation.isPending ||
                        !summary ||
                        summary.currentPointsBalance < reward.pointsRequired
                      }
                      size="sm"
                    >
                      Redeem
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-600 dark:text-gray-400">No rewards available</p>
          )}
        </Card>
      )}

      {/* Leaderboard Tab */}
      {selectedTab === 'leaderboard' && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Top Performers</h3>
          {leaderboardLoading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : leaderboard && leaderboard.length > 0 ? (
            <div className="space-y-3">
              {leaderboard.map((entry, index) => (
                <div
                  key={entry.id}
                  className={`flex items-center justify-between p-4 rounded-lg ${
                    index < 3
                      ? 'bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20'
                      : 'bg-gray-50 dark:bg-gray-800'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 flex items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900">
                      {index === 0 ? (
                        <Trophy className="w-6 h-6 text-yellow-500" />
                      ) : index === 1 ? (
                        <Trophy className="w-6 h-6 text-gray-400" />
                      ) : index === 2 ? (
                        <Trophy className="w-6 h-6 text-orange-500" />
                      ) : (
                        <span className="font-bold text-gray-600 dark:text-gray-300">#{entry.rank}</span>
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {entry.customer?.name || `Customer ${entry.customerId.substring(0, 8)}`}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {entry.score.toLocaleString()} points
                      </p>
                    </div>
                  </div>
                  {entry.rankChange && entry.rankChange !== 0 && (
                    <div className="flex items-center gap-1">
                      {entry.rankChange > 0 ? (
                        <>
                          <TrendingUp className="w-4 h-4 text-green-500" />
                          <span className="text-sm text-green-600 dark:text-green-400">
                            +{entry.rankChange}
                          </span>
                        </>
                      ) : (
                        <>
                          <TrendingUp className="w-4 h-4 text-red-500 rotate-180" />
                          <span className="text-sm text-red-600 dark:text-red-400">
                            {entry.rankChange}
                          </span>
                        </>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-600 dark:text-gray-400">No leaderboard data available</p>
          )}
        </Card>
      )}

      {/* Referrals Tab */}
      {selectedTab === 'referrals' && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Refer Friends</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Friend's Email
              </label>
              <div className="flex gap-2">
                <input
                  type="email"
                  value={referralEmail}
                  onChange={(e) => setReferralEmail(e.target.value)}
                  placeholder="friend@example.com"
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg"
                />
                <Button
                  onClick={handleCreateReferral}
                  disabled={createReferralMutation.isPending || !referralEmail}
                >
                  {createReferralMutation.isPending ? 'Creating...' : 'Send Referral'}
                </Button>
              </div>
            </div>
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Earn points when your friends sign up and get approved for a loan!
              </p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}

