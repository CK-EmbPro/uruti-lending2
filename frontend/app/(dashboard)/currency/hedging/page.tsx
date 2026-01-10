'use client';

import { FXHedgingManager } from '@/components/currency/FXHedgingManager';
import { useSearchParams } from 'next/navigation';

export default function FXHedgingPage() {
  const searchParams = useSearchParams();
  const loanId = searchParams.get('loanId') || undefined;

  return (
    <div className="container mx-auto px-4 py-8">
      <FXHedgingManager loanId={loanId} />
    </div>
  );
}

