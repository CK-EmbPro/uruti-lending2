'use client';

import { useState, useEffect } from 'react';
import { customerPortalApi, SchedulePaymentDto, PaymentAmountType, PaymentMethod } from '@/lib/api/customer-portal';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import toast from 'react-hot-toast';
import { Calendar, CreditCard, DollarSign } from 'lucide-react';
import { format } from 'date-fns';

interface SchedulePaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  loanId: string;
  currentBalance?: number;
  nextPaymentAmount?: number;
  onSuccess?: () => void;
}

export function SchedulePaymentModal({
  isOpen,
  onClose,
  loanId,
  currentBalance = 0,
  nextPaymentAmount = 0,
  onSuccess,
}: SchedulePaymentModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<SchedulePaymentDto>({
    amountType: PaymentAmountType.NEXT_INSTALLMENT,
    scheduledDate: format(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'), // Default to 7 days from now
    paymentMethod: PaymentMethod.BANK_ACCOUNT,
    notes: '',
  });

  const [customAmount, setCustomAmount] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      // Reset form when modal opens
      setFormData({
        amountType: PaymentAmountType.NEXT_INSTALLMENT,
        scheduledDate: format(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
        paymentMethod: PaymentMethod.BANK_ACCOUNT,
        notes: '',
      });
      setCustomAmount('');
    }
  }, [isOpen]);

  const calculateAmount = (): number => {
    switch (formData.amountType) {
      case PaymentAmountType.MINIMUM:
      case PaymentAmountType.NEXT_INSTALLMENT:
        return nextPaymentAmount;
      case PaymentAmountType.FULL_BALANCE:
        return currentBalance;
      case PaymentAmountType.CUSTOM:
        return parseFloat(customAmount) || 0;
      default:
        return 0;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const dataToSend: SchedulePaymentDto = {
        ...formData,
        customAmount: formData.amountType === PaymentAmountType.CUSTOM ? parseFloat(customAmount) : undefined,
      };

      // Validate
      if (formData.amountType === PaymentAmountType.CUSTOM) {
        const amount = parseFloat(customAmount);
        if (!amount || amount <= 0) {
          toast.error('Please enter a valid payment amount');
          setIsLoading(false);
          return;
        }
        if (amount > currentBalance) {
          toast.error('Payment amount cannot exceed current balance');
          setIsLoading(false);
          return;
        }
      }

      const scheduledDate = new Date(formData.scheduledDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (scheduledDate < today) {
        toast.error('Scheduled date must be in the future');
        setIsLoading(false);
        return;
      }

      await customerPortalApi.schedulePayment(loanId, dataToSend);
      toast.success('Payment scheduled successfully');
      onSuccess?.();
      onClose();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to schedule payment');
    } finally {
      setIsLoading(false);
    }
  };

  const calculatedAmount = calculateAmount();

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Schedule Payment">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Payment Amount Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Payment Amount
          </label>
          <Select
            value={formData.amountType}
            onChange={(e) => setFormData({ ...formData, amountType: e.target.value as PaymentAmountType })}
          >
            <option value={PaymentAmountType.NEXT_INSTALLMENT}>
              Next Installment (${nextPaymentAmount.toFixed(2)})
            </option>
            <option value={PaymentAmountType.MINIMUM}>
              Minimum Payment (${nextPaymentAmount.toFixed(2)})
            </option>
            <option value={PaymentAmountType.FULL_BALANCE}>
              Full Balance (${currentBalance.toFixed(2)})
            </option>
            <option value={PaymentAmountType.CUSTOM}>Custom Amount</option>
          </Select>
        </div>

        {/* Custom Amount Input */}
        {formData.amountType === PaymentAmountType.CUSTOM && (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Custom Amount
            </label>
            <Input
              type="number"
              step="0.01"
              min="0.01"
              max={currentBalance}
              value={customAmount}
              onChange={(e) => setCustomAmount(e.target.value)}
              placeholder="Enter payment amount"
              required={formData.amountType === PaymentAmountType.CUSTOM}
            />
            <p className="mt-1 text-xs text-gray-500">
              Maximum: ${currentBalance.toFixed(2)}
            </p>
          </div>
        )}

        {/* Calculated Amount Display */}
        {calculatedAmount > 0 && (
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <div>
                <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                  Payment Amount
                </p>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  ${calculatedAmount.toFixed(2)}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Scheduled Date */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            <Calendar className="w-4 h-4 inline mr-1" />
            Scheduled Date
          </label>
          <Input
            type="date"
            value={formData.scheduledDate}
            onChange={(e) => setFormData({ ...formData, scheduledDate: e.target.value })}
            min={format(new Date(), 'yyyy-MM-dd')}
            required
          />
        </div>

        {/* Payment Method */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            <CreditCard className="w-4 h-4 inline mr-1" />
            Payment Method
          </label>
          <Select
            value={formData.paymentMethod}
            onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value as PaymentMethod })}
          >
            <option value={PaymentMethod.BANK_ACCOUNT}>Bank Account (ACH)</option>
            <option value={PaymentMethod.DEBIT_CARD}>Debit Card</option>
            <option value={PaymentMethod.CREDIT_CARD}>Credit Card</option>
          </Select>
        </div>

        {/* Payment Method Details */}
        {formData.paymentMethod === PaymentMethod.BANK_ACCOUNT && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Bank Account Last 4 Digits
              </label>
              <Input
                type="text"
                maxLength={4}
                value={formData.bankAccountLast4 || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    bankAccountLast4: e.target.value.replace(/\D/g, '').slice(0, 4),
                  })
                }
                placeholder="1234"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Routing Number
              </label>
              <Input
                type="text"
                maxLength={9}
                value={formData.bankRoutingNumber || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    bankRoutingNumber: e.target.value.replace(/\D/g, '').slice(0, 9),
                  })
                }
                placeholder="123456789"
                required
              />
            </div>
          </div>
        )}

        {(formData.paymentMethod === PaymentMethod.DEBIT_CARD ||
          formData.paymentMethod === PaymentMethod.CREDIT_CARD) && (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Card Last 4 Digits
            </label>
            <Input
              type="text"
              maxLength={4}
              value={formData.cardLast4 || ''}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  cardLast4: e.target.value.replace(/\D/g, '').slice(0, 4),
                })
              }
              placeholder="1234"
              required
            />
          </div>
        )}

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Notes (Optional)
          </label>
          <Textarea
            value={formData.notes || ''}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            placeholder="Add any notes about this payment..."
            rows={3}
          />
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading || calculatedAmount <= 0}>
            {isLoading ? 'Scheduling...' : 'Schedule Payment'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

