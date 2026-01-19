'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCustomerPortal } from '@/contexts/CustomerPortalContext';
import { customerPortalApi } from '@/lib/api/customer-portal';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { format } from 'date-fns';
import {
  CreditCard,
  DollarSign,
  Calendar,
  TrendingUp,
  FileText,
  LogOut,
  Eye,
  AlertCircle,
  CheckCircle,
  Link2,
  Plus,
  Settings,
  Bell,
} from 'lucide-react';
import { LinkLoanModal } from '@/components/portal/LinkLoanModal';
import { RiskTierBadge } from '@/components/portal/RiskTierBadge';
import { riskTierApi } from '@/lib/api/risk-tier';
import { useQuery } from '@tanstack/react-query';

export default function CustomerPortalDashboard() {
  const { user, isAuthenticated, loading, logout } = useCustomerPortal();
  const router = useRouter();
  const [loans, setLoans] = useState<any[]>([]);
  const [isLoadingLoans, setIsLoadingLoans] = useState(true);
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [unreadNotificationCount, setUnreadNotificationCount] = useState<number>(0);

  // Get risk tier for the user
  const { data: riskTier, isLoading: isLoadingRiskTier } = useQuery({
    queryKey: ['riskTier', user?.id],
    queryFn: () => customerPortalApi.getRiskTier(),
    enabled: !!user?.id && isAuthenticated,
    retry: false,
  });

  useEffect(() => {
    loadLoans();
    loadUnreadNotificationCount();
  }, []);

  const loadUnreadNotificationCount = async () => {
    try {
      const data = await customerPortalApi.getUnreadCount();
      setUnreadNotificationCount(data.count);
    } catch (error: any) {
      console.error('Failed to load unread notification count:', error);
    }
  };

  const loadLoans = async () => {
    try {
      setIsLoadingLoans(true);
      const data = await customerPortalApi.getMyLoans();
      setLoans(data);
    } catch (error: any) {
      toast.error('Failed to load loans');
      console.error(error);
    } finally {
      setIsLoadingLoans(false);
    }
  };

  const handleLogout = () => {
    logout();
    router.push('/portal/login');
    toast.success('Logged out successfully');
  };



  const totalOutstanding = loans.reduce((sum, loan) => {
    const balance = (loan.loanAmount || 0) - (loan.totalPrincipalPaid || 0);
    return sum + balance;
  }, 0);

  const activeLoans = loans.filter((loan) => loan.status === 'ACTIVE' || loan.status === 'SANCTIONED');
  const overdueLoans = loans.filter((loan) => (loan.daysPastDue || 0) > 0);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Customer Portal</h1>
              <div className="flex items-center gap-3 mt-1">
                <p className="text-sm text-gray-600 dark:text-gray-400">Welcome, {user?.name}</p>
                {riskTier && !isLoadingRiskTier && (
                  <RiskTierBadge
                    tier={riskTier.tier}
                    displayName={riskTier.displayName}
                    description={riskTier.description}
                    score={riskTier.currentScore}
                    showTooltip={true}
                  />
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Link
                href="/portal/notifications"
                className="relative flex items-center gap-2 px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <Bell className="w-4 h-4" />
                Notifications
                {(unreadNotificationCount ?? 0) > 0 && (
                  <span className="absolute -top-1 -right-1 flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-500 rounded-full">
                    {(unreadNotificationCount ?? 0) > 99 ? '99+' : (unreadNotificationCount ?? 0)}
                  </span>
                )}
              </Link>
              <Link
                href="/portal/loan-applications"
                className="flex items-center gap-2 px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <CreditCard className="w-4 h-4" />
                Loan Applications
              </Link>
              <Link
                href="/portal/documents"
                className="flex items-center gap-2 px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <FileText className="w-4 h-4" />
                Documents
              </Link>
              <Link
                href="/portal/settings"
                className="flex items-center gap-2 px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <Settings className="w-4 h-4" />
                Settings
              </Link>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Risk Tier Information */}
        {riskTier && !isLoadingRiskTier && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Your Credit Tier</h3>
                  <RiskTierBadge
                    tier={riskTier.tier}
                    displayName={riskTier.displayName}
                    description={riskTier.description}
                    score={riskTier.currentScore}
                    showTooltip={true}
                  />
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{riskTier.description}</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  {riskTier.benefits && riskTier.benefits.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Benefits</h4>
                      <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                        {riskTier.benefits.map((benefit: string, index: number) => (
                          <li key={index} className="flex items-start gap-2">

                            <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                            <span>{benefit}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {riskTier.limitations && riskTier.limitations.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Limitations</h4>
                      <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                        {riskTier.limitations.map((limitation: string, index: number) => (
                          <li key={index} className="flex items-start gap-2">

                            <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                            <span>{limitation}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Score Range: {riskTier.scoreRange.min} - {riskTier.scoreRange.max} | 
                    Last Updated: {riskTier.lastCalculatedAt ? new Date(riskTier.lastCalculatedAt).toLocaleDateString() : 'N/A'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Outstanding</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                  ${totalOutstanding.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-blue-600" />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Loans</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{activeLoans.length}</p>
              </div>
              <CreditCard className="w-8 h-8 text-green-600" />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Overdue Loans</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{overdueLoans.length}</p>
              </div>
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
          </div>
        </div>

        {/* Loans List */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">My Loans</h2>
            <div className="flex items-center gap-2">
              <Link href="/portal/loan-applications/new">
                <button
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors text-sm font-medium"
                >
                  <Plus className="w-4 h-4" />
                  Apply for Loan
                </button>
              </Link>
              <button
                onClick={() => setIsLinkModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium"
              >
                <Link2 className="w-4 h-4" />
                Link Loan
              </button>
            </div>

          </div>

          {isLoadingLoans ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600 dark:text-gray-400">Loading loans...</p>
            </div>
          ) : loans.length === 0 ? (
            <div className="p-8 text-center">
              <CreditCard className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">No loans found</p>
              <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
                If you have a loan, please contact support to link it to your account.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {loans.map((loan) => {
                const balance = (loan.loanAmount || 0) - (loan.totalPrincipalPaid || 0);
                const isOverdue = (loan.daysPastDue || 0) > 0;

                return (
                  <Link
                    key={loan.id}
                    href={`/portal/loans/${loan.id}`}
                    className="block p-6 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            {loan.loanNumber}
                          </h3>
                          <span
                            className={`px-2 py-1 text-xs font-medium rounded ${
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
                          {isOverdue && (
                            <span className="px-2 py-1 text-xs font-medium rounded bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                              {loan.daysPastDue} days overdue
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                          {loan.loanProduct?.name || 'Loan Product'}
                        </p>
                        <div className="flex items-center gap-6 text-sm text-gray-600 dark:text-gray-400">
                          <div className="flex items-center gap-1">
                            <DollarSign className="w-4 h-4" />
                            <span>Balance: ${balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <TrendingUp className="w-4 h-4" />
                            <span>Rate: {loan.rateOfInterest}%</span>
                          </div>
                          {loan.repaymentStartDate && (
                            <div className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              <span>Started: {format(new Date(loan.repaymentStartDate), 'MMM d, yyyy')}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <Eye className="w-5 h-5 text-gray-400" />
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* Link Loan Modal */}
      <LinkLoanModal
        isOpen={isLinkModalOpen}
        onClose={() => setIsLinkModalOpen(false)}
        onSuccess={() => {
          loadLoans();
        }}
      />
    </div>
  );
}

