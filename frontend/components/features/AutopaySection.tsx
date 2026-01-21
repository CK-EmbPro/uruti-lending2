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
  useAutopayForLoan,
  useEnrollAutopay,
  useCancelAutopay,
  useVerifyAccount,
} from '@/lib/hooks/usePaymentProcessing';
import {
  CreditCard,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  Loader2,
  Plus,
  Settings,
  Shield,
} from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

interface AutopaySectionProps {
  loanId: string;
}

export function AutopaySection({ loanId }: AutopaySectionProps) {
  const [showEnrollModal, setShowEnrollModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancellationReason, setCancellationReason] = useState('');

  // Form state
  const [amountType, setAmountType] = useState<'Fixed Amount' | 'Minimum Payment' | 'Full Balance'>('Minimum Payment');
  const [fixedAmount, setFixedAmount] = useState('');
  const [bankAccountNumber, setBankAccountNumber] = useState('');
  const [bankRoutingNumber, setBankRoutingNumber] = useState('');
  const [bankAccountType, setBankAccountType] = useState('Checking');
  const [bankName, setBankName] = useState('');
  const [accountHolderName, setAccountHolderName] = useState('');

  const { data: enrollment, isLoading } = useAutopayForLoan(loanId);
  const enrollAutopay = useEnrollAutopay();
  const cancelAutopay = useCancelAutopay();
  const verifyAccount = useVerifyAccount();

  const handleEnroll = async () => {
    if (!bankAccountNumber || !bankRoutingNumber || !bankName || !accountHolderName) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (amountType === 'Fixed Amount' && !fixedAmount) {
      toast.error('Please enter a fixed amount');
      return;
    }

    try {
      await enrollAutopay.mutateAsync({
        loanId,
        amountType,
        fixedAmount: amountType === 'Fixed Amount' ? parseFloat(fixedAmount) : undefined,
        bankAccountNumber: bankAccountNumber.slice(-4), // Last 4 digits
        bankRoutingNumber,
        bankAccountType,
        bankName,
        accountHolderName,
      });
      setShowEnrollModal(false);
      // Reset form
      setAmountType('Minimum Payment');
      setFixedAmount('');
      setBankAccountNumber('');
      setBankRoutingNumber('');
      setBankName('');
      setAccountHolderName('');
    } catch (error) {
      // Error handled by hook
    }
  };

  const handleCancel = async () => {
    if (!enrollment?.id || !cancellationReason.trim()) {
      toast.error('Please enter a cancellation reason');
      return;
    }

    try {
      await cancelAutopay.mutateAsync({
        enrollmentId: enrollment.id,
        data: { cancellationReason },
      });
      setShowCancelModal(false);
      setCancellationReason('');
    } catch (error) {
      // Error handled by hook
    }
  };

  const handleVerify = async () => {
    if (!enrollment?.id) return;
    try {
      await verifyAccount.mutateAsync(enrollment.id);
    } catch (error) {
      // Error handled by hook
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; variant: 'success' | 'warning' | 'error' | 'info' }> = {
      Active: { label: 'Active', variant: 'success' },
      Suspended: { label: 'Suspended', variant: 'warning' },
      Cancelled: { label: 'Cancelled', variant: 'error' },
      Failed: { label: 'Failed', variant: 'error' },
    };

    const statusInfo = statusMap[status] || { label: status, variant: 'info' as const };
    return <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>;
  };

  if (isLoading) {
    return (
      <Card title="Autopay">
        <Skeleton className="h-32 w-full" />
      </Card>
    );
  }

  if (!enrollment) {
    return (
      <Card title="Autopay">
        <div className="space-y-4">
          <Alert variant="info" title="No Autopay Enrollment">
            Enroll in autopay to automatically make payments on your due date.
          </Alert>
          <Button onClick={() => setShowEnrollModal(true)} className="w-full flex items-center gap-1">
            <Plus className="w-4 h-4 mr-2" />
            Enroll in Autopay
          </Button>
        </div>

        {/* Enroll Modal */}
        <Modal
          isOpen={showEnrollModal}
          onClose={() => {
            setShowEnrollModal(false);
            setAmountType('Minimum Payment');
            setFixedAmount('');
            setBankAccountNumber('');
            setBankRoutingNumber('');
            setBankName('');
            setAccountHolderName('');
          }}
          title="Enroll in Autopay"
          size="lg"
          footer={
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  setShowEnrollModal(false);
                  setAmountType('Minimum Payment');
                  setFixedAmount('');
                  setBankAccountNumber('');
                  setBankRoutingNumber('');
                  setBankName('');
                  setAccountHolderName('');
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleEnroll}
                disabled={
                  !bankAccountNumber ||
                  !bankRoutingNumber ||
                  !bankName ||
                  !accountHolderName ||
                  (amountType === 'Fixed Amount' && !fixedAmount) ||
                  enrollAutopay.isPending
                }
              >
                {enrollAutopay.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Enrolling...
                  </>
                ) : (
                  <>
                    <CreditCard className="w-4 h-4 mr-2" />
                    Enroll
                  </>
                )}
              </Button>
            </div>
          }
        >
          <div className="space-y-4">
            <Alert variant="info">
              Link your bank account to automatically make payments on your due date.
            </Alert>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Payment Amount Type
              </label>
              <select
                value={amountType}
                onChange={(e) => setAmountType(e.target.value as any)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="Minimum Payment">Minimum Payment</option>
                <option value="Fixed Amount">Fixed Amount</option>
                <option value="Full Balance">Full Balance</option>
              </select>
            </div>

            {amountType === 'Fixed Amount' && (
              <Input
                label="Fixed Amount"
                type="number"
                step="0.01"
                value={fixedAmount}
                onChange={(e) => setFixedAmount(e.target.value)}
                placeholder="0.00"
                required
              />
            )}

            <Input
              label="Account Holder Name"
              value={accountHolderName}
              onChange={(e) => setAccountHolderName(e.target.value)}
              placeholder="John Doe"
              required
            />

            <Input
              label="Bank Name"
              value={bankName}
              onChange={(e) => setBankName(e.target.value)}
              placeholder="Chase Bank"
              required
            />

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Account Type
                </label>
                <select
                  value={bankAccountType}
                  onChange={(e) => setBankAccountType(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  <option value="Checking">Checking</option>
                  <option value="Savings">Savings</option>
                </select>
              </div>
            </div>

            <Input
              label="Bank Account Number (Last 4 digits)"
              value={bankAccountNumber}
              onChange={(e) => setBankAccountNumber(e.target.value)}
              placeholder="1234"
              maxLength={4}
              required
            />

            <Input
              label="Routing Number"
              value={bankRoutingNumber}
              onChange={(e) => setBankRoutingNumber(e.target.value)}
              placeholder="123456789"
              required
            />

            <Alert variant="warning">
              Your bank account will be verified with micro-deposits before autopay is activated.
            </Alert>
          </div>
        </Modal>
      </Card>
    );
  }

  return (
    <Card title="Autopay">
      <div className="space-y-4">
        {/* Status Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CreditCard className="w-6 h-6 text-primary" />
            <div>
              <div className="font-semibold text-gray-900">Autopay Status</div>
              <div className="text-sm text-gray-600">{getStatusBadge(enrollment.status)}</div>
            </div>
          </div>
          {!enrollment.isVerified && enrollment.status === 'Active' && (
            <Button size="sm" variant="outline" onClick={handleVerify} disabled={verifyAccount.isPending}>
              {verifyAccount.isPending ? (
                <>
                  <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                  Verifying...
                </>
              ) : (
                <>
                  <Shield className="w-3 h-3 mr-1" />
                  Verify Account
                </>
              )}
            </Button>
          )}
        </div>

        {/* Enrollment Details */}
        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200">
          <div>
            <div className="text-xs text-gray-500 mb-1">Payment Type</div>
            <div className="text-sm font-medium">{enrollment.amountType}</div>
          </div>
          {enrollment.fixedAmount && (
            <div>
              <div className="text-xs text-gray-500 mb-1">Fixed Amount</div>
              <div className="text-sm font-medium">
                ${enrollment.fixedAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>
          )}
          <div>
            <div className="text-xs text-gray-500 mb-1">Bank Account</div>
            <div className="text-sm font-medium">****{enrollment.bankAccountNumber}</div>
          </div>
          <div>
            <div className="text-xs text-gray-500 mb-1">Account Type</div>
            <div className="text-sm font-medium">{enrollment.bankAccountType}</div>
          </div>
          {enrollment.nextPaymentDate && (
            <div>
              <div className="text-xs text-gray-500 mb-1">Next Payment</div>
              <div className="text-sm font-medium">
                {format(new Date(enrollment.nextPaymentDate), 'MMM dd, yyyy')}
              </div>
            </div>
          )}
          <div>
            <div className="text-xs text-gray-500 mb-1">Payments</div>
            <div className="text-sm font-medium">
              {enrollment.successfulPayments} successful, {enrollment.failedPayments} failed
            </div>
          </div>
        </div>

        {/* Verification Status */}
        {!enrollment.isVerified && (
          <Alert variant="warning" title="Account Not Verified">
            Please verify your bank account to activate autopay.
          </Alert>
        )}

        {/* Failure Reason */}
        {enrollment.lastFailureReason && (
          <Alert variant="error" title="Last Payment Failed">
            {enrollment.lastFailureReason}
          </Alert>
        )}

        {/* Actions */}
        {enrollment.status === 'Active' && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowCancelModal(true)}
            className="w-full"
          >
            <XCircle className="w-4 h-4 mr-2" />
            Cancel Autopay
          </Button>
        )}

        {/* Cancel Modal */}
        <Modal
          isOpen={showCancelModal}
          onClose={() => {
            setShowCancelModal(false);
            setCancellationReason('');
          }}
          title="Cancel Autopay"
          size="md"
          footer={
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  setShowCancelModal(false);
                  setCancellationReason('');
                }}
              >
                Close
              </Button>
              <Button
                variant="danger"
                onClick={handleCancel}
                disabled={!cancellationReason.trim() || cancelAutopay.isPending}
              >
                {cancelAutopay.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Cancelling...
                  </>
                ) : (
                  <>
                    <XCircle className="w-4 h-4 mr-2" />
                    Cancel Autopay
                  </>
                )}
              </Button>
            </div>
          }
        >
          <div className="space-y-4">
            <Alert variant="warning">
              This will cancel your autopay enrollment. You will need to manually make payments after cancellation.
            </Alert>
            <Input
              label="Cancellation Reason"
              value={cancellationReason}
              onChange={(e) => setCancellationReason(e.target.value)}
              placeholder="Enter reason for cancellation"
              required
            />
          </div>
        </Modal>
      </div>
    </Card>
  );
}

