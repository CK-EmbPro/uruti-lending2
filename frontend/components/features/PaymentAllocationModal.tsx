'use client';

import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import { useAllocatePayment } from '@/lib/hooks/usePaymentProcessing';
import { DollarSign, Loader2, Percent, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

interface PaymentAllocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  repaymentId: string;
  totalAmount: number;
  isEarlyPayment?: boolean;
  isExtraPayment?: boolean;
}

export function PaymentAllocationModal({
  isOpen,
  onClose,
  repaymentId,
  totalAmount,
  isEarlyPayment = false,
  isExtraPayment = false,
}: PaymentAllocationModalProps) {
  const [allocationPreference, setAllocationPreference] = useState<
    'Principal First' | 'Interest First' | 'Proportional' | 'Principal Only'
  >('Proportional');
  const [remarks, setRemarks] = useState('');

  const allocatePayment = useAllocatePayment();

  const handleAllocate = async () => {
    try {
      await allocatePayment.mutateAsync({
        repaymentId,
        totalAmount,
        allocationPreference,
        isEarlyPayment,
        isExtraPayment,
        remarks: remarks || undefined,
      });
      onClose();
      setRemarks('');
    } catch (error) {
      // Error handled by hook
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Allocate Payment"
      size="md"
      footer={
        <div className="flex gap-2 justify-end">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleAllocate} disabled={allocatePayment.isPending}>
            {allocatePayment.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Allocating...
              </>
            ) : (
              <>
                <Percent className="w-4 h-4 mr-2" />
                Allocate Payment
              </>
            )}
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        {(isEarlyPayment || isExtraPayment) && (
          <Alert variant="info" title={isEarlyPayment ? 'Early Payment' : 'Extra Payment'}>
            This payment will be allocated according to your preference. Prepayment penalties may apply.
          </Alert>
        )}

        <div className="p-3 rounded-lg bg-gray-50">
          <div className="text-sm text-gray-600 mb-1">Total Payment Amount</div>
          <div className="text-2xl font-bold">
            ${totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Allocation Preference
          </label>
          <select
            value={allocationPreference}
            onChange={(e) =>
              setAllocationPreference(
                e.target.value as 'Principal First' | 'Interest First' | 'Proportional' | 'Principal Only'
              )
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
          >
            <option value="Proportional">Proportional (Default)</option>
            <option value="Principal First">Principal First</option>
            <option value="Interest First">Interest First</option>
            <option value="Principal Only">Principal Only</option>
          </select>
        </div>

        <div className="space-y-2 text-sm text-gray-600">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <div>
              <strong>Proportional:</strong> Allocates proportionally based on outstanding amounts
            </div>
          </div>
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <div>
              <strong>Principal First:</strong> Pays principal, then interest, then penalties
            </div>
          </div>
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <div>
              <strong>Interest First:</strong> Pays interest, then principal, then penalties
            </div>
          </div>
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <div>
              <strong>Principal Only:</strong> Applies entire payment to principal
            </div>
          </div>
        </div>

        <Input
          label="Remarks (Optional)"
          value={remarks}
          onChange={(e) => setRemarks(e.target.value)}
          placeholder="Enter any remarks"
        />
      </div>
    </Modal>
  );
}

