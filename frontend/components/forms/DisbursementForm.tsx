'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useLoan } from '@/lib/hooks/useLoan';
import { useCompanies } from '@/lib/hooks/useCompany';

const disbursementSchema = z.object({
  loanId: z.string().min(1, 'Loan is required'),
  companyId: z.string().min(1, 'Company is required'),
  disbursementDate: z.string().min(1, 'Disbursement date is required'),
  disbursementAmount: z.number().positive('Amount must be positive'),
  postingDate: z.string().min(1, 'Posting date is required'),
  repaymentStartDate: z.string().optional(),
});

type DisbursementFormData = z.infer<typeof disbursementSchema>;

interface DisbursementFormProps {
  loanId: string;
  initialData?: Partial<DisbursementFormData>;
  onSubmit: (data: DisbursementFormData) => Promise<void>;
  isLoading?: boolean;
}

export function DisbursementForm({
  loanId,
  initialData,
  onSubmit,
  isLoading = false,
}: DisbursementFormProps) {
  const { data: loan } = useLoan(loanId);
  const { data: companies } = useCompanies();

  const form = useForm<DisbursementFormData>({
    resolver: zodResolver(disbursementSchema),
    defaultValues: {
      loanId,
      companyId: loan?.companyId || '',
      disbursementDate: new Date().toISOString().split('T')[0],
      postingDate: new Date().toISOString().split('T')[0],
      repaymentStartDate: loan?.repaymentStartDate
        ? new Date(loan.repaymentStartDate).toISOString().split('T')[0]
        : undefined,
      disbursementAmount:
        loan
          ? Math.max(0, loan.loanAmount - loan.disbursedAmount)
          : initialData?.disbursementAmount || 0,
      ...initialData,
    },
  });

  const handleSubmit = form.handleSubmit(async (data) => {
    await onSubmit(data);
  });

  const availableAmount = loan
    ? Math.max(0, loan.loanAmount - loan.disbursedAmount)
    : 0;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card title="Disbursement Information">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Loan ID"
            value={loanId}
            disabled
            {...form.register('loanId')}
          />

          <Select
            label="Company"
            options={companies?.map((c) => ({ value: c.id, label: c.name })) || []}
            {...form.register('companyId')}
            required
            error={form.formState.errors.companyId?.message}
          />

          <Input
            label="Disbursement Date"
            type="date"
            {...form.register('disbursementDate')}
            required
            error={form.formState.errors.disbursementDate?.message}
          />

          <Input
            label="Posting Date"
            type="date"
            {...form.register('postingDate')}
            required
            error={form.formState.errors.postingDate?.message}
          />

          <Input
            label="Disbursement Amount"
            type="number"
            step="0.01"
            {...form.register('disbursementAmount', { valueAsNumber: true })}
            required
            error={form.formState.errors.disbursementAmount?.message}
          />

          {loan?.isTermLoan && (
            <Input
              label="Repayment Start Date"
              type="date"
              {...form.register('repaymentStartDate')}
              error={form.formState.errors.repaymentStartDate?.message}
            />
          )}
        </div>

        {loan && (
          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <p className="text-sm text-gray-700">
              <strong>Loan Amount:</strong> ${loan.loanAmount.toLocaleString()}
            </p>
            <p className="text-sm text-gray-700">
              <strong>Already Disbursed:</strong> ${loan.disbursedAmount.toLocaleString()}
            </p>
            <p className="text-sm font-medium text-blue-700">
              <strong>Available to Disburse:</strong> ${availableAmount.toLocaleString()}
            </p>
          </div>
        )}
      </Card>

      <div className="flex justify-end gap-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => window.history.back()}
        >
          Cancel
        </Button>
        <Button type="submit" isLoading={isLoading}>
          Create Disbursement
        </Button>
      </div>
    </form>
  );
}

