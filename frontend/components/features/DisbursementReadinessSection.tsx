'use client';

import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { Alert } from '@/components/ui/Alert';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { useDisbursementReadiness, useInitiateDisbursement } from '@/lib/hooks/useLoanBooking';
import {
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  Send,
  Loader2,
  DollarSign,
  Calendar,
} from 'lucide-react';
import { format } from 'date-fns';
import { useState } from 'react';
import toast from 'react-hot-toast';

interface DisbursementReadinessSectionProps {
  loanId: string;
}

export function DisbursementReadinessSection({ loanId }: DisbursementReadinessSectionProps) {
  const [showDisburseModal, setShowDisburseModal] = useState(false);
  const [disbursementDate, setDisbursementDate] = useState(
    format(new Date(), 'yyyy-MM-dd')
  );
  const [disbursedAmount, setDisbursedAmount] = useState('');
  const [modeOfPayment, setModeOfPayment] = useState('Direct Deposit');
  const [referenceNumber, setReferenceNumber] = useState('');

  const { data: readiness, isLoading } = useDisbursementReadiness(loanId);
  const initiateDisbursement = useInitiateDisbursement();

  const handleInitiateDisbursement = async () => {
    if (!disbursedAmount || parseFloat(disbursedAmount) <= 0) {
      toast.error('Please enter a valid disbursement amount');
      return;
    }

    try {
      await initiateDisbursement.mutateAsync({
        loanId,
        data: {
          disbursementDate,
          disbursedAmount: parseFloat(disbursedAmount),
          modeOfPayment,
          referenceNumber: referenceNumber || undefined,
        },
      });
      setShowDisburseModal(false);
      setDisbursedAmount('');
      setReferenceNumber('');
    } catch (error) {
      // Error handled by hook
    }
  };

  if (isLoading) {
    return (
      <Card title="Disbursement Readiness">
        <Skeleton className="h-32 w-full" />
      </Card>
    );
  }

  if (!readiness) {
    return (
      <Card title="Disbursement Readiness">
        <Alert variant="error" title="Unable to Load Readiness">
          Could not load disbursement readiness information.
        </Alert>
      </Card>
    );
  }

  const getConditionIcon = (status: string) => {
    switch (status) {
      case 'met':
        return <CheckCircle2 className="w-5 h-5 text-green-600" />;
      case 'pending':
        return <Clock className="w-5 h-5 text-yellow-600" />;
      case 'failed':
        return <XCircle className="w-5 h-5 text-red-600" />;
      default:
        return <AlertCircle className="w-5 h-5 text-gray-400" />;
    }
  };

  const getConditionBadge = (status: string) => {
    switch (status) {
      case 'met':
        return <Badge variant="success">Met</Badge>;
      case 'pending':
        return <Badge variant="warning">Pending</Badge>;
      case 'failed':
        return <Badge variant="error">Failed</Badge>;
      default:
        return <Badge variant="info">Unknown</Badge>;
    }
  };

  return (
    <Card title="Disbursement Readiness">
      <div className="space-y-4">
        {/* Overall Status */}
        <div className="flex items-center justify-between p-4 rounded-lg bg-gray-50">
          <div className="flex items-center gap-3">
            {readiness.ready ? (
              <CheckCircle2 className="w-6 h-6 text-green-600" />
            ) : (
              <AlertCircle className="w-6 h-6 text-yellow-600" />
            )}
            <div>
              <div className="font-semibold text-gray-900">
                {readiness.ready ? 'Ready for Disbursement' : 'Not Ready for Disbursement'}
              </div>
              <div className="text-sm text-gray-600">
                {readiness.conditions.filter((c) => c.status === 'met').length} of{' '}
                {readiness.conditions.length} conditions met
              </div>
            </div>
          </div>
          {readiness.canDisburse && (
            <Button
              onClick={() => setShowDisburseModal(true)}
              size="sm"
            >
              <Send className="w-4 h-4 mr-2" />
              Initiate Disbursement
            </Button>
          )}
        </div>

        {/* Conditions List */}
        <div className="space-y-3">
          <div className="text-sm font-semibold text-gray-900">Conditions</div>
          {readiness.conditions.map((condition, index) => (
            <div
              key={index}
              className="flex items-start gap-3 p-3 rounded-lg border border-gray-200 bg-white"
            >
              {getConditionIcon(condition.status)}
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <div className="font-medium text-sm text-gray-900">{condition.name}</div>
                  {getConditionBadge(condition.status)}
                </div>
                <div className="text-xs text-gray-600">{condition.message}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Warning if not ready */}
        {!readiness.ready && (
          <Alert variant="warning" title="Disbursement Not Ready">
            Please ensure all conditions are met before initiating disbursement. Review the
            conditions above and complete any pending requirements.
          </Alert>
        )}

        {/* Disbursement Modal */}
        <Modal
          isOpen={showDisburseModal}
          onClose={() => {
            setShowDisburseModal(false);
            setDisbursedAmount('');
            setReferenceNumber('');
          }}
          title="Initiate Disbursement"
          size="md"
          footer={
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  setShowDisburseModal(false);
                  setDisbursedAmount('');
                  setReferenceNumber('');
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleInitiateDisbursement}
                disabled={
                  !disbursedAmount ||
                  parseFloat(disbursedAmount) <= 0 ||
                  initiateDisbursement.isPending
                }
              >
                {initiateDisbursement.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Initiate Disbursement
                  </>
                )}
              </Button>
            </div>
          }
        >
          <div className="space-y-4">
            <Alert variant="info">
              This will initiate the disbursement process and transfer funds to the borrower
              account. Ensure all conditions are met before proceeding.
            </Alert>

            <Input
              label="Disbursement Date"
              type="date"
              value={disbursementDate}
              onChange={(e) => setDisbursementDate(e.target.value)}
              required
            />

            <Input
              label="Disbursed Amount"
              type="number"
              step="0.01"
              value={disbursedAmount}
              onChange={(e) => setDisbursedAmount(e.target.value)}
              placeholder="0.00"
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
                <option value="Direct Deposit">Direct Deposit</option>
                <option value="Check">Check</option>
                <option value="Third-party Payment">Third-party Payment</option>
                <option value="Wire Transfer">Wire Transfer</option>
              </select>
            </div>

            <Input
              label="Reference Number (Optional)"
              value={referenceNumber}
              onChange={(e) => setReferenceNumber(e.target.value)}
              placeholder="Enter reference number"
            />
          </div>
        </Modal>
      </div>
    </Card>
  );
}

