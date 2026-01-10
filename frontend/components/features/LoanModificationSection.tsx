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
  useModificationsForLoan,
  useCreateModification,
} from '@/lib/hooks/useAccountManagement';
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
} from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

interface LoanModificationSectionProps {
  loanId: string;
}

export function LoanModificationSection({ loanId }: LoanModificationSectionProps) {
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [modificationType, setModificationType] = useState<'Rate Reduction' | 'Term Extension' | 'Payment Holiday' | 'Payment Reduction' | 'Other'>('Rate Reduction');
  const [reason, setReason] = useState('');
  const [newInterestRate, setNewInterestRate] = useState('');
  const [newTermMonths, setNewTermMonths] = useState('');
  const [paymentHolidayMonths, setPaymentHolidayMonths] = useState('');
  const [newPaymentAmount, setNewPaymentAmount] = useState('');

  const { data: modifications, isLoading } = useModificationsForLoan(loanId);
  const createModification = useCreateModification();

  const handleCreateRequest = async () => {
    if (!reason.trim()) {
      toast.error('Please provide a reason for the modification');
      return;
    }

    // Validate type-specific fields
    if (modificationType === 'Rate Reduction' && !newInterestRate) {
      toast.error('Please enter the new interest rate');
      return;
    }
    if (modificationType === 'Term Extension' && !newTermMonths) {
      toast.error('Please enter the new term in months');
      return;
    }
    if (modificationType === 'Payment Holiday' && !paymentHolidayMonths) {
      toast.error('Please enter the number of months for payment holiday');
      return;
    }
    if (modificationType === 'Payment Reduction' && !newPaymentAmount) {
      toast.error('Please enter the new payment amount');
      return;
    }

    try {
      await createModification.mutateAsync({
        loanId,
        modificationType,
        reason,
        newInterestRate: modificationType === 'Rate Reduction' ? parseFloat(newInterestRate) : undefined,
        newTermMonths: modificationType === 'Term Extension' ? parseInt(newTermMonths) : undefined,
        paymentHolidayMonths: modificationType === 'Payment Holiday' ? parseInt(paymentHolidayMonths) : undefined,
        newPaymentAmount: modificationType === 'Payment Reduction' ? parseFloat(newPaymentAmount) : undefined,
      });
      setShowRequestModal(false);
      setReason('');
      setNewInterestRate('');
      setNewTermMonths('');
      setPaymentHolidayMonths('');
      setNewPaymentAmount('');
    } catch (error) {
      // Error handled by hook
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; variant: 'success' | 'warning' | 'error' | 'info' }> = {
      Pending: { label: 'Pending', variant: 'warning' },
      'Under Review': { label: 'Under Review', variant: 'info' },
      Approved: { label: 'Approved', variant: 'success' },
      Rejected: { label: 'Rejected', variant: 'error' },
      Executed: { label: 'Executed', variant: 'success' },
      Cancelled: { label: 'Cancelled', variant: 'error' },
    };

    const statusInfo = statusMap[status] || { label: status, variant: 'info' as const };
    return <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>;
  };

  if (isLoading) {
    return (
      <Card title="Loan Modification">
        <Skeleton className="h-32 w-full" />
      </Card>
    );
  }

  return (
    <Card title="Loan Modification">
      <div className="space-y-4">
        {/* Request Button */}
        <Button
          variant="outline"
          onClick={() => setShowRequestModal(true)}
          className="w-full"
        >
          <Plus className="w-4 h-4 mr-2" />
          Request Modification
        </Button>

        {/* Modifications List */}
        {modifications && modifications.length > 0 ? (
          <div className="space-y-3">
            <div className="text-sm font-semibold text-gray-900">Modification Requests</div>
            {modifications.map((modification) => (
              <div
                key={modification.id}
                className="p-3 rounded-lg border border-gray-200 bg-white"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <FileEdit className="w-4 h-4 text-gray-400" />
                    <span className="font-medium text-sm">{modification.modificationType}</span>
                  </div>
                  {getStatusBadge(modification.status)}
                </div>
                <div className="text-xs text-gray-600 mb-2">{modification.reason}</div>
                <div className="text-xs text-gray-500">
                  Requested: {format(new Date(modification.requestedDate), 'MMM dd, yyyy')}
                </div>
                {modification.status === 'Rejected' && modification.rejectionReason && (
                  <Alert variant="error" className="mt-2 text-xs">
                    {modification.rejectionReason}
                  </Alert>
                )}
              </div>
            ))}
          </div>
        ) : (
          <Alert variant="info" title="No Modifications">
            No modification requests have been submitted for this loan.
          </Alert>
        )}

        {/* Request Modal */}
        <Modal
          isOpen={showRequestModal}
          onClose={() => {
            setShowRequestModal(false);
            setModificationType('Rate Reduction');
            setReason('');
            setNewInterestRate('');
            setNewTermMonths('');
            setPaymentHolidayMonths('');
            setNewPaymentAmount('');
          }}
          title="Request Loan Modification"
          size="lg"
          footer={
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  setShowRequestModal(false);
                  setModificationType('Rate Reduction');
                  setReason('');
                  setNewInterestRate('');
                  setNewTermMonths('');
                  setPaymentHolidayMonths('');
                  setNewPaymentAmount('');
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateRequest}
                disabled={
                  !reason.trim() ||
                  (modificationType === 'Rate Reduction' && !newInterestRate) ||
                  (modificationType === 'Term Extension' && !newTermMonths) ||
                  (modificationType === 'Payment Holiday' && !paymentHolidayMonths) ||
                  (modificationType === 'Payment Reduction' && !newPaymentAmount) ||
                  createModification.isPending
                }
              >
                {createModification.isPending ? (
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
              Submit a loan modification request if you're experiencing financial hardship. An underwriter will review your request.
            </Alert>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Modification Type
              </label>
              <select
                value={modificationType}
                onChange={(e) => setModificationType(e.target.value as any)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="Rate Reduction">Rate Reduction</option>
                <option value="Term Extension">Term Extension</option>
                <option value="Payment Holiday">Payment Holiday</option>
                <option value="Payment Reduction">Payment Reduction</option>
                <option value="Other">Other</option>
              </select>
            </div>

            {modificationType === 'Rate Reduction' && (
              <Input
                label="New Interest Rate (%)"
                type="number"
                step="0.01"
                value={newInterestRate}
                onChange={(e) => setNewInterestRate(e.target.value)}
                placeholder="5.5"
                required
              />
            )}

            {modificationType === 'Term Extension' && (
              <Input
                label="New Term (Months)"
                type="number"
                value={newTermMonths}
                onChange={(e) => setNewTermMonths(e.target.value)}
                placeholder="60"
                required
              />
            )}

            {modificationType === 'Payment Holiday' && (
              <Input
                label="Payment Holiday (Months)"
                type="number"
                value={paymentHolidayMonths}
                onChange={(e) => setPaymentHolidayMonths(e.target.value)}
                placeholder="3"
                required
              />
            )}

            {modificationType === 'Payment Reduction' && (
              <Input
                label="New Payment Amount"
                type="number"
                step="0.01"
                value={newPaymentAmount}
                onChange={(e) => setNewPaymentAmount(e.target.value)}
                placeholder="300.00"
                required
              />
            )}

            <Input
              label="Reason for Modification"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Describe your financial hardship..."
              required
            />

            <Alert variant="warning">
              You may be required to provide documentation of financial hardship. An underwriter will review your request.
            </Alert>
          </div>
        </Modal>
      </div>
    </Card>
  );
}

