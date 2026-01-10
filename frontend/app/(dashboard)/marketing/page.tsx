'use client';

import { useState } from 'react';
import { ReferralManagement } from '@/components/features/ReferralManagement';
import { ReferralBonusManagement } from '@/components/features/ReferralBonusManagement';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { UserPlus, Gift } from 'lucide-react';

export default function MarketingPage() {
  const [activeTab, setActiveTab] = useState<'referrals' | 'bonuses'>('referrals');

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Marketing & Referrals</h1>
        <p className="text-gray-600">Manage referral programs and track bonus payments</p>
      </div>

      {/* Tabs */}
      <Card className="mb-6">
        <div className="p-4">
          <div className="flex gap-2">
            <Button
              variant={activeTab === 'referrals' ? 'default' : 'outline'}
              onClick={() => setActiveTab('referrals')}
              className="flex items-center gap-2"
            >
              <UserPlus className="w-4 h-4" />
              Referrals
            </Button>
            <Button
              variant={activeTab === 'bonuses' ? 'default' : 'outline'}
              onClick={() => setActiveTab('bonuses')}
              className="flex items-center gap-2"
            >
              <Gift className="w-4 h-4" />
              Bonuses
            </Button>
          </div>
        </div>
      </Card>

      {/* Content */}
      {activeTab === 'referrals' && <ReferralManagement />}
      {activeTab === 'bonuses' && <ReferralBonusManagement />}
    </div>
  );
}

