'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loanApplicationSchema, type LoanApplicationFormData } from '@/lib/types/schemas';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useEffect, useState } from 'react';
import { customersApi } from '@/lib/api/customers';
import toast from 'react-hot-toast';

interface LoanApplicationFormProps {
  initialData?: Partial<LoanApplicationFormData>;
  onSubmit: (data: LoanApplicationFormData) => Promise<void>;
  mode?: 'create' | 'edit';
  isLoading?: boolean;
}

export function LoanApplicationForm({
  initialData,
  onSubmit,
  mode = 'create',
  isLoading = false,
}: LoanApplicationFormProps) {
  const form = useForm<LoanApplicationFormData>({
    resolver: zodResolver(loanApplicationSchema),
    defaultValues: {
      applicantType: 'Customer',
      isTermLoan: false,
      isSecuredLoan: false,
      rateOfInterest: 0,
      ...initialData,
    },
  });

  const isTermLoan = form.watch('isTermLoan');
  const isSecuredLoan = form.watch('isSecuredLoan');
  const repaymentMethod = form.watch('repaymentMethod');
  const applicantPhoneNumber = form.watch('applicantPhoneNumber');
  const applicantEmailAddress = form.watch('applicantEmailAddress');

  // Duplicate customer check
  useEffect(() => {
    const timeoutId = setTimeout(async () => {
      if ((applicantPhoneNumber || applicantEmailAddress) && form.getValues('applicantType') === 'Customer') {
        try {
          const duplicates = await customersApi.checkDuplicate({
            phoneNumber: applicantPhoneNumber,
            email: applicantEmailAddress,
          });

          if (duplicates.length > 0) {
            const useExisting = confirm(
              'A customer with the same contact details exists. Do you want to use the existing customer?'
            );

            if (useExisting) {
              const customer = duplicates[0];
              form.setValue('applicantId', customer.id);
              form.setValue('applicantPhoneNumber', customer.mobileNo || '');
              form.setValue('applicantEmailAddress', customer.email || '');
              toast.success('Customer details auto-filled');
            }
          }
        } catch (error) {
          // Silently fail - not critical
        }
      }
    }, 500); // Debounce

    return () => clearTimeout(timeoutId);
  }, [applicantPhoneNumber, applicantEmailAddress, form]);

  const handleSubmit = form.handleSubmit(async (data) => {
    await onSubmit(data);
  });

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card title="Applicant Details">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Select
            label="Applicant Type"
            options={[
              { value: 'Customer', label: 'Customer' },
              { value: 'Employee', label: 'Employee' },
            ]}
            {...form.register('applicantType')}
            error={form.formState.errors.applicantType?.message}
          />

          <Input
            label="Applicant ID"
            {...form.register('applicantId')}
            error={form.formState.errors.applicantId?.message}
          />

          <Input
            label="Phone Number"
            type="tel"
            {...form.register('applicantPhoneNumber')}
            error={form.formState.errors.applicantPhoneNumber?.message}
          />

          <Input
            label="Email Address"
            type="email"
            {...form.register('applicantEmailAddress')}
            error={form.formState.errors.applicantEmailAddress?.message}
          />
        </div>
      </Card>

      <Card title="Loan Details">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Company ID"
            {...form.register('companyId')}
            required
            error={form.formState.errors.companyId?.message}
          />

          <Input
            label="Posting Date"
            type="date"
            {...form.register('postingDate')}
            required
            error={form.formState.errors.postingDate?.message}
          />

          <Input
            label="Loan Product ID"
            {...form.register('loanProductId')}
            required
            error={form.formState.errors.loanProductId?.message}
          />

          <Input
            label="Loan Amount"
            type="number"
            step="0.01"
            {...form.register('loanAmount', { valueAsNumber: true })}
            required
            error={form.formState.errors.loanAmount?.message}
          />

          <Input
            label="Rate of Interest (%)"
            type="number"
            step="0.01"
            {...form.register('rateOfInterest', { valueAsNumber: true })}
            required
            error={form.formState.errors.rateOfInterest?.message}
          />
        </div>
      </Card>

      <Card title="Loan Type">
        <div className="space-y-4">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              {...form.register('isTermLoan')}
              className="w-4 h-4"
            />
            <span>Is Term Loan</span>
          </label>

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              {...form.register('isSecuredLoan')}
              className="w-4 h-4"
            />
            <span>Is Secured Loan</span>
          </label>
        </div>
      </Card>

      {isTermLoan && (
        <Card title="Repayment Details">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              label="Repayment Method"
              options={[
                { value: 'Repay Fixed Amount per Period', label: 'Fixed Amount per Period' },
                { value: 'Repay Over Number of Periods', label: 'Number of Periods' },
              ]}
              {...form.register('repaymentMethod')}
              error={form.formState.errors.repaymentMethod?.message}
            />

            {repaymentMethod === 'Repay Fixed Amount per Period' && (
              <Input
                label="Repayment Amount"
                type="number"
                step="0.01"
                {...form.register('repaymentAmount', { valueAsNumber: true })}
                required
                error={form.formState.errors.repaymentAmount?.message}
              />
            )}

            {repaymentMethod === 'Repay Over Number of Periods' && (
              <Input
                label="Repayment Periods"
                type="number"
                {...form.register('repaymentPeriods', { valueAsNumber: true })}
                required
                error={form.formState.errors.repaymentPeriods?.message}
              />
            )}

            <Select
              label="Repayment Structure"
              options={[
                { value: 'FIXED', label: 'Fixed Payment (Equal installments)' },
                { value: 'GRADUATED', label: 'Graduated Payment (Increasing)' },
                { value: 'SEASONAL', label: 'Seasonal Payment (Variable by season)' },
                { value: 'BULLET', label: 'Bullet Payment (Principal at end)' },
              ]}
              {...form.register('repaymentStructure')}
              error={form.formState.errors.repaymentStructure?.message}
            />
          </div>
        </Card>
      )}

      <Card title="Additional Information">
        <Input
          label="Description"
          {...form.register('description')}
          error={form.formState.errors.description?.message}
        />
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
          {mode === 'create' ? 'Create Application' : 'Update Application'}
        </Button>
      </div>
    </form>
  );
}

