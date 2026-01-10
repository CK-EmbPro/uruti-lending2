'use client';

import { MultiStepLoanApplicationForm } from '@/components/forms/MultiStepLoanApplicationForm';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function NewLoanApplicationPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-gray-50">
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        {/* Breadcrumb Navigation */}
        <div className="mb-6">
          <Breadcrumb
            items={[
              { label: 'Home', href: '/' },
              { label: 'Loan Applications', href: '/loan-applications' },
              { label: 'New Application' },
            ]}
          />
        </div>

        {/* Back Button */}
        <div className="mb-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-primary transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
        </div>

        {/* Form Component */}
        <MultiStepLoanApplicationForm />
      </div>
    </div>
  );
}
