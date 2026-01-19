'use client';

import { PortalMultiStepLoanApplicationForm } from '@/components/portal/PortalMultiStepLoanApplicationForm';
import {
  ArrowLeft,
  Info,
} from 'lucide-react';
import Link from 'next/link';
import { useCustomerPortal } from '@/contexts/CustomerPortalContext';

export default function NewPortalLoanApplicationPage() {
  const { user } = useCustomerPortal();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-12">
      <header className="bg-white dark:bg-gray-800 shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <Link
                href="/portal/loan-applications"
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                title="Back to applications"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </Link>
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">New Loan Application</h1>
                <p className="text-xs text-gray-500 dark:text-gray-500">Apply for funding from our partner institutions</p>
              </div>
            </div>
            <div className="hidden md:flex items-center gap-2 text-sm text-blue-600 bg-blue-50 dark:bg-blue-900/20 px-3 py-1.5 rounded-lg border border-blue-100 dark:border-blue-800">
              <Info className="w-4 h-4" />
              <span>Applying as: {user?.name}</span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <PortalMultiStepLoanApplicationForm />
      </main>
    </div>
  );
}
