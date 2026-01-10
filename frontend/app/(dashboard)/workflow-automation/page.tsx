'use client';

import { useAuth } from '@/contexts/AuthContext';
import { WorkflowAutomationDashboard } from '@/components/features/WorkflowAutomationDashboard';

export default function WorkflowAutomationPage() {
  const { user } = useAuth();
  const companyId = (user as any)?.companyId;

  return (
    <div className="container mx-auto px-4 py-8">
      <WorkflowAutomationDashboard companyId={companyId} />
    </div>
  );
}

