'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { Alert } from '@/components/ui/Alert';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import {
  usePartialPayments,
  useSuspensePayments,
  useCreatePartialPayment,
  useApplyPartialPayment,
} from '@/lib/hooks/usePaymentProcessing';
import {
  DollarSign,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Plus,
  ArrowRight,
} from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

interface PartialPaymentSectionProps {
  loanId: string;
  nextPaymentAmount?: number;
}

export function PartialPaymentSection({ loanId, nextPaymentAmount = 0 }: PartialPaymentSectionProps) {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [selectedPaymentId, setSelectedPaymentId] = useState<string | null>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentDate, setPaymentDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [modeOfPayment, setModeOfPayment] = useState('ACH');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [assessLateFee, setAssessLateFee] = useState(false);
  const [applyWithLateFee, setApplyWithLateFee] = useState(false);

  const { data: partialPayments, isLoading } = usePartialPayments(loanId);
  const { data: suspensePayments } = useSuspensePayments(loanId);
  const createPartialPayment = useCreatePartialPayment();
  const applyPartialPayment = useApplyPartialPayment();

  const handleCreatePartialPayment = async () => {
    if (!paymentAmount || parseFloat(paymentAmount) <= 0) {
      toast.error('Please enter a valid payment amount');
      return;
    }

    if (parseFloat(paymentAmount) >= nextPaymentAmount) {
      toast.error('Payment amount must be less than required amount for partial payment');
      return;
    }

    try {
      await createPartialPayment.mutateAsync({
        loanId,
        amount: parseFloat(paymentAmount),
        requiredAmount: nextPaymentAmount,
        paymentDate,
        modeOfPayment,
        referenceNumber: referenceNumber || undefined,
        assessLateFee,
      });
      setShowCreateModal(false);
      setPaymentAmount('');
      setReferenceNumber('');
      setAssessLateFee(false);
    } catch (error) {
      // Error handled by hook
    }
  };

  const handleApplyPartialPayment = async () => {
    if (!selectedPaymentId) return;

    try {
      await applyPartialPayment.mutateAsync({
        partialPaymentId: selectedPaymentId,
        data: { applyWithLateFee },
      });
      setShowApplyModal(false);
      setSelectedPaymentId(null);
      setApplyWithLateFee(false);
    } catch (error) {
      // Error handled by hook
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; variant: 'success' | 'warning' | 'error' | 'info' }> = {
      'In Suspense': { label: 'In Suspense', variant: 'warning' },
      Applied: { label: 'Applied', variant: 'success' },
      Refunded: { label: 'Refunded', variant: 'error' },
    };

    const statusInfo = statusMap[status] || { label: status, variant: 'info' as const };
    return <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>;
  };

  if (isLoading) {
    return (
      <Card title="Partial Payments">
        <Skeleton className="h-32 w-full" />
      </Card>
    );
  }

  const totalSuspense = suspensePayments?.reduce((sum, pp) => sum + Number(pp.accumulatedAmount), 0) || 0;
  const canApply = totalSuspense >= nextPaymentAmount;

  return (
    <Card title="Partial Payments">
      <div className="space-y-4">
        {/* Suspense Summary */}
        {totalSuspense > 0 && (
          <div className="p-4 rounded-lg border-2 border-yellow-200 bg-yellow-50">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-yellow-600" />
                <div className="font-semibold text-gray-900">Amount in Suspense</div>
              </div>
              <div className="text-2xl font-bold text-yellow-700">
                ${totalSuspense.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>
            <div className="text-sm text-gray-600 mb-3">
              Required: ${nextPaymentAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            {canApply && (
              <Button
                size="sm"
                onClick={() => {
                  if (suspensePayments && suspensePayments.length > 0) {
                    setSelectedPaymentId(suspensePayments[0].id);
                    setShowApplyModal(true);
                  }
                }}
                className="w-full"
              >
                <ArrowRight className="w-4 h-4 mr-2" />
                Apply Payment
              </Button>
            )}
          </div>
        )}

        {/* Partial Payments List */}
        {partialPayments && partialPayments.length > 0 ? (
          <div className="space-y-3">
            <div className="text-sm font-semibold text-gray-900">Payment History</div>
            {partialPayments.map((payment) => (
              <div
                key={payment.id}
                className="p-3 rounded-lg border border-gray-200 bg-white"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-gray-400" />
                    <span className="font-medium text-sm">
                      ${payment.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                  {getStatusBadge(payment.status)}
                </div>
                <div className="text-xs text-gray-500">
                  {format(new Date(payment.paymentDate), 'MMM dd, yyyy')}
                  {payment.status === 'In Suspense' && (
                    <span className="ml-2">
                      (Accumulated: ${payment.accumulatedAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })})
                    </span>
                  )}
                </div>
                {payment.lateFeeAssessed && (
                  <div className="text-xs text-red-600 mt-1">
                    Late Fee: ${payment.lateFeeAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <Alert variant="info" title="No Partial Payments">
            All payments have been applied or no partial payments have been made.
          </Alert>
        )}

        {/* Create Partial Payment Button */}
        <Button
          variant="outline"
          onClick={() => setShowCreateModal(true)}
          className="w-full flex items-center gap-1 "
        >
          <Plus className="w-4 h-4 mr-2" />
          Create Partial Payment
        </Button>

        {/* Create Partial Payment Modal */}
        <Modal
          isOpen={showCreateModal}
          onClose={() => {
            setShowCreateModal(false);
            setPaymentAmount('');
            setReferenceNumber('');
            setAssessLateFee(false);
          }}
          title="Create Partial Payment"
          size="md"
          footer={
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  setShowCreateModal(false);
                  setPaymentAmount('');
                  setReferenceNumber('');
                  setAssessLateFee(false);
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreatePartialPayment}
                disabled={
                  !paymentAmount ||
                  parseFloat(paymentAmount) <= 0 ||
                  parseFloat(paymentAmount) >= nextPaymentAmount ||
                  createPartialPayment.isPending
                }
              >
                {createPartialPayment.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Payment
                  </>
                )}
              </Button>
            </div>
          }
        >
          <div className="space-y-4">
            <Alert variant="info">
              Partial payments are held in suspense until sufficient amount is accumulated to make a full payment.
            </Alert>

            <div className="p-3 rounded-lg bg-gray-50">
              <div className="text-sm text-gray-600 mb-1">Required Amount</div>
              <div className="text-lg font-bold">
                ${nextPaymentAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>

            <Input
              label="Payment Amount"
              type="number"
              step="0.01"
              value={paymentAmount}
              onChange={(e) => setPaymentAmount(e.target.value)}
              placeholder="0.00"
              required
            />

            <Input
              label="Payment Date"
              type="date"
              value={paymentDate}
              onChange={(e) => setPaymentDate(e.target.value)}
              required
            />

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Mode of Payment
              </label>
              <select
                value={modeOfPayment}
                onChange={(e) => setModeOfPayment(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="ACH">ACH</option>
                <option value="Check">Check</option>
                <option value="Card">Card</option>
                <option value="Wire">Wire Transfer</option>
                <option value="Cash">Cash</option>
              </select>
            </div>

            <Input
              label="Reference Number (Optional)"
              value={referenceNumber}
              onChange={(e) => setReferenceNumber(e.target.value)}
              placeholder="Enter reference number"
            />

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={assessLateFee}
                onChange={(e) => setAssessLateFee(e.target.checked)}
                className="w-4 h-4"
              />
              <span className="text-sm text-gray-700">Assess Late Fee</span>
            </label>
          </div>
        </Modal>

        {/* Apply Partial Payment Modal */}
        <Modal
          isOpen={showApplyModal}
          onClose={() => {
            setShowApplyModal(false);
            setSelectedPaymentId(null);
            setApplyWithLateFee(false);
          }}
          title="Apply Partial Payment"
          size="md"
          footer={
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  setShowApplyModal(false);
                  setSelectedPaymentId(null);
                  setApplyWithLateFee(false);
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleApplyPartialPayment}
                disabled={applyPartialPayment.isPending}
              >
                {applyPartialPayment.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Applying...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Apply Payment
                  </>
                )}
              </Button>
            </div>
          }
        >
          <div className="space-y-4">
            <Alert variant="info">
              Apply the accumulated partial payments to the loan. This will update the loan balance and create a repayment record.
            </Alert>

            {totalSuspense > 0 && (
              <div className="p-3 rounded-lg bg-gray-50">
                <div className="text-sm text-gray-600 mb-1">Total in Suspense</div>
                <div className="text-2xl font-bold">
                  ${totalSuspense.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </div>
            )}

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={applyWithLateFee}
                onChange={(e) => setApplyWithLateFee(e.target.checked)}
                className="w-4 h-4"
              />
              <span className="text-sm text-gray-700">Apply with Late Fee</span>
            </label>
          </div>
        </Modal>
      </div>
    </Card>
  );
}

