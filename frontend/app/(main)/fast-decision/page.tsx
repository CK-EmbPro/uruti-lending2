'use client';

import { useState } from 'react';
import { FastDecisionProgress } from '@/components/features/FastDecisionProgress';
import { useInitiateFastDecision } from '@/lib/hooks/useFastDecision';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

export default function FastDecisionPage() {
  const [applicationId, setApplicationId] = useState('');
  const [skipDocumentVerification, setSkipDocumentVerification] = useState(false);
  const [skipKYCAML, setSkipKYCAML] = useState(false);
  const [autoApprove, setAutoApprove] = useState(true);
  const [autoApproveThreshold, setAutoApproveThreshold] = useState(700);
  const [started, setStarted] = useState(false);

  const initiateDecision = useInitiateFastDecision();

  const handleStart = async () => {
    if (!applicationId) {
      alert('Please enter an application ID');
      return;
    }

    try {
      await initiateDecision.mutateAsync({
        applicationId,
        skipDocumentVerification,
        skipKYCAML,
        autoApprove,
        autoApproveThreshold,
      });
      setStarted(true);
    } catch (error) {
      console.error('Failed to initiate fast decision:', error);
    }
  };

  if (!started) {
    return (
      <div className="container mx-auto py-8 px-4 max-w-2xl">
        <Card
          title="Fast Decision - Under 10 Minutes"
          subtitle="Initiate a fast decision process with SLA tracking. Target: 95% processed in &lt;10 minutes"
        >
          <div className="space-y-4">
            <Input
              label="Application ID"
              value={applicationId}
              onChange={(e) => setApplicationId(e.target.value)}
              placeholder="Enter application ID"
            />

            <div className="space-y-3">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={skipDocumentVerification}
                  onChange={(e) => setSkipDocumentVerification(e.target.checked)}
                  className="rounded"
                />
                <span className="text-sm text-gray-700">Skip Document Verification</span>
              </label>

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={skipKYCAML}
                  onChange={(e) => setSkipKYCAML(e.target.checked)}
                  className="rounded"
                />
                <span className="text-sm text-gray-700">Skip KYC/AML Checks</span>
              </label>

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={autoApprove}
                  onChange={(e) => setAutoApprove(e.target.checked)}
                  className="rounded"
                />
                <span className="text-sm text-gray-700">Auto-approve if score meets threshold</span>
              </label>
            </div>

            {autoApprove && (
              <Input
                label="Auto-approve Threshold (Score)"
                type="number"
                value={autoApproveThreshold}
                onChange={(e) => setAutoApproveThreshold(Number(e.target.value))}
                placeholder="700"
              />
            )}

            <div className="p-4 bg-blue-50 rounded-lg">
              <p className="text-sm font-medium text-blue-900 mb-2">Component SLAs:</p>
              <ul className="text-xs text-blue-800 space-y-1">
                <li>• Document verification: &lt;30s</li>
                <li>• KYC/AML: &lt;45s</li>
                <li>• Scoring: &lt;2s</li>
                <li>• Approval: &lt;15s</li>
              </ul>
            </div>

            <Button
              onClick={handleStart}
              isLoading={initiateDecision.isPending}
              disabled={!applicationId}
              className="w-full"
            >
              Initiate Fast Decision
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <FastDecisionProgress
        applicationId={applicationId}
        onComplete={(result) => {
          console.log('Fast decision completed:', result);
        }}
      />
    </div>
  );
}

