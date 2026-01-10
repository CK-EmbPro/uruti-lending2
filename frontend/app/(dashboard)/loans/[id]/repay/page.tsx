'use client';

import { useParams } from 'next/navigation';
import { RepaymentForm } from '@/components/forms/RepaymentForm';
import { useCreateRepayment } from '@/lib/hooks/useRepayment';
import { type CreateRepaymentDto } from '@/lib/api/repayments';

export default function CreateRepaymentPage() {
  const params = useParams();
  const loanId = params.id as string;
  const createRepayment = useCreateRepayment();

  const handleSubmit = async (data: CreateRepaymentDto) => {
    await createRepayment.mutateAsync(data);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Create Repayment</h1>
      <RepaymentForm
        loanId={loanId}
        onSubmit={handleSubmit}
        isLoading={createRepayment.isPending}
      />
    </div>
  );
}

