'use client';

import { useLoan } from '@/lib/hooks/useLoan';
import { useRepayments } from '@/lib/hooks/useRepayment';
import { useLoanProduct } from '@/lib/hooks/useLoanProduct';
import { useParams, useRouter } from 'next/navigation';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { Skeleton } from '@/components/ui/Skeleton';
import { Alert } from '@/components/ui/Alert';
import Link from 'next/link';
import {
  Download,
  CheckCircle,
  Clock,
  ChevronRight,
  Mail,
  MessageSquare,
  FileText,
  Receipt,
  DollarSign,
  TrendingUp,
  Calendar,
  Percent,
  CreditCard,
  AlertCircle,
} from 'lucide-react';
import { format } from 'date-fns';
import { useState } from 'react';
import { LoanBookingSection } from '@/components/features/LoanBookingSection';
import { DisbursementReadinessSection } from '@/components/features/DisbursementReadinessSection';
import { RateLockSection } from '@/components/features/RateLockSection';
import { DocumentManagementSection } from '@/components/features/DocumentManagementSection';
import { AutopaySection } from '@/components/features/AutopaySection';
import { PartialPaymentSection } from '@/components/features/PartialPaymentSection';
import { PayoffQuoteSection } from '@/components/features/PayoffQuoteSection';
import { EarlySettlementDailyCalculationSection } from '@/components/features/EarlySettlementDailyCalculationSection';
import { LoanModificationSection } from '@/components/features/LoanModificationSection';
import { PaymentHolidaySection } from '@/components/features/PaymentHolidaySection';
import { RestructureRequestSection } from '@/components/features/RestructureRequestSection';
import { RestructureAcknowledgmentSection } from '@/components/features/RestructureAcknowledgmentSection';
import { StatementSection } from '@/components/features/StatementSection';
import { CollectionsSection } from '@/components/features/CollectionsSection';
import { CustomerServiceSection } from '@/components/features/CustomerServiceSection';
import { CollateralRevaluationSection } from '@/components/features/CollateralRevaluationSection';

