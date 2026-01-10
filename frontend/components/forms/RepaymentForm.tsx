'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useLoan } from '@/lib/hooks/useLoan';
import { useCalculateRepaymentAmounts } from '@/lib/hooks/useRepayment';
import { useEffect, useState } from 'react';
import { RepaymentType } from '@/lib/types/repayment-types';

const repaymentSchema = z.object({
  loanId: z.string().min(1, 'Loan is required'),
  postingDate: z.string().min(1, 'Posting date is required'),
  valueDate: z.string().optional(),
  amountPaid: z.number().positive('Amount must be positive'),
  repaymentType: z.string().min(1, 'Repayment type is required'),
  modeOfPayment: z.string().optional(),
  referenceNumber: z.string().optional(),
});

type RepaymentFormData = z.infer<typeof repaymentSchema>;

interface RepaymentFormProps {
  loanId: string;
  initialData?: Partial<RepaymentFormData>;
  onSubmit: (data: RepaymentFormData) => Promise<void>;
  isLoading?: boolean;
}

export function RepaymentForm({
  loanId,
  initialData,
  onSubmit,
  isLoading = false,
}: RepaymentFormProps) {
  const { data: loan } = useLoan(loanId);
  const calculateAmounts = useCalculateRepaymentAmounts();
  const [calculatedAmounts, setCalculatedAmounts] = useState<any>(null);

  const form = useForm<RepaymentFormData>({
    resolver: zodResolver(repaymentSchema),
    defaultValues: {
      loanId,
      postingDate: new Date().toISOString().split('T')[0],
      valueDate: new Date().toISOString().split('T')[0],
      repaymentType: 'Normal Repayment',
      amountPaid: 0,
      ...initialData,
    },
  });

  const valueDate = form.watch('valueDate');
  const repaymentType = form.watch('repaymentType');

  // Auto-calculate amounts when value date or repayment type changes
  useEffect(() => {
    if (valueDate && loanId) {
      const timeoutId = setTimeout(async () => {
        try {
          const result = await calculateAmounts.mutateAsync({
            loanId,
            valueDate,
            repaymentType: repaymentType || 'Normal Repayment',
          });
          
          // Only set if we got valid data (not empty result)
          if (result && result.payableAmount !== undefined) {
            setCalculatedAmounts(result);
            
            // Auto-fill amounts if calculation succeeded
            if (result.payableAmount > 0) {
              form.setValue('amountPaid', result.payableAmount);
            }
          }
        } catch (error) {
          // Silently fail - calculation endpoint might not be available yet
          // User can still manually enter amounts
        }
      }, 500); // Debounce

      return () => clearTimeout(timeoutId);
    }
  }, [valueDate, repaymentType, loanId]);

  const handleSubmit = form.handleSubmit(async (data) => {
    await onSubmit(data);
  });

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card title="Repayment Information">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Loan ID"
            value={loanId}
            disabled
            {...form.register('loanId')}
          />

          <Select
            label="Repayment Type"
            options={RepaymentType.options}
            {...form.register('repaymentType')}
            required
            error={form.formState.errors.repaymentType?.message}
          />

          <Input
            label="Posting Date"
            type="date"
            {...form.register('postingDate')}
            required
            error={form.formState.errors.postingDate?.message}
          />

          <Input
            label="Value Date"
            type="date"
            {...form.register('valueDate')}
            error={form.formState.errors.valueDate?.message}
          />

          <Input
            label="Amount Paid"
            type="number"
            step="0.01"
            {...form.register('amountPaid', { valueAsNumber: true })}
            required
            error={form.formState.errors.amountPaid?.message}
          />

          <Input
            label="Mode of Payment"
            {...form.register('modeOfPayment')}
            error={form.formState.errors.modeOfPayment?.message}
          />

          <Input
            label="Reference Number"
            {...form.register('referenceNumber')}
            error={form.formState.errors.referenceNumber?.message}
          />
        </div>
      </Card>

      {calculatedAmounts && (
        <Card title="Calculated Amounts">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-gray-600">Pending Principal</p>
              <p className="text-lg font-semibold">
                ${calculatedAmounts.pendingPrincipalAmount?.toLocaleString() || '0'}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Payable Principal</p>
              <p className="text-lg font-semibold">
                ${calculatedAmounts.payablePrincipalAmount?.toLocaleString() || '0'}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Interest</p>
              <p className="text-lg font-semibold text-orange-600">
                ${calculatedAmounts.interestAmount?.toLocaleString() || '0'}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Penalty</p>
              <p className="text-lg font-semibold text-red-600">
                ${calculatedAmounts.penaltyAmount?.toLocaleString() || '0'}
              </p>
            </div>
            <div className="col-span-2 md:col-span-4">
              <p className="text-sm text-gray-600">Total Payable</p>
              <p className="text-2xl font-bold text-green-600">
                ${calculatedAmounts.payableAmount?.toLocaleString() || '0'}
              </p>
            </div>
          </div>
        </Card>
      )}

      {loan && (
        <Card title="Loan Summary">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-gray-600">Loan Amount</p>
              <p className="text-base font-medium">
                ${loan.loanAmount.toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Disbursed</p>
              <p className="text-base font-medium">
                ${loan.disbursedAmount.toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Principal Paid</p>
              <p className="text-base font-medium">
                ${loan.totalPrincipalPaid.toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Outstanding</p>
              <p className="text-base font-medium text-orange-600">
                ${(loan.loanAmount - loan.totalPrincipalPaid).toLocaleString()}
              </p>
            </div>
          </div>
        </Card>
      )}

      <div className="flex justify-end gap-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => window.history.back()}
        >
          Cancel
        </Button>
        <Button type="submit" isLoading={isLoading}>
          Create Repayment
        </Button>
      </div>
    </form>
  );
}

