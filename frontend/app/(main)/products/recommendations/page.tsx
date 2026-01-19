'use client';

import { useState } from 'react';
import AIProductRecommendation from '@/components/features/AIProductRecommendation';
import { useRouter } from 'next/navigation';
import { useCompanies } from '@/lib/hooks/useCompany';

export default function ProductRecommendationsPage() {
  const router = useRouter();
  const { data: companies } = useCompanies();
  const companyId = companies?.[0]?.id || 'default-company-id';

  const handleProductSelect = (productId: string) => {
    // Navigate to loan application with selected product
    router.push(`/loans/new?productId=${productId}`);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Find Your Perfect Loan Product</h1>
        <p className="text-gray-600">
          Get AI-powered recommendations based on your profile and needs
        </p>
      </div>

      <AIProductRecommendation
        companyId={companyId}
        onProductSelect={handleProductSelect}
      />
    </div>
  );
}