export default function LoanDetailPage() {
  const params = useParams();
  const router = useRouter();
  const loanId = params.id as string;
  const { data: loan, isLoading } = useLoan(loanId);
  const { data: repaymentsResponse } = useRepayments({ loanId, limit: 100, sortBy: 'postingDate', sortOrder: 'DESC' });
  const repayments = repaymentsResponse?.data || [];
  const { data: loanProduct } = useLoanProduct(loan?.loanProductId || '');

  const [remindersEnabled, setRemindersEnabled] = useState(true);
  const [reminderChannel, setReminderChannel] = useState<'email' | 'sms'>('email');
  const [reminderTiming, setReminderTiming] = useState('3 days before due date');

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

  if (!loan) {
    return (
      <div className="px-4 py-8 md:px-8 lg:px-12 xl:px-20">
        <div className="mx-auto max-w-6xl">
          <Alert variant="error" title="Loan Not Found">
            The loan you&apos;re looking for doesn&apos;t exist or has been removed.
          </Alert>
        </div>
      </div>
    );
  }

  // Calculate loan metrics with null safety
  const loanAmount = loan.loanAmount || 0;
  const totalPrincipalPaid = loan.totalPrincipalPaid || 0;
  const remainingBalance = loanAmount - totalPrincipalPaid;
  const progressPercent = loanAmount > 0
    ? Math.round((totalPrincipalPaid / loanAmount) * 100)
    : 0;

  // Get next payment (simplified - would need schedule calculation)
  const nextPayment = {
    amount: 485.66, // This would come from schedule calculation
    dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // 15 days from now
  };

  // Mock payment schedule (would come from API)
  const paymentSchedule = [
    { dueDate: new Date('2024-03-15'), principal: 398.21, interest: 87.45, total: 485.66, status: 'Paid' },
    { dueDate: new Date('2024-04-15'), principal: 400.05, interest: 85.61, total: 485.66, status: 'Due' },
    { dueDate: new Date('2024-05-15'), principal: 401.90, interest: 83.76, total: 485.66, status: 'Upcoming' },
    { dueDate: new Date('2024-06-15'), principal: 403.76, interest: 81.90, total: 485.66, status: 'Upcoming' },
    { dueDate: new Date('2024-07-15'), principal: 405.63, interest: 80.03, total: 485.66, status: 'Upcoming' },
  ];

  const getStatusBadge = (status: string) => {
    if (status === 'Paid') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          <CheckCircle className="w-3 h-3 mr-1.5" />
          Paid
        </span>
      );
    }
    if (status === 'Due') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
          <Clock className="w-3 h-3 mr-1.5" />
          Due
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
        <Clock className="w-3 h-3 mr-1.5" />
        Upcoming
      </span>
    );
  };

  const loanProductName = loanProduct?.name || 'Loan';
  const getStatusColor = (status: string) => {
    if (status === 'Active' || status === 'Disbursed' || status === 'ACTIVE' || status === 'DISBURSED') {
      return 'bg-secondary/20 text-secondary';
    }
    if (status === 'Sanctioned' || status === 'SANCTIONED') {
      return 'bg-primary/20 text-primary';
    }
    if (status === 'Closed' || status === 'CLOSED' || status === 'Paid Off') {
      return 'bg-gray-100 text-gray-800';
    }
    return 'bg-gray-100 text-gray-800';
  };
  const statusColor = getStatusColor(loan.status || '');

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
            <Link href="/loans" className="text-primary/80 text-base font-medium leading-normal hover:underline">
              My Loans
            </Link>
            <span className="text-primary/80 text-base font-medium leading-normal">/</span>
            <span className="text-gray-900 text-base font-medium leading-normal">
              {loan.loanNumber}
            </span>
          </div>

          {/* Title and Status */}
          <div className="flex flex-wrap items-start justify-between gap-4 pt-4">
            <div className="flex min-w-72 flex-col gap-2">
              <p className="text-gray-900 text-4xl font-black leading-tight tracking-tight">
                Loan Details & Management
              </p>
              <p className="text-gray-600 text-base font-normal leading-normal">
                {loanProductName} - {loan.loanNumber}
              </p>
            </div>
            <div className={`flex items-center gap-2 rounded-full px-4 py-2 ${statusColor}`}>
              <div className="h-2.5 w-2.5 rounded-full bg-current"></div>
              <span className="text-base font-bold leading-normal">{loan.status}</span>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Left Column - 2/3 width */}
          <div className="flex flex-col gap-6 lg:col-span-2">
            {/* Loan Summary Card */}
            <div className="flex flex-col rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
              <div className="bg-gradient-to-r from-primary/5 to-white p-6 border-b border-gray-100">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <DollarSign className="w-5 h-5 text-primary" />
                  </div>
                  <p className="text-gray-600 text-sm font-medium leading-normal">Loan Summary</p>
                </div>
                <p className="text-gray-900 text-lg font-bold leading-tight tracking-[-0.015em] mt-1">
                  Amount Remaining
                </p>
                <div className="flex flex-col sm:flex-row sm:items-end sm:gap-4 mt-2">
                  <p className="text-gray-900 text-4xl font-bold leading-none tracking-tighter">
                    ${(remainingBalance || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                  <p className="text-gray-600 text-base font-normal leading-normal">
                    out of ${(loanAmount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
              <div className="px-6 pb-6">
                <div className="flex flex-col gap-3">
                  <div className="flex gap-6 justify-between">
                    <p className="text-gray-900 text-base font-medium leading-normal">
                      {progressPercent}% Paid
                    </p>
                  </div>
                  <div className="w-full rounded bg-primary/10 h-2">
                    <div
                      className="h-2 rounded bg-primary transition-all"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                  <p className="text-gray-600 text-sm font-normal leading-normal">
                    Final Payment Date: {loan.closureDate ? format(new Date(loan.closureDate), 'MM/dd/yyyy') : 'N/A'}
                  </p>
                </div>
              </div>
              <div className={`border-t border-gray-200 grid ${loan.repaymentStructure ? 'grid-cols-2 sm:grid-cols-5' : 'grid-cols-2 sm:grid-cols-4'} bg-gray-50/50`}>
                <div className="flex flex-col gap-1 p-4 border-r border-gray-200">
                  <div className="flex items-center gap-2 mb-1">
                    <CreditCard className="w-4 h-4 text-primary" />
                    <p className="text-gray-600 text-xs font-medium leading-normal uppercase tracking-wide">Total Loan Amount</p>
                  </div>
                  <p className="text-gray-900 text-base font-bold leading-normal">
                    ${(loanAmount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>
                <div className="flex flex-col gap-1 p-4 border-r border-gray-200">
                  <div className="flex items-center gap-2 mb-1">
                    <Percent className="w-4 h-4 text-primary" />
                    <p className="text-gray-600 text-xs font-medium leading-normal uppercase tracking-wide">Interest Rate</p>
                  </div>
                  <p className="text-gray-900 text-base font-bold leading-normal">
                    {(loan.rateOfInterest || 0)}% APR
                  </p>
                </div>
                <div className="flex flex-col gap-1 p-4 border-r border-gray-200">
                  <div className="flex items-center gap-2 mb-1">
                    <Calendar className="w-4 h-4 text-primary" />
                    <p className="text-gray-600 text-xs font-medium leading-normal uppercase tracking-wide">Loan Term</p>
                  </div>
                  <p className="text-gray-900 text-base font-bold leading-normal">
                    {loan.repaymentPeriods || 'N/A'} {loan.repaymentPeriods === 1 ? 'Month' : 'Months'}
                  </p>
                </div>
                <div className="flex flex-col gap-1 p-4 border-r border-gray-200">
                  <div className="flex items-center gap-2 mb-1">
                    <TrendingUp className="w-4 h-4 text-primary" />
                    <p className="text-gray-600 text-xs font-medium leading-normal uppercase tracking-wide">Origination Date</p>
                  </div>
                  <p className="text-gray-900 text-base font-bold leading-normal">
                    {loan.postingDate ? format(new Date(loan.postingDate), 'MM/dd/yyyy') : 'N/A'}
                  </p>
                </div>
                {loan.repaymentStructure && (
                  <div className="flex flex-col gap-1 p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <CreditCard className="w-4 h-4 text-primary" />
                      <p className="text-gray-600 text-xs font-medium leading-normal uppercase tracking-wide">Repayment Structure</p>
                    </div>
                    <p className="text-gray-900 text-base font-bold leading-normal">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                        {loan.repaymentStructure === 'FIXED' && 'Fixed Payment'}
                        {loan.repaymentStructure === 'GRADUATED' && 'Graduated Payment'}
                        {loan.repaymentStructure === 'SEASONAL' && 'Seasonal Payment'}
                        {loan.repaymentStructure === 'BULLET' && 'Bullet Payment'}
                        {!['FIXED', 'GRADUATED', 'SEASONAL', 'BULLET'].includes(loan.repaymentStructure) && loan.repaymentStructure}
                      </span>
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Payment Reminders Card */}
            <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
              <div className="border-b border-gray-200 p-6 bg-gradient-to-r from-primary/5 to-white">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-primary/10 mt-1">
                      <AlertCircle className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">Payment Reminders</h3>
                      <p className="text-sm text-gray-600 mt-1">
                        Set up custom reminders for your upcoming payments.
                      </p>
                    </div>
                  </div>
                  <label className="flex cursor-pointer items-center">
                    <div className='relative'>

                      <input 
                        type="checkbox"
                        checked={remindersEnabled}
                        onChange={(e) => setRemindersEnabled(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="peer h-6 w-11 rounded-full bg-gray-200 after:absolute after:start-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-green-500 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-500/50"></div>
                    </div>
                    <span className="ms-3 text-sm font-medium text-gray-900">Reminders On</span>
                  </label>
                </div>
              </div>
              {remindersEnabled && (
                <div className="p-6">
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-2">
                        Channel
                      </label>
                      <div className="mt-2 flex rounded-lg shadow-sm">
                        <button
                          type="button"
                          onClick={() => setReminderChannel('email')}
                          className={`relative inline-flex flex-1 items-center justify-center gap-2 rounded-l-md px-4 py-2 text-sm font-medium ring-1 ring-inset focus:z-10 focus:ring-2 focus:ring-inset transition-colors ${reminderChannel === 'email'
                              ? 'bg-primary text-white ring-primary focus:ring-primary'
                              : 'bg-white text-gray-700 ring-gray-300 hover:bg-gray-50 focus:ring-primary'
                            }`}
                        >
                          <Mail className="w-4 h-4" />
                          <span>Email</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setReminderChannel('sms')}
                          className={`relative -ml-px inline-flex flex-1 items-center justify-center gap-2 rounded-r-md px-4 py-2 text-sm font-medium ring-1 ring-inset focus:z-10 focus:ring-2 focus:ring-inset transition-colors ${reminderChannel === 'sms'
                              ? 'bg-primary text-white ring-primary focus:ring-primary'
                              : 'bg-white text-gray-700 ring-gray-300 hover:bg-gray-50 focus:ring-primary'
                            }`}
                        >
                          <MessageSquare className="w-4 h-4" />
                          <span>SMS</span>
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-2">
                        Timing
                      </label>
                      <select
                        value={reminderTiming}
                        onChange={(e) => setReminderTiming(e.target.value)}
                        className="mt-2 block w-full rounded-lg border-gray-300 bg-white py-2 pl-3 pr-10 text-sm text-gray-900 shadow-sm focus:border-primary focus:ring-primary transition-colors"
                      >
                        <option>3 days before due date</option>
                        <option>1 day before due date</option>
                        <option>On the due date</option>
                        <option>1 day after due date (if unpaid)</option>
                      </select>
                    </div>
                  </div>
                  <div className="mt-6">
                    <p className="text-sm text-gray-600">
                      Reminders will be sent to your registered email{' '}
                      <span className="font-medium text-gray-900">user@example.com</span>.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Payment Schedule Card */}
            <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
              <div className="border-b border-gray-200 p-6 bg-gradient-to-r from-primary/5 to-white">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-primary/10 mt-1">
                      <Calendar className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">Payment Schedule</h3>
                      <p className="text-sm text-gray-600 mt-1">
                        Review all past and upcoming loan payments.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button className="flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-900 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2 transition-colors">
                      <Download className="w-4 h-4" />
                      <span>Download PDF</span>
                    </button>
                  </div>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                        Due Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                        Principal
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                        Interest
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                        Total Payment
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-600 uppercase tracking-wider">
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {paymentSchedule.map((payment, index) => (
                      <tr
                        key={index}
                        className={payment.status === 'Due' ? 'bg-yellow-50/50' : ''}
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {format(payment.dueDate, 'MMM d, yyyy')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          ${(payment.principal || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          ${(payment.interest || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          ${(payment.total || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {getStatusBadge(payment.status)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          {payment.status === 'Due' ? (
                            <Link href={`/loans/${loanId}/repay`} className="text-primary hover:underline font-medium">
                              Pay Now
                            </Link>
                          ) : (
                            <Link href={`/repayments/${payment.dueDate.getTime()}`} className="text-primary hover:underline font-medium">
                              View Details
                            </Link>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="border-t border-gray-200 p-4 flex items-center justify-between">
                <button className="text-sm font-medium text-gray-400 hover:underline disabled:no-underline" disabled>
                  Previous
                </button>
                <div className="text-sm text-gray-600">
                  Page <span>1</span> of <span>12</span>
                </div>
                <button className="text-sm font-medium text-primary hover:underline">
                  Next
                </button>
              </div>
            </div>
          </div>

          {/* Right Column - Sidebar */}
          <div className="flex flex-col gap-6 lg:col-span-1">
            {/* Next Payment Card */}
            <div className="rounded-xl border-2 border-primary/30 bg-gradient-to-br from-primary/10 via-primary/5 to-white shadow-lg p-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16"></div>
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-lg bg-primary/20">
                    <Clock className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900">Next Payment</h3>
                </div>
                <div className="mt-4 flex items-baseline gap-2">
                  <p className="text-3xl font-bold text-gray-900">
                    ${(nextPayment.amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                  <p className="text-gray-600">due on {format(nextPayment.dueDate, 'MMM d, yyyy')}</p>
                </div>
                <Link href={`/loans/${loanId}/repay`}>
                  <button className="mt-6 w-full items-center justify-center rounded-lg bg-primary px-6 py-3 text-base font-bold text-white shadow-md hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2 transition-all hover:shadow-lg transform hover:-translate-y-0.5">
                    Make a Payment
                  </button>
                </Link>
              </div>
            </div>

            {/* Early Repayment Card */}
            <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
              <div className="p-6 bg-gradient-to-r from-secondary/5 to-white border-b border-gray-200">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 rounded-lg bg-secondary/20">
                    <TrendingUp className="w-5 h-5 text-secondary" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900">Early Repayment</h3>
                </div>
                <p className="mt-2 text-sm text-gray-600">
                  Pay off your loan faster and save on interest.
                </p>
              </div>
              <div className="flex flex-col">
                <Link
                  href={`/loans/${loanId}/repay`}
                  className="border-t border-gray-200 px-6 py-5 hover:bg-gray-50 cursor-pointer"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h4 className="font-semibold text-gray-900">Make an Additional Payment</h4>
                      <p className="text-sm text-gray-600 mt-1">
                        Add extra funds to your next scheduled payment to reduce your principal faster.
                      </p>
                    </div>
                    <ChevronRight className="text-gray-400 mt-1" />
                  </div>
                </Link>
                <Link
                  href={`/loans/${loanId}/repay`}
                  className="border-t border-gray-200 px-6 py-5 hover:bg-gray-50 cursor-pointer"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h4 className="font-semibold text-gray-900">Pay Off Full Balance</h4>
                      <p className="text-sm text-gray-600 mt-1">
                        Settle your remaining loan balance in one go and become debt-free sooner.
                      </p>
                    </div>
                    <ChevronRight className="text-gray-400 mt-1" />
                  </div>
                </Link>
                <div className="mt-4 rounded-lg bg-secondary/10 border border-secondary/20 p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-secondary">
                      <DollarSign className="text-white w-4 h-4" />
                    </div>
                    <div>
                      <h5 className="font-bold text-secondary">Potential Savings</h5>
                      <p className="text-sm text-gray-700 mt-1">
                        By paying off your loan today, you could save approximately{' '}
                        <span className="font-bold text-secondary">$1,280.45</span> in future interest payments.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Loan Documents Card */}
            <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
              <div className="p-6 bg-gradient-to-r from-primary/5 to-white border-b border-gray-200">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <FileText className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900">Loan Documents</h3>
                </div>
                <p className="mt-2 text-sm text-gray-600">
                  Access and download your loan agreements, statements, and other documents.
                </p>
              </div>
              <div className="flex flex-col border-t border-gray-200">
                <a
                  href="#"
                  className="flex items-center justify-between px-6 py-4 hover:bg-gray-50"
                >
                  <div className="flex items-center gap-4">
                    <FileText className="text-primary w-5 h-5" />
                    <div>
                      <p className="font-medium text-gray-900">Loan Agreement</p>
                      <p className="text-sm text-gray-600">Signed on {format(new Date(loan.postingDate), 'MMM d, yyyy')}</p>
                    </div>
                  </div>
                  <Download className="text-gray-400 w-5 h-5" />
                </a>
                <a
                  href="#"
                  className="flex items-center justify-between border-t border-gray-200 px-6 py-4 hover:bg-gray-50"
                >
                  <div className="flex items-center gap-4">
                    <Receipt className="text-primary w-5 h-5" />
                    <div>
                      <p className="font-medium text-gray-900">Monthly Statement - {format(new Date(), 'MMM yyyy')}</p>
                      <p className="text-sm text-gray-600">Issued on {format(new Date(), 'MMM d, yyyy')}</p>
                    </div>
                  </div>
                  <Download className="text-gray-400 w-5 h-5" />
                </a>
              </div>
              <div className="border-t border-gray-200 p-4">
                <button className="w-full text-sm font-bold text-primary hover:underline">
                  View All Documents
                </button>
              </div>
            </div>

            {/* Loan Booking Section */}
            <LoanBookingSection loanId={loanId} applicationId={(loan as any).applicationId} />

            {/* Rate Lock Section */}
            <RateLockSection loanId={loanId} currentRate={loan.rateOfInterest} />

            {/* Disbursement Readiness Section */}
            {(loan.status === 'SANCTIONED' || loan.status === 'PARTIALLY_DISBURSED') && (
              <DisbursementReadinessSection loanId={loanId} />
            )}

            {/* Autopay Section */}
            <AutopaySection loanId={loanId} />

            {/* Partial Payment Section */}
            <PartialPaymentSection loanId={loanId} nextPaymentAmount={nextPayment.amount} />

            {/* Payoff Quote Section */}
            <PayoffQuoteSection loanId={loanId} />

            {/* Early Settlement Daily Calculation Section */}
            <EarlySettlementDailyCalculationSection loanId={loanId} />

            {/* Loan Modification Section */}
            <LoanModificationSection loanId={loanId} />

            {/* Payment Holiday Section */}
            <PaymentHolidaySection
              loanId={loanId}
              onRequestHoliday={() => {
                // Navigate to modification request with payment holiday pre-selected
                // This can be enhanced to open a modal or navigate to a specific page
              }}
            />

            {/* Restructure Request Section */}
            <RestructureRequestSection
              loanId={loanId}
              originalTenure={loan.repaymentPeriods || 12}
              currentRate={loan.rateOfInterest || 0}
            />

            {/* Statement Section */}
            <StatementSection loanId={loanId} />
          </div>
        </div>

        {/* Collections Section - Full Width Below (if delinquent) */}
        {((loan.daysPastDue ?? 0) > 0) && (
          <div className="mt-6">
            <CollectionsSection
              loanId={loanId}
              daysPastDue={loan.daysPastDue ?? 0}
              outstandingBalance={remainingBalance}
            />
          </div>
        )}

        {/* Customer Service Section - Full Width Below */}
        <div className="mt-6">
          <CustomerServiceSection loanId={loanId} />
        </div>

        {/* Document Management Section - Full Width Below */}
        <div className="mt-6">
          <DocumentManagementSection loanId={loanId} />
        </div>

        {/* Collateral Revaluation Section - Full Width Below (if secured loan) */}
        {loan.isSecuredLoan && (
          <div className="mt-6">
            <CollateralRevaluationSection loanId={loanId} />
          </div>
        )}
      </div>
    </div>
  );
}
