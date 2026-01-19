'use client';

import { useParams } from 'next/navigation';
import { useRepayment } from '@/lib/hooks/useRepayment';
import { useLoan } from '@/lib/hooks/useLoan';
import { useLoanProduct } from '@/lib/hooks/useLoanProduct';
import { Skeleton } from '@/components/ui/Skeleton';
import { Alert } from '@/components/ui/Alert';
import Link from 'next/link';
import { 
  DollarSign,
  Calendar,
  FileText,
  CreditCard,
  Building2,
  Download,
  ArrowLeft,
  CheckCircle,
  Receipt,
  TrendingUp,
  Percent,
  AlertCircle,
} from 'lucide-react';
import { format } from 'date-fns';

export default function RepaymentDetailPage() {
  const params = useParams();
  const repaymentId = params.id as string;
  const { data: repayment, isLoading: isLoadingRepayment } = useRepayment(repaymentId);
  const { data: loan, isLoading: isLoadingLoan } = useLoan(repayment?.loanId || '');
  const { data: loanProduct } = useLoanProduct(loan?.loanProductId || '');

  const isLoading = isLoadingRepayment || isLoadingLoan;

  if (isLoading) {
    return (
      <div className="px-4 py-8 md:px-8 lg:px-12 xl:px-20">
        <div className="mx-auto max-w-6xl">
          <Skeleton className="h-10 w-64 mb-4" />
          <Skeleton className="h-16 w-full mb-6" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <Skeleton className="h-64" />
              <Skeleton className="h-64" />
            </div>
            <div className="space-y-6">
              <Skeleton className="h-48" />
              <Skeleton className="h-64" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!repayment) {
    return (
      <div className="px-4 py-8 md:px-8 lg:px-12 xl:px-20">
        <div className="mx-auto max-w-6xl">
          <Alert variant="error" title="Repayment Not Found">
            The repayment you&apos;re looking for doesn&apos;t exist or has been removed.
          </Alert>
        </div>
      </div>
    );
  }

  const amountPaid = repayment.amountPaid || 0;
  const principalPaid = repayment.principalPaid || 0;
  const interestPaid = repayment.interestPaid || 0;
  const penaltyPaid = repayment.penaltyPaid || 0;
  const chargesPaid = repayment.chargesPaid || 0;
  const excessAmount = repayment.excessAmount || 0;
  const loanProductName = loanProduct?.name || 'Loan Product';
  const loanNumber = loan?.loanNumber || 'N/A';

  return (
    <div className="px-4 py-8 md:px-8 lg:px-12 xl:px-20">
      <div className="mx-auto max-w-6xl">
        {/* Breadcrumb */}
        <div className="mb-8">
          <div className="flex flex-wrap gap-2">
            <Link href="/dashboard" className="text-primary/80 text-base font-medium leading-normal hover:underline">
              Home
            </Link>
            <span className="text-primary/80 text-base font-medium leading-normal">/</span>
            <Link href="/repayments" className="text-primary/80 text-base font-medium leading-normal hover:underline">
              Repayments
            </Link>
            <span className="text-primary/80 text-base font-medium leading-normal">/</span>
            <span className="text-gray-900 text-base font-medium leading-normal">
              {repayment.referenceNumber || repayment.id?.slice(0, 8) || 'N/A'}
            </span>
          </div>

          {/* Title and Status */}
          <div className="flex flex-wrap items-start justify-between gap-4 pt-4">
            <div className="flex min-w-72 flex-col gap-2">
              <p className="text-gray-900 text-4xl font-black leading-tight tracking-tight">
                Repayment Details
              </p>
              <p className="text-gray-600 text-base font-normal leading-normal">
                {repayment.referenceNumber || `Repayment ${repayment.id?.slice(0, 8) || ''}`}
              </p>
            </div>
            <div className="flex items-center gap-2 rounded-full px-4 py-2 bg-secondary/20 text-secondary">
              <div className="h-2.5 w-2.5 rounded-full bg-current"></div>
              <span className="text-base font-bold leading-normal">{repayment.repaymentType || 'Normal Repayment'}</span>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Left Column - 2/3 width */}
          <div className="flex flex-col gap-6 lg:col-span-2">
            {/* Repayment Summary Card */}
            <div className="flex flex-col rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
              <div className="bg-gradient-to-r from-primary/5 to-white p-6 border-b border-gray-100">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <DollarSign className="w-5 h-5 text-primary" />
                  </div>
                  <p className="text-gray-600 text-sm font-medium leading-normal">Repayment Summary</p>
                </div>
                <p className="text-gray-900 text-lg font-bold leading-tight tracking-[-0.015em] mt-1">
                  Total Amount Paid
                </p>
                <div className="flex flex-col sm:flex-row sm:items-end sm:gap-4 mt-2">
                  <p className="text-gray-900 text-4xl font-bold leading-none tracking-tighter">
                    ${amountPaid.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                  {loan && (
                    <p className="text-gray-600 text-base font-normal leading-normal">
                      for loan {loanNumber}
                    </p>
                  )}
                </div>
              </div>
              <div className="border-t border-gray-200 grid grid-cols-2 sm:grid-cols-4 bg-gray-50/50">
                <div className="flex flex-col gap-1 p-4 border-r border-gray-200">
                  <div className="flex items-center gap-2 mb-1">
                    <CreditCard className="w-4 h-4 text-primary" />
                    <p className="text-gray-600 text-xs font-medium leading-normal uppercase tracking-wide">Principal</p>
                  </div>
                  <p className="text-gray-900 text-base font-bold leading-normal">
                    ${principalPaid.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>
                <div className="flex flex-col gap-1 p-4 border-r border-gray-200">
                  <div className="flex items-center gap-2 mb-1">
                    <Percent className="w-4 h-4 text-primary" />
                    <p className="text-gray-600 text-xs font-medium leading-normal uppercase tracking-wide">Interest</p>
                  </div>
                  <p className="text-gray-900 text-base font-bold leading-normal">
                    ${interestPaid.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>
                <div className="flex flex-col gap-1 p-4 border-r border-gray-200">
                  <div className="flex items-center gap-2 mb-1">
                    <AlertCircle className="w-4 h-4 text-primary" />
                    <p className="text-gray-600 text-xs font-medium leading-normal uppercase tracking-wide">Penalty</p>
                  </div>
                  <p className="text-gray-900 text-base font-bold leading-normal">
                    ${penaltyPaid.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>
                <div className="flex flex-col gap-1 p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <FileText className="w-4 h-4 text-primary" />
                    <p className="text-gray-600 text-xs font-medium leading-normal uppercase tracking-wide">Charges</p>
                  </div>
                  <p className="text-gray-900 text-base font-bold leading-normal">
                    ${chargesPaid.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
            </div>

            {/* Payment Breakdown Card */}
            <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
              <div className="border-b border-gray-200 p-6 bg-gradient-to-r from-primary/5 to-white">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-primary/10 mt-1">
                    <Receipt className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-900">Payment Breakdown</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Detailed breakdown of the repayment amount.
                    </p>
                  </div>
                </div>
              </div>
              <div className="p-6">
                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <dt className="text-sm text-gray-600 font-medium mb-1">Principal Paid</dt>
                    <dd className="text-2xl font-bold text-gray-900">
                      ${principalPaid.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm text-gray-600 font-medium mb-1">Interest Paid</dt>
                    <dd className="text-2xl font-bold text-orange-600">
                      ${interestPaid.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm text-gray-600 font-medium mb-1">Penalty Paid</dt>
                    <dd className="text-2xl font-bold text-red-600">
                      ${penaltyPaid.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm text-gray-600 font-medium mb-1">Charges Paid</dt>
                    <dd className="text-2xl font-bold text-gray-900">
                      ${chargesPaid.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </dd>
                  </div>
                  {excessAmount > 0 && (
                    <div className="sm:col-span-2">
                      <dt className="text-sm text-gray-600 font-medium mb-1">Excess Amount</dt>
                      <dd className="text-2xl font-bold text-blue-600">
                        ${excessAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </dd>
                      <p className="text-xs text-gray-500 mt-1">This amount will be applied to future payments</p>
                    </div>
                  )}
                </dl>
              </div>
            </div>

            {/* Related Loan Information Card */}
            {loan && (
              <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
                <div className="border-b border-gray-200 p-6 bg-gradient-to-r from-primary/5 to-white">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-primary/10 mt-1">
                      <Building2 className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-gray-900">Related Loan Information</h3>
                      <p className="text-sm text-gray-600 mt-1">
                        Details about the loan this repayment is associated with.
                      </p>
                    </div>
                  </div>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                      <p className="text-gray-600 text-xs font-medium uppercase tracking-wide mb-1">Loan Number</p>
                      <Link 
                        href={`/loans/${loan.id}`}
                        className="text-primary hover:underline font-bold text-lg"
                      >
                        {loanNumber}
                      </Link>
                    </div>
                    <div>
                      <p className="text-gray-600 text-xs font-medium uppercase tracking-wide mb-1">Loan Product</p>
                      <p className="text-gray-900 font-bold text-lg">{loanProductName}</p>
                    </div>
                    <div>
                      <p className="text-gray-600 text-xs font-medium uppercase tracking-wide mb-1">Total Loan Amount</p>
                      <p className="text-gray-900 font-bold text-lg">
                        ${(loan.loanAmount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                    </div>
                    {loan.status && (
                      <div>
                        <p className="text-gray-600 text-xs font-medium uppercase tracking-wide mb-1">Loan Status</p>
                        <p className="text-gray-900 font-bold text-lg">{loan.status}</p>
                      </div>
                    )}
                  </div>
                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <Link 
                      href={`/loans/${loan.id}`}
                      className="inline-flex items-center gap-2 text-primary hover:text-primary/80 font-medium"
                    >
                      <span>View Full Loan Details</span>
                      <TrendingUp className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              </div>
            )}

            {/* Transaction Details Card */}
            <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
              <div className="border-b border-gray-200 p-6 bg-gradient-to-r from-primary/5 to-white">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-primary/10 mt-1">
                      <FileText className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">Transaction Details</h3>
                      <p className="text-sm text-gray-600 mt-1">
                        Complete information about this repayment transaction.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button className="flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-900 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2 transition-colors">
                      <Download className="w-4 h-4" />
                      <span>Download Receipt</span>
                    </button>
                  </div>
                </div>
              </div>
              <div className="p-6">
                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <dt className="text-sm text-gray-600 font-medium mb-1">Repayment ID</dt>
                    <dd className="text-base font-semibold text-gray-900">{repayment.id || 'N/A'}</dd>
                  </div>
                  {repayment.referenceNumber && (
                    <div>
                      <dt className="text-sm text-gray-600 font-medium mb-1">Reference Number</dt>
                      <dd className="text-base font-semibold text-gray-900">{repayment.referenceNumber}</dd>
                    </div>
                  )}
                  <div>
                    <dt className="text-sm text-gray-600 font-medium mb-1">Repayment Type</dt>
                    <dd className="text-base font-semibold text-gray-900">{repayment.repaymentType || 'Normal Repayment'}</dd>
                  </div>
                  <div>
                    <dt className="text-sm text-gray-600 font-medium mb-1">Posting Date</dt>
                    <dd className="text-base font-semibold text-gray-900">
                      {repayment.postingDate ? format(new Date(repayment.postingDate), 'MMMM dd, yyyy') : 'N/A'}
                    </dd>
                  </div>
                  {repayment.valueDate && (
                    <div>
                      <dt className="text-sm text-gray-600 font-medium mb-1">Value Date</dt>
                      <dd className="text-base font-semibold text-gray-900">
                        {format(new Date(repayment.valueDate), 'MMMM dd, yyyy')}
                      </dd>
                    </div>
                  )}
                  {repayment.modeOfPayment && (
                    <div>
                      <dt className="text-sm text-gray-600 font-medium mb-1">Mode of Payment</dt>
                      <dd className="text-base font-semibold text-gray-900">{repayment.modeOfPayment}</dd>
                    </div>
                  )}
                  {repayment.createdAt && (
                    <div>
                      <dt className="text-sm text-gray-600 font-medium mb-1">Created At</dt>
                      <dd className="text-base font-semibold text-gray-900">
                        {format(new Date(repayment.createdAt), 'MMMM dd, yyyy HH:mm')}
                      </dd>
                    </div>
                  )}
                </dl>
              </div>
            </div>
          </div>

          {/* Right Column - Sidebar */}
          <div className="flex flex-col gap-6 lg:col-span-1">
            {/* Repayment Status Card */}
            <div className="rounded-xl border-2 border-primary/30 bg-gradient-to-br from-primary/10 via-primary/5 to-white shadow-lg p-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16"></div>
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-lg bg-primary/20">
                    <CheckCircle className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900">Repayment Status</h3>
                </div>
                <div className="mt-4">
                  <p className="text-2xl font-bold text-gray-900 mb-2">
                    Completed
                  </p>
                  <p className="text-sm text-gray-600">
                    This repayment has been successfully processed and recorded.
                  </p>
                </div>
                {loan && (
                  <Link href={`/loans/${loan.id}`}>
                    <button className="mt-6 w-full items-center justify-center rounded-lg bg-primary px-6 py-3 text-base font-bold text-white shadow-md hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2 transition-all hover:shadow-lg transform hover:-translate-y-0.5">
                      View Loan Details
                    </button>
                  </Link>
                )}
              </div>
            </div>

            {/* Repayment Documents Card */}
            <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
              <div className="p-6 bg-gradient-to-r from-primary/5 to-white border-b border-gray-200">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <FileText className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900">Documents</h3>
                </div>
                <p className="mt-2 text-sm text-gray-600">
                  Access and download repayment-related documents.
                </p>
              </div>
              <div className="flex flex-col border-t border-gray-200">
                <a
                  href="#"
                  className="flex items-center justify-between px-6 py-4 hover:bg-gray-50"
                >
                  <div className="flex items-center gap-4">
                    <Receipt className="text-primary w-5 h-5" />
                    <div>
                      <p className="font-medium text-gray-900">Repayment Receipt</p>
                      <p className="text-sm text-gray-600">
                        {repayment.postingDate ? format(new Date(repayment.postingDate), 'MMM d, yyyy') : 'N/A'}
                      </p>
                    </div>
                  </div>
                  <Download className="text-gray-400 w-5 h-5" />
                </a>
                {loan && (
                  <a
                    href="#"
                    className="flex items-center justify-between border-t border-gray-200 px-6 py-4 hover:bg-gray-50"
                  >
                    <div className="flex items-center gap-4">
                      <FileText className="text-primary w-5 h-5" />
                      <div>
                        <p className="font-medium text-gray-900">Loan Agreement</p>
                        <p className="text-sm text-gray-600">Related loan document</p>
                      </div>
                    </div>
                    <Download className="text-gray-400 w-5 h-5" />
                  </a>
                )}
              </div>
              <div className="border-t border-gray-200 p-4">
                <button className="w-full text-sm font-bold text-primary hover:underline">
                  View All Documents
                </button>
              </div>
            </div>

            {/* Back to Repayments */}
            <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-6">
              <Link 
                href="/repayments"
                className="flex items-center gap-2 text-gray-600 hover:text-primary transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="text-sm font-medium">Back to Repayments</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
