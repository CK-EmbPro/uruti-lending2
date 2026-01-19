'use client';

import { useParams } from 'next/navigation';
import { useDisbursement } from '@/lib/hooks/useDisbursement';
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
  Clock,
  TrendingUp,
  Receipt,
} from 'lucide-react';
import { format } from 'date-fns';

export default function DisbursementDetailPage() {
  const params = useParams();
  const disbursementId = params.id as string;
  const { data: disbursement, isLoading: isLoadingDisbursement } = useDisbursement(disbursementId);
  const { data: loan, isLoading: isLoadingLoan } = useLoan(disbursement?.loanId || '');
  const { data: loanProduct } = useLoanProduct(loan?.loanProductId || '');

  const isLoading = isLoadingDisbursement || isLoadingLoan;

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

  if (!disbursement) {
    return (
      <div className="px-4 py-8 md:px-8 lg:px-12 xl:px-20">
        <div className="mx-auto max-w-6xl">
          <Alert variant="error" title="Disbursement Not Found">
            The disbursement you&apos;re looking for doesn&apos;t exist or has been removed.
          </Alert>
        </div>
      </div>
    );
  }

  const disbursedAmount = disbursement.disbursedAmount || disbursement.disbursementAmount || 0;
  const loanProductName = loanProduct?.name || 'Loan Product';
  const loanNumber = loan?.loanNumber || 'N/A';

  const getStatusColor = (status?: string) => {
    if (!status) return 'bg-gray-100 text-gray-800';
    const normalizedStatus = status.toUpperCase();
    if (normalizedStatus === 'COMPLETED' || normalizedStatus === 'DISBURSED') {
      return 'bg-secondary/20 text-secondary';
    }
    if (normalizedStatus === 'PENDING' || normalizedStatus === 'PROCESSING') {
      return 'bg-yellow-100 text-yellow-800';
    }
    if (normalizedStatus === 'FAILED' || normalizedStatus === 'CANCELLED') {
      return 'bg-red-100 text-red-800';
    }
    return 'bg-gray-100 text-gray-800';
  };

  const statusColor = getStatusColor(disbursement.status);

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
            <Link href="/disbursements" className="text-primary/80 text-base font-medium leading-normal hover:underline">
              Disbursements
            </Link>
            <span className="text-primary/80 text-base font-medium leading-normal">/</span>
            <span className="text-gray-900 text-base font-medium leading-normal">
              {disbursement.referenceNumber || disbursement.id?.slice(0, 8) || 'N/A'}
            </span>
          </div>

          {/* Title and Status */}
          <div className="flex flex-wrap items-start justify-between gap-4 pt-4">
            <div className="flex min-w-72 flex-col gap-2">
              <p className="text-gray-900 text-4xl font-black leading-tight tracking-tight">
                Disbursement Details
              </p>
              <p className="text-gray-600 text-base font-normal leading-normal">
                {disbursement.referenceNumber || `Disbursement ${disbursement.id?.slice(0, 8) || ''}`}
              </p>
            </div>
            {disbursement.status && (
              <div className={`flex items-center gap-2 rounded-full px-4 py-2 ${statusColor}`}>
                <div className="h-2.5 w-2.5 rounded-full bg-current"></div>
                <span className="text-base font-bold leading-normal">{disbursement.status}</span>
              </div>
            )}
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Left Column - 2/3 width */}
          <div className="flex flex-col gap-6 lg:col-span-2">
            {/* Disbursement Summary Card */}
            <div className="flex flex-col rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
              <div className="bg-gradient-to-r from-primary/5 to-white p-6 border-b border-gray-100">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <DollarSign className="w-5 h-5 text-primary" />
                  </div>
                  <p className="text-gray-600 text-sm font-medium leading-normal">Disbursement Summary</p>
                </div>
                <p className="text-gray-900 text-lg font-bold leading-tight tracking-[-0.015em] mt-1">
                  Amount Disbursed
                </p>
                <div className="flex flex-col sm:flex-row sm:items-end sm:gap-4 mt-2">
                  <p className="text-gray-900 text-4xl font-bold leading-none tracking-tighter">
                    ${disbursedAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                  {loan && (
                    <p className="text-gray-600 text-base font-normal leading-normal">
                      from ${(loan.loanAmount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} loan
                    </p>
                  )}
                </div>
              </div>
              <div className="border-t border-gray-200 grid grid-cols-2 sm:grid-cols-4 bg-gray-50/50">
                <div className="flex flex-col gap-1 p-4 border-r border-gray-200">
                  <div className="flex items-center gap-2 mb-1">
                    <DollarSign className="w-4 h-4 text-primary" />
                    <p className="text-gray-600 text-xs font-medium leading-normal uppercase tracking-wide">Amount</p>
                  </div>
                  <p className="text-gray-900 text-base font-bold leading-normal">
                    ${disbursedAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>
                <div className="flex flex-col gap-1 p-4 border-r border-gray-200">
                  <div className="flex items-center gap-2 mb-1">
                    <Calendar className="w-4 h-4 text-primary" />
                    <p className="text-gray-600 text-xs font-medium leading-normal uppercase tracking-wide">Date</p>
                  </div>
                  <p className="text-gray-900 text-base font-bold leading-normal">
                    {disbursement.disbursementDate ? format(new Date(disbursement.disbursementDate), 'MM/dd/yyyy') : 'N/A'}
                  </p>
                </div>
                {disbursement.modeOfPayment && (
                  <div className="flex flex-col gap-1 p-4 border-r border-gray-200">
                    <div className="flex items-center gap-2 mb-1">
                      <CreditCard className="w-4 h-4 text-primary" />
                      <p className="text-gray-600 text-xs font-medium leading-normal uppercase tracking-wide">Payment Mode</p>
                    </div>
                    <p className="text-gray-900 text-base font-bold leading-normal">
                      {disbursement.modeOfPayment}
                    </p>
                  </div>
                )}
                {disbursement.referenceNumber && (
                  <div className="flex flex-col gap-1 p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <FileText className="w-4 h-4 text-primary" />
                      <p className="text-gray-600 text-xs font-medium leading-normal uppercase tracking-wide">Reference</p>
                    </div>
                    <p className="text-gray-900 text-base font-bold leading-normal truncate" title={disbursement.referenceNumber}>
                      {disbursement.referenceNumber}
                    </p>
                  </div>
                )}
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
                        Details about the loan this disbursement is associated with.
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
                    <div>
                      <p className="text-gray-600 text-xs font-medium uppercase tracking-wide mb-1">Disbursed Amount</p>
                      <p className="text-gray-900 font-bold text-lg">
                        ${(loan.disbursedAmount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                    </div>
                    {loan.rateOfInterest && (
                      <div>
                        <p className="text-gray-600 text-xs font-medium uppercase tracking-wide mb-1">Interest Rate</p>
                        <p className="text-gray-900 font-bold text-lg">
                          {(loan.rateOfInterest || 0)}% APR
                        </p>
                      </div>
                    )}
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
                      <Receipt className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">Transaction Details</h3>
                      <p className="text-sm text-gray-600 mt-1">
                        Complete information about this disbursement transaction.
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
                    <dt className="text-sm text-gray-600 font-medium mb-1">Disbursement ID</dt>
                    <dd className="text-base font-semibold text-gray-900">{disbursement.id || 'N/A'}</dd>
                  </div>
                  {disbursement.referenceNumber && (
                    <div>
                      <dt className="text-sm text-gray-600 font-medium mb-1">Reference Number</dt>
                      <dd className="text-base font-semibold text-gray-900">{disbursement.referenceNumber}</dd>
                    </div>
                  )}
                  <div>
                    <dt className="text-sm text-gray-600 font-medium mb-1">Disbursement Date</dt>
                    <dd className="text-base font-semibold text-gray-900">
                      {disbursement.disbursementDate ? format(new Date(disbursement.disbursementDate), 'MMMM dd, yyyy') : 'N/A'}
                    </dd>
                  </div>
                  {disbursement.postingDate && (
                    <div>
                      <dt className="text-sm text-gray-600 font-medium mb-1">Posting Date</dt>
                      <dd className="text-base font-semibold text-gray-900">
                        {format(new Date(disbursement.postingDate), 'MMMM dd, yyyy')}
                      </dd>
                    </div>
                  )}
                  {disbursement.modeOfPayment && (
                    <div>
                      <dt className="text-sm text-gray-600 font-medium mb-1">Mode of Payment</dt>
                      <dd className="text-base font-semibold text-gray-900">{disbursement.modeOfPayment}</dd>
                    </div>
                  )}
                  {disbursement.createdAt && (
                    <div>
                      <dt className="text-sm text-gray-600 font-medium mb-1">Created At</dt>
                      <dd className="text-base font-semibold text-gray-900">
                        {format(new Date(disbursement.createdAt), 'MMMM dd, yyyy HH:mm')}
                      </dd>
                    </div>
                  )}
                </dl>
              </div>
            </div>
          </div>

          {/* Right Column - Sidebar */}
          <div className="flex flex-col gap-6 lg:col-span-1">
            {/* Quick Actions Card */}
            <div className="rounded-xl border-2 border-primary/30 bg-gradient-to-br from-primary/10 via-primary/5 to-white shadow-lg p-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16"></div>
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-lg bg-primary/20">
                    <CheckCircle className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900">Disbursement Status</h3>
                </div>
                <div className="mt-4">
                  <p className="text-2xl font-bold text-gray-900 mb-2">
                    {disbursement.status || 'Completed'}
                  </p>
                  <p className="text-sm text-gray-600">
                    This disbursement has been successfully processed and recorded.
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

            {/* Disbursement Documents Card */}
            <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
              <div className="p-6 bg-gradient-to-r from-primary/5 to-white border-b border-gray-200">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <FileText className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900">Documents</h3>
                </div>
                <p className="mt-2 text-sm text-gray-600">
                  Access and download disbursement-related documents.
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
                      <p className="font-medium text-gray-900">Disbursement Receipt</p>
                      <p className="text-sm text-gray-600">
                        {disbursement.disbursementDate ? format(new Date(disbursement.disbursementDate), 'MMM d, yyyy') : 'N/A'}
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

            {/* Back to Disbursements */}
            <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-6">
              <Link 
                href="/disbursements"
                className="flex items-center gap-2 text-gray-600 hover:text-primary transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="text-sm font-medium">Back to Disbursements</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
