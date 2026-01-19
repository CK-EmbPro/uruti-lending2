'use client';

import { MultiCurrencyDashboard } from '@/components/currency/MultiCurrencyDashboard';
import { useAuth } from '@/contexts/AuthContext';

export default function CurrencyPage() {
  const { user } = useAuth();
  const companyId = (user as any)?.companyId;

  return (
    <div className="container mx-auto px-4 py-8">
      <MultiCurrencyDashboard companyId={companyId} />
    </div>
  );
}
