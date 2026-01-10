'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { Alert } from '@/components/ui/Alert';
import { Modal } from '@/components/ui/Modal';
import { Textarea } from '@/components/ui/Textarea';
import {
  useRestructureAcknowledgment,
  useAcknowledgeRestructure,
} from '@/lib/hooks/useLoanRestructure';
import {
  FileCheck,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Info,
  Shield,
} from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

interface RestructureAcknowledgmentSectionProps {
  restructureId: string;
  borrowerId: string;
  impactAnalysis?: {
    interestDifference: number;
    totalCostDifference: number;
    paymentDifference: number;
    extensionMonths: number;
    percentageIncrease: number;
  };
  oldScheduleSummary?: {
    totalPayments: number;
    totalInterest: number;
    totalCost: number;
  };
  newScheduleSummary?: {
    totalPayments: number;
    totalInterest: number;
    totalCost: number;
  };
}

export function RestructureAcknowledgmentSection({
  restructureId,
  borrowerId,
  impactAnalysis,
  oldScheduleSummary,
  newScheduleSummary,
}: RestructureAcknowledgmentSectionProps) {
  const [showAcknowledgmentModal, setShowAcknowledgmentModal] = useState(false);
  const [termsRead, setTermsRead] = useState(false);
  const [impactUnderstood, setImpactUnderstood] = useState(false);
  const [notes, setNotes] = useState('');

  const { data: acknowledgment, isLoading } = useRestructureAcknowledgment(restructureId);
  const acknowledgeRestructure = useAcknowledgeRestructure();

  const handleAcknowledge = async () => {
    if (!termsRead || !impactUnderstood) {
      toast.error('Please confirm that you have read the terms and understand the impact');
      return;
    }

    try {
      await acknowledgeRestructure.mutateAsync({
        id: restructureId,
        borrowerId,
        dto: {
          acknowledgmentMethod: 'ELECTRONIC_CONSENT',
          acknowledgmentText: 'I acknowledge that the loan terms will change as described in the restructure request.',
          termsRead: true,
          impactUnderstood: true,
          notes: notes.trim() || undefined,
          ipAddress: typeof window !== 'undefined' ? window.location.hostname : undefined,
          userAgent: typeof window !== 'undefined' ? navigator.userAgent : undefined,
        },
      });
      setShowAcknowledgmentModal(false);
      setTermsRead(false);
      setImpactUnderstood(false);
      setNotes('');
    } catch (error) {
      // Error handled by hook
    }
  };

  if (isLoading) {
    return (
      <Card title="Restructure Acknowledgment">
        <Skeleton className="h-32 w-full" />
      </Card>
    );
  }

  if (acknowledgment) {
    return (
      <Card title="Restructure Acknowledgment">
        <div className="space-y-4">
          <Alert variant="success" title="Acknowledgment Recorded">
            <div className="text-sm space-y-2">
              <p>You have acknowledged the restructure terms change.</p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="font-medium">Acknowledged:</span>{' '}
                  {format(new Date(acknowledgment.acknowledgedAt), 'MMM dd, yyyy HH:mm')}
                </div>
                <div>
                  <span className="font-medium">Method:</span>{' '}
                  {acknowledgment.acknowledgmentMethod.replace('_', ' ')}
                </div>
              </div>
              {acknowledgment.termsRead && acknowledgment.impactUnderstood && (
                <div className="flex items-center gap-2 mt-2">
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                  <span className="text-xs text-gray-600">
                    Terms read and impact understood confirmed
                  </span>
                </div>
              )}
            </div>
          </Alert>
        </div>
      </Card>
    );
  }

  return (
    <Card title="Restructure Acknowledgment">
      <div className="space-y-4">
        <Alert variant="warning" title="Acknowledgment Required">
          <div className="text-sm">
            <p>You must acknowledge the terms change before this restructure can be approved.</p>
            <p className="text-xs text-gray-600 mt-1">
              Please review the impact analysis below and confirm your understanding.
            </p>
          </div>
        </Alert>

        {/* Impact Analysis Display */}
        {impactAnalysis && (
          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex items-center gap-2 mb-3">
              <Info className="w-4 h-4 text-gray-500" />
              <span className="font-semibold text-sm">Impact Analysis</span>
            </div>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="font-medium text-gray-600">Extension:</span>
                <div className="text-gray-900 font-semibold">
                  {impactAnalysis.extensionMonths} months ({impactAnalysis.percentageIncrease.toFixed(1)}%)
                </div>
              </div>
              <div>
                <span className="font-medium text-gray-600">Interest Difference:</span>
                <div className={`font-semibold ${impactAnalysis.interestDifference >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                  ${impactAnalysis.interestDifference >= 0 ? '+' : ''}{impactAnalysis.interestDifference.toLocaleString()}
                </div>
              </div>
              <div>
                <span className="font-medium text-gray-600">Total Cost Difference:</span>
                <div className={`font-semibold ${impactAnalysis.totalCostDifference >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                  ${impactAnalysis.totalCostDifference >= 0 ? '+' : ''}{impactAnalysis.totalCostDifference.toLocaleString()}
                </div>
              </div>
              <div>
                <span className="font-medium text-gray-600">Payment Difference:</span>
                <div className={`font-semibold ${impactAnalysis.paymentDifference >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                  ${impactAnalysis.paymentDifference >= 0 ? '+' : ''}{impactAnalysis.paymentDifference.toLocaleString()}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Schedule Comparison */}
        {oldScheduleSummary && newScheduleSummary && (
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center gap-2 mb-3">
              <Shield className="w-4 h-4 text-blue-600" />
              <span className="font-semibold text-sm text-blue-900">Schedule Comparison</span>
            </div>
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <div className="font-medium text-gray-600 mb-1">Old Schedule</div>
                <div className="space-y-1 text-gray-700">
                  <div>Total Payments: ${oldScheduleSummary.totalPayments.toLocaleString()}</div>
                  <div>Total Interest: ${oldScheduleSummary.totalInterest.toLocaleString()}</div>
                  <div>Total Cost: ${oldScheduleSummary.totalCost.toLocaleString()}</div>
                </div>
              </div>
              <div>
                <div className="font-medium text-gray-600 mb-1">New Schedule</div>
                <div className="space-y-1 text-gray-700">
                  <div>Total Payments: ${newScheduleSummary.totalPayments.toLocaleString()}</div>
                  <div>Total Interest: ${newScheduleSummary.totalInterest.toLocaleString()}</div>
                  <div>Total Cost: ${newScheduleSummary.totalCost.toLocaleString()}</div>
                </div>
              </div>
            </div>
          </div>
        )}

        <Button
          onClick={() => setShowAcknowledgmentModal(true)}
          className="w-full"
        >
          <FileCheck className="w-4 h-4 mr-2" />
          Acknowledge Terms Change
        </Button>

        {/* Acknowledgment Modal */}
        <Modal
          isOpen={showAcknowledgmentModal}
          onClose={() => {
            setShowAcknowledgmentModal(false);
            setTermsRead(false);
            setImpactUnderstood(false);
            setNotes('');
          }}
          title="Acknowledge Restructure Terms"
          size="lg"
          footer={
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  setShowAcknowledgmentModal(false);
                  setTermsRead(false);
                  setImpactUnderstood(false);
                  setNotes('');
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleAcknowledge}
                disabled={!termsRead || !impactUnderstood || acknowledgeRestructure.isPending}
              >
                {acknowledgeRestructure.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Recording...
                  </>
                ) : (
                  <>
                    <FileCheck className="w-4 h-4 mr-2" />
                    Confirm Acknowledgment
                  </>
                )}
              </Button>
            </div>
          }
        >
          <div className="space-y-4">
            <Alert variant="warning">
              <div className="text-sm">
                <p className="font-semibold mb-2">Important:</p>
                <p>By acknowledging, you confirm that:</p>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>You have read and understand the new loan terms</li>
                  <li>You understand the impact on your total loan cost</li>
                  <li>You agree to the restructured repayment schedule</li>
                </ul>
              </div>
            </Alert>

            {impactAnalysis && (
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="text-sm font-semibold mb-2">Impact Summary:</div>
                <div className="text-xs space-y-1 text-gray-700">
                  <div>• Extension: {impactAnalysis.extensionMonths} months ({impactAnalysis.percentageIncrease.toFixed(1)}%)</div>
                  <div>• Interest Difference: ${impactAnalysis.interestDifference >= 0 ? '+' : ''}{impactAnalysis.interestDifference.toLocaleString()}</div>
                  <div>• Total Cost Difference: ${impactAnalysis.totalCostDifference >= 0 ? '+' : ''}{impactAnalysis.totalCostDifference.toLocaleString()}</div>
                </div>
              </div>
            )}

            <div className="space-y-3">
              <label className="flex items-start gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={termsRead}
                  onChange={(e) => setTermsRead(e.target.checked)}
                  className="mt-1"
                />
                <span className="text-sm">
                  I confirm that I have read and understand the new loan terms and conditions
                </span>
              </label>

              <label className="flex items-start gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={impactUnderstood}
                  onChange={(e) => setImpactUnderstood(e.target.checked)}
                  className="mt-1"
                />
                <span className="text-sm">
                  I understand the impact of this restructure on my total loan cost and repayment schedule
                </span>
              </label>
            </div>

            <Textarea
              label="Additional Notes (Optional)"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any additional comments or questions..."
              rows={3}
            />
          </div>
        </Modal>
      </div>
    </Card>
  );
}

