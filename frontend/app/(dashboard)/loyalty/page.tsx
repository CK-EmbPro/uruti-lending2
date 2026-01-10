'use client';

import { useAuth } from '@/contexts/AuthContext';
import { LoyaltyDashboard } from '@/components/features/LoyaltyDashboard';

export default function LoyaltyPage() {
  const { user } = useAuth();
  const customerId = (user as any)?.customerId || (user as any)?.id;

  return (
    <div className="container mx-auto px-4 py-8">
      <LoyaltyDashboard customerId={customerId} />
    </div>
  );
}

