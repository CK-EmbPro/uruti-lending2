'use client';

import { useAuth } from '@/contexts/AuthContext';
import { PredictiveAnalyticsDashboard } from '@/components/features/PredictiveAnalyticsDashboard';

export default function PredictiveAnalyticsPage() {
  const { user } = useAuth();
  const companyId = (user as any)?.companyId;

  return (
    <div className="container mx-auto px-4 py-8">
      <PredictiveAnalyticsDashboard companyId={companyId} />
    </div>
  );
}

