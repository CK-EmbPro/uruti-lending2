'use client';

import { useState } from 'react';
import { ZeroBranchOnboarding } from '@/components/features/ZeroBranchOnboarding';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useRouter } from 'next/navigation';

export default function OnboardingPage() {
  const router = useRouter();
  const [applicationId, setApplicationId] = useState('');
  const [started, setStarted] = useState(false);

  const handleStart = () => {
    if (applicationId) {
      setStarted(true);
    }
  };

  const handleComplete = () => {
    router.push('/dashboard/loan-applications');
  };

  if (!started) {
    return (
      <div className="container mx-auto py-8 px-4 max-w-2xl">
        <Card title="Zero-Branch Onboarding" subtitle="Enter application ID to begin onboarding">
          <div className="space-y-4">
            <Input
              label="Application ID"
              value={applicationId}
              onChange={(e) => setApplicationId(e.target.value)}
              placeholder="Enter application ID"
            />
            <Button onClick={handleStart} disabled={!applicationId} className="w-full">
              Start Onboarding
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <ZeroBranchOnboarding applicationId={applicationId} onComplete={handleComplete} />
    </div>
  );
}

