'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useCustomerPortal } from '@/contexts/CustomerPortalContext';
import { customerPortalApi } from '@/lib/api/customer-portal';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { format } from 'date-fns';
import {
  ArrowLeft,
  DollarSign,
  Calendar,
  TrendingUp,
  FileText,
  CreditCard,
  CheckCircle,
  Clock,
  AlertCircle,
  Download,
  Plus,
  X,
} from 'lucide-react';
import { SchedulePaymentModal } from '@/components/portal/SchedulePaymentModal';

export default function CustomerLoanDetailPage() {
  const { user, isAuthenticated, loading } = useCustomerPortal();
  const router = useRouter();
  const params = useParams();
  const loanId = params.id as string;

  const [loan, setLoan] = useState<any>(null);
  const [summary, setSummary] = useState<any>(null);
  const [paymentHistory, setPaymentHistory] = useState<any[]>([]);
  const [upcomingPayments, setUpcomingPayments] = useState<any[]>([]);
  const [statements, setStatements] = useState<any[]>([]);
  const [scheduledPayments, setScheduledPayments] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'payments' | 'statements'>('overview');
  const [isLoading, setIsLoading] = useState(true);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);

  useEffect(() => {
    if (loanId) {
      loadLoanData();
    }
  }, [loanId]);

  const loadLoanData = async () => {
    try {
      setIsLoading(true);
      const [loanData, summaryData, historyData, upcomingData, statementsData, scheduledData] = await Promise.all([
        customerPortalApi.getLoan(loanId),
        customerPortalApi.getLoanSummary(loanId),
        customerPortalApi.getPaymentHistory(loanId, 20),
        customerPortalApi.getUpcomingPayments(loanId, 12),
        customerPortalApi.getStatements(loanId),
        customerPortalApi.getScheduledPayments(loanId).catch(() => []), // Optional, don't fail if not available
      ]);

      setLoan(loanData);
      setSummary(summaryData);
      setPaymentHistory(historyData);
      setUpcomingPayments(upcomingData);
      setStatements(statementsData);
      setScheduledPayments(scheduledData || []);
    } catch (error: any) {
      toast.error('Failed to load loan information');
      console.error(error);
      router.push('/portal/dashboard');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading loan details...</p>
        </div>
      </div>
    );
  }

  if (!loan) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link
            href="/portal/dashboard"
            className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{loan.loanNumber}</h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">{loan.loanProduct?.name || 'Loan Product'}</p>
            </div>
            <span
              className={`px-3 py-1 text-sm font-medium rounded ${
                loan.status === 'ACTIVE'
                  ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                  : loan.status === 'SANCTIONED'
                  ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                  : loan.status === 'CLOSED'
                  ? 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                  : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
              }`}
            >
              {loan.status}
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tabs */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow mb-6">
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="flex -mb-px">
              {[
                { id: 'overview', label: 'Overview', icon: FileText },
                { id: 'payments', label: 'Payments', icon: CreditCard },
                { id: 'statements', label: 'Statements', icon: Download },
              ].map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex items-center gap-2 px-6 py-4 border-b-2 font-medium text-sm ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Current Balance</p>
                  <DollarSign className="w-5 h-5 text-blue-600" />
                </div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  ${summary?.currentBalance?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}
                </p>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Interest Rate</p>
                  <TrendingUp className="w-5 h-5 text-green-600" />
                </div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {loan.rateOfInterest}%
                </p>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Days Past Due</p>
                  <AlertCircle className="w-5 h-5 text-red-600" />
                </div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {summary?.daysPastDue || 0}
                </p>
              </div>
            </div>

            {/* Loan Details */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Loan Details</h2>
              </div>
              <div className="p-6">
                <dl className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Loan Amount</dt>
                    <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                      ${loan.loanAmount?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Principal Paid</dt>
                    <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                      ${summary?.totalPrincipalPaid?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Interest Paid</dt>
                    <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                      ${summary?.totalInterestPaid?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Repayment Frequency</dt>
                    <dd className="mt-1 text-sm text-gray-900 dark:text-white">{loan.repaymentFrequency || 'N/A'}</dd>
                  </div>
                  {loan.repaymentStartDate && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Repayment Start Date</dt>
                      <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                        {format(new Date(loan.repaymentStartDate), 'MMM d, yyyy')}
                      </dd>
                    </div>
                  )}
                  {summary?.nextPaymentDate && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Next Payment Date</dt>
                      <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                        {format(new Date(summary.nextPaymentDate), 'MMM d, yyyy')}
                      </dd>
                    </div>
                  )}
                </dl>
              </div>
            </div>

            {/* Upcoming Payments */}
            {upcomingPayments.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
                <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Upcoming Payments</h2>
                </div>
                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                  {upcomingPayments.slice(0, 5).map((payment) => (
                    <div key={payment.id} className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">
                            Payment #{payment.installmentNumber}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Due: {format(new Date(payment.paymentDate), 'MMM d, yyyy')}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-gray-900 dark:text-white">
                            ${payment.totalPayment?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Principal: ${payment.principalAmount?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'} | 
                            Interest: ${payment.interestAmount?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Payments Tab */}
        {activeTab === 'payments' && (
          <div className="space-y-6">
            {/* Scheduled Payments */}
            {scheduledPayments.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
                <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Scheduled Payments</h2>
                  <button
                    onClick={() => setIsScheduleModalOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium"
                  >
                    <Plus className="w-4 h-4" />
                    Schedule Payment
                  </button>
                </div>
                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                  {scheduledPayments.map((scheduled) => (
                    <div key={scheduled.id} className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">
                            ${scheduled.calculatedAmount?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Scheduled for {format(new Date(scheduled.scheduledDate), 'MMM d, yyyy')}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                            {scheduled.paymentMethod} • {scheduled.status}
                          </p>
                        </div>
                        {scheduled.status === 'PENDING' && (
                          <button
                            onClick={async () => {
                              if (confirm('Are you sure you want to cancel this scheduled payment?')) {
                                try {
                                  await customerPortalApi.cancelScheduledPayment(scheduled.id);
                                  toast.success('Payment cancelled');
                                  loadLoanData();
                                } catch (error: any) {
                                  toast.error('Failed to cancel payment');
                                }
                              }
                            }}
                            className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Schedule Payment Button */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Payment History</h2>
                <button
                  onClick={() => setIsScheduleModalOpen(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium"
                >
                  <Plus className="w-4 h-4" />
                  Schedule Payment
                </button>
              </div>
              {paymentHistory.length === 0 ? (
                <div className="p-8 text-center">
                  <CreditCard className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 dark:text-gray-400">No payment history found</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                  {paymentHistory.map((payment) => (
                    <div key={payment.id} className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {format(new Date(payment.postingDate), 'MMM d, yyyy')}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {payment.modeOfPayment || 'Payment'} {payment.referenceNumber && `• ${payment.referenceNumber}`}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-gray-900 dark:text-white">
                            ${payment.amountPaid?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Principal: ${payment.principalPaid?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'} | 
                            Interest: ${payment.interestPaid?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Statements Tab */}
        {activeTab === 'statements' && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Loan Statements</h2>
              </div>
              {statements.length === 0 ? (
                <div className="p-8 text-center">
                  <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 dark:text-gray-400">No statements available</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                  {statements.map((statement) => (
                    <div key={statement.id} className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {statement.statementType} Statement
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {format(new Date(statement.statementDate), 'MMM d, yyyy')}
                          </p>
                        </div>
                        <div className="flex items-center gap-4">
                          <span
                            className={`px-2 py-1 text-xs font-medium rounded ${
                              statement.status === 'SENT'
                                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                            }`}
                          >
                            {statement.status}
                          </span>
                          <button className="text-blue-600 hover:text-blue-700 dark:text-blue-400">
                            <Download className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Schedule Payment Modal */}
      <SchedulePaymentModal
        isOpen={isScheduleModalOpen}
        onClose={() => setIsScheduleModalOpen(false)}
        loanId={loanId}
        currentBalance={summary?.currentBalance || 0}
        nextPaymentAmount={upcomingPayments[0]?.totalPayment || 0}
        onSuccess={() => {
          loadLoanData();
        }}
      />
    </div>
  );
}

