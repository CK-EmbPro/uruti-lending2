'use client';

import { useParams } from 'next/navigation';
import { DisbursementForm } from '@/components/forms/DisbursementForm';
import { useCreateDisbursement } from '@/lib/hooks/useDisbursement';
import { type CreateDisbursementDto } from '@/lib/api/disbursements';

export default function CreateDisbursementPage() {
  const params = useParams();
  const loanId = params.id as string;
  const createDisbursement = useCreateDisbursement();

  const handleSubmit = async (data: CreateDisbursementDto) => {
    await createDisbursement.mutateAsync(data);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Create Disbursement</h1>
      <DisbursementForm
        loanId={loanId}
        onSubmit={handleSubmit}
        isLoading={createDisbursement.isPending}
      />
    </div>
  );
}

