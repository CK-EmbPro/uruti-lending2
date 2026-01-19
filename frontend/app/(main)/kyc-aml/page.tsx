'use client';

import { useState } from 'react';
import { InstantKYCAML } from '@/components/features/InstantKYCAML';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

export default function KYCAMLPage() {
  const [applicationId, setApplicationId] = useState('');
  const [started, setStarted] = useState(false);

  const handleStart = () => {
    if (applicationId) {
      setStarted(true);
    }
  };

  if (!started) {
    return (
      <div className="container mx-auto py-8 px-4 max-w-2xl">
        <Card title="Instant KYC/AML Checks" subtitle="Enter application ID to begin">
          <div className="space-y-4">
            <Input
              label="Application ID"
              value={applicationId}
              onChange={(e) => setApplicationId(e.target.value)}
              placeholder="Enter application ID"
            />
            <Button onClick={handleStart} disabled={!applicationId} className="w-full">
              Start KYC/AML Checks
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <InstantKYCAML
        applicationId={applicationId}
        onComplete={(result) => {
          console.log('KYC/AML checks completed:', result);
        }}
      />
    </div>
  );
}

