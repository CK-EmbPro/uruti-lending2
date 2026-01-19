'use client';

import { useAuth } from '@/contexts/AuthContext';
import { FraudAnalyticsDashboard } from '@/components/features/FraudAnalyticsDashboard';

export default function FraudDetectionPage() {
  const { user } = useAuth();
  const companyId = (user as any)?.companyId;

  return (
    <div className="container mx-auto px-4 py-8">
      <FraudAnalyticsDashboard companyId={companyId} />
    </div>
  );
}

