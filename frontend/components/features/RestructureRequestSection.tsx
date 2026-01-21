'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { Alert } from '@/components/ui/Alert';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import {
  useRestructures,
  useCreateRestructure,
  useApproveRestructure,
  useRejectRestructure,
} from '@/lib/hooks/useLoanRestructure';
import {
  FileEdit,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2,
  Plus,
  Percent,
  Calendar,
  DollarSign,
  TrendingUp,
  Info,
} from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

interface RestructureRequestSectionProps {
  loanId: string;
  originalTenure: number;
  currentRate: number;
}

export function RestructureRequestSection({
  loanId,
  originalTenure,
  currentRate,
}: RestructureRequestSectionProps) {
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [restructureType, setRestructureType] = useState<'NORMAL_RESTRUCTURE' | 'HARDSHIP_RESTRUCTURE' | 'SETTLEMENT_RESTRUCTURE'>('NORMAL_RESTRUCTURE');
  const [newTenure, setNewTenure] = useState('');
  const [newRate, setNewRate] = useState('');
  const [reason, setReason] = useState('');

  const { data: restructures, isLoading } = useRestructures(loanId);
  const createRestructure = useCreateRestructure();
  const approveRestructure = useApproveRestructure();
  const rejectRestructure = useRejectRestructure();

  // Calculate max allowed tenure (50% extension)
  const maxAllowedTenure = Math.floor(originalTenure * 1.5);
  const extensionPercentage = newTenure
    ? ((parseInt(newTenure) - originalTenure) / originalTenure) * 100
    : 0;

  const handleCreateRequest = async () => {
    if (!reason.trim()) {
      toast.error('Please provide a reason for the restructure');
      return;
    }

    if (newTenure && parseInt(newTenure) > maxAllowedTenure) {
      toast.error(`Tenure extension cannot exceed ${maxAllowedTenure} months (50% of original)`);
      return;
    }

    try {
      await createRestructure.mutateAsync({
        loanId,
        restructureType,
        restructureDate: new Date().toISOString(),
        reasonForRestructure: reason,
        newRepaymentPeriodInMonths: newTenure ? parseInt(newTenure) : undefined,
        newRateOfInterest: newRate ? parseFloat(newRate) : undefined,
      });
      setShowRequestModal(false);
      setReason('');
      setNewTenure('');
      setNewRate('');
    } catch (error) {
      // Error handled by hook
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; variant: 'success' | 'warning' | 'error' | 'info' }> = {
      INITIATED: { label: 'Initiated', variant: 'warning' },
      APPROVED: { label: 'Approved', variant: 'success' },
      REJECTED: { label: 'Rejected', variant: 'error' },
    };

    const statusInfo = statusMap[status] || { label: status, variant: 'info' as const };
    return <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>;
  };

  if (isLoading) {
    return (
      <Card title="Loan Restructure">
        <Skeleton className="h-32 w-full" />
      </Card>
    );
  }

  return (
    <Card title="Loan Restructure">
      <div className="space-y-4">
        {/* Request Button */}
        <Button
          variant="outline"
          onClick={() => setShowRequestModal(true)}
          className="w-full flex items-center"
        >
          <Plus className="w-4 h-4 mr-2" />
          Request Restructure
        </Button>

        {/* Tenure Extension Info */}
        <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-start gap-2">
            <Info className="w-4 h-4 text-blue-600 mt-0.5" />
            <div className="text-xs text-blue-800">
              <p className="font-semibold mb-1">Tenure Extension Policy:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Original tenure: {originalTenure} months</li>
                <li>Maximum allowed: {maxAllowedTenure} months (+50%)</li>
                <li>Extension beyond 50% is not permitted</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Restructures List */}
        {restructures && restructures.length > 0 ? (
          <div className="space-y-3">
            <div className="text-sm font-semibold text-gray-900">Restructure Requests</div>
            {restructures.map((restructure) => (
              <div
                key={restructure.id}
                className="p-4 rounded-lg border border-gray-200 bg-white"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <FileEdit className="w-4 h-4 text-gray-400" />
                    <span className="font-medium text-sm">{restructure.restructureType.replace('_', ' ')}</span>
                  </div>
                  {getStatusBadge(restructure.status)}
                </div>
                {restructure.reasonForRestructure && (
                  <div className="text-xs text-gray-600 mb-2">{restructure.reasonForRestructure}</div>
                )}
                <div className="grid grid-cols-2 gap-2 text-xs text-gray-600 mb-2">
                  {restructure.newRepaymentPeriodInMonths && (
                    <div>
                      <span className="font-medium">New Tenure:</span> {restructure.newRepaymentPeriodInMonths} months
                      {restructure.oldTenure && (
                        <span className="text-gray-500 ml-1">
                          (was {restructure.oldTenure} months)
                        </span>
                      )}
                    </div>
                  )}
                  {restructure.newRateOfInterest && (
                    <div>
                      <span className="font-medium">New Rate:</span> {restructure.newRateOfInterest}%
                      {restructure.oldRateOfInterest && (
                        <span className="text-gray-500 ml-1">
                          (was {restructure.oldRateOfInterest}%)
                        </span>
                      )}
                    </div>
                  )}
                </div>
                <div className="text-xs text-gray-500">
                  Requested: {format(new Date(restructure.createdAt), 'MMM dd, yyyy')}
                </div>
                {restructure.impactAnalysis && (
                  <div className="mt-3 p-2 bg-gray-50 rounded text-xs">
                    <div className="font-semibold mb-1">Impact Analysis:</div>
                    <div className="space-y-1 text-gray-600">
                      <div>Extension: {restructure.impactAnalysis.extensionMonths} months ({restructure.impactAnalysis.percentageIncrease.toFixed(1)}%)</div>
                      <div>Interest Difference: ${restructure.impactAnalysis.interestDifference.toLocaleString()}</div>
                      <div>Total Cost Difference: ${restructure.impactAnalysis.totalCostDifference.toLocaleString()}</div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <Alert variant="info" title="No Restructures">
            No restructure requests have been submitted for this loan.
          </Alert>
        )}

        {/* Request Modal */}
        <Modal
          isOpen={showRequestModal}
          onClose={() => {
            setShowRequestModal(false);
            setRestructureType('NORMAL_RESTRUCTURE');
            setReason('');
            setNewTenure('');
            setNewRate('');
          }}
          title="Request Loan Restructure"
          size="lg"
          footer={
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  setShowRequestModal(false);
                  setRestructureType('NORMAL_RESTRUCTURE');
                  setReason('');
                  setNewTenure('');
                  setNewRate('');
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateRequest}
                disabled={
                  !reason.trim() ||
                  (newTenure && parseInt(newTenure) > maxAllowedTenure) ||
                  createRestructure.isPending
                }
              >
                {createRestructure.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <FileEdit className="w-4 h-4 mr-2" />
                    Submit Request
                  </>
                )}
              </Button>
            </div>
          }
        >
          <div className="space-y-4">
            <Alert variant="info">
              Submit a restructure request to modify your loan terms. An underwriter will review your request.
            </Alert>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Restructure Type
              </label>
              <select
                value={restructureType}
                onChange={(e) => setRestructureType(e.target.value as any)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="NORMAL_RESTRUCTURE">Normal Restructure</option>
                <option value="HARDSHIP_RESTRUCTURE">Hardship Restructure</option>
                <option value="SETTLEMENT_RESTRUCTURE">Settlement Restructure</option>
              </select>
            </div>

            <Input
              label="New Tenure (Months)"
              type="number"
              value={newTenure}
              onChange={(e) => setNewTenure(e.target.value)}
              placeholder={`Max: ${maxAllowedTenure} months`}
              helperText={
                newTenure
                  ? extensionPercentage > 50
                    ? `Extension exceeds 50% limit (${extensionPercentage.toFixed(1)}%)`
                    : `Extension: ${extensionPercentage.toFixed(1)}%`
                  : `Original: ${originalTenure} months, Max: ${maxAllowedTenure} months`
              }
            />

            {newTenure && parseInt(newTenure) > maxAllowedTenure && (
              <Alert variant="error">
                Tenure extension cannot exceed {maxAllowedTenure} months (50% of original {originalTenure} months).
              </Alert>
            )}

            <Input
              label="New Interest Rate (%)"
              type="number"
              step="0.01"
              value={newRate}
              onChange={(e) => setNewRate(e.target.value)}
              placeholder={`Current: ${currentRate}%`}
            />

            <Textarea
              label="Reason for Restructure"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Describe why you need to restructure this loan..."
              rows={4}
              required
            />

            <Alert variant="warning">
              You may be required to provide documentation. An underwriter will review your request and you must acknowledge the terms change before approval.
            </Alert>
          </div>
        </Modal>
      </div>
    </Card>
  );
}

