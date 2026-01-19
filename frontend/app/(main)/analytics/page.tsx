'use client';

import { AnalyticsDashboard } from '@/components/features/AnalyticsDashboard';
import { useAuth } from '@/contexts/AuthContext';

export default function AnalyticsPage() {
  const { user } = useAuth();

  return (
    <div className="container mx-auto py-6 px-4">
      <AnalyticsDashboard companyId={(user as any)?.companyId} />
    </div>
  );
}

