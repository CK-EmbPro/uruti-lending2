'use client';

import { useLoans } from '@/lib/hooks/useLoan';
import { useLoanApplications } from '@/lib/hooks/useLoanApplication';
import { useRepayments } from '@/lib/hooks/useRepayment';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import { useMemo, useEffect } from 'react';
import { format } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { 
  Plus, 
  Wallet, 
  TrendingUp, 
  Banknote, 
  Clock, 
  PieChart as PieChartIcon, 
  CreditCard, 
  PiggyBank, 
  FileText, 
  Download, 
  User, 
  BarChart3, 
  ArrowRight, 
  ArrowDown, 
  ArrowUp, 
  History 
} from 'lucide-react';

// Custom Tooltip for charts
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-3">
        <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} className="text-sm" style={{ color: entry.color }}>
            {entry.name}: <span className="font-bold">${(entry.value || 0).toLocaleString()}</span>
          </p>
        ))}
      </div>
    );
  }
  return null;
};

// Skeleton loader component
const StatCardSkeleton = () => (
  <div className="bg-white dark:bg-gray-900/50 rounded-xl border border-gray-200 dark:border-gray-800 p-6 animate-pulse">
    <div className="flex items-center justify-between mb-4">
      <div className="w-12 h-12 rounded-lg bg-gray-200 dark:bg-gray-700"></div>
      <div className="w-16 h-6 rounded bg-gray-200 dark:bg-gray-700"></div>
    </div>
    <div className="space-y-2">
      <div className="w-24 h-4 rounded bg-gray-200 dark:bg-gray-700"></div>
      <div className="w-32 h-8 rounded bg-gray-200 dark:bg-gray-700"></div>
      <div className="w-40 h-3 rounded bg-gray-200 dark:bg-gray-700"></div>
    </div>
  </div>
);

export default function DashboardPage() {
  const { user } = useAuth();
  const { data: loans = [], isLoading: loansLoading } = useLoans();
  const { 
    data: applicationsResponse, 
    isLoading: applicationsLoading 
  } = useLoanApplications();
  // Handle paginated response from useLoanApplications
  const applications = applicationsResponse?.data || [];
  
  // Fetch only recent repayments (last 30 days, limit 20) for dashboard performance
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const { 
    data: repaymentsResponse, 
    isLoading: repaymentsLoading 
  } = useRepayments({
    fromDate: thirtyDaysAgo.toISOString().split('T')[0], // Last 30 days
    limit: 20, // Limit to 20 most recent
    sortBy: 'postingDate',
    sortOrder: 'DESC',
  });
  // Handle paginated response from useRepayments
  const repayments = repaymentsResponse?.data || [];
  
  // Debug logging
  console.log('[DashboardPage] Loading state:', {
    loansLoading,
    applicationsLoading,
    loansCount: loans.length,
    applicationsCount: applications.length,
    hasApplicationsResponse: !!applicationsResponse,
  });

  // Calculate comprehensive statistics
  const stats = useMemo(() => {
    const totalLoans = loans.length;
    const totalLoanAmount = loans.reduce((sum, loan) => sum + Number(loan.loanAmount || 0), 0);
    const totalDisbursed = loans.reduce((sum, loan) => sum + Number(loan.disbursedAmount || 0), 0);
    const totalPaid = loans.reduce((sum, loan) => sum + Number(loan.totalAmountPaid || 0), 0);
    const outstandingBalance = totalDisbursed - totalPaid;
    
    const activeLoans = loans.filter(
      (loan) => ['Disbursed', 'Active', 'Partially Disbursed'].includes(loan.status)
    ).length;
    
    const pendingApplications = applications.filter(
      (app) => ['Submitted', 'Under Review', 'Pending'].includes(app.status || '')
    ).length;
    
    const approvedApplications = applications.filter(
      (app) => app.status === 'Approved'
    ).length;

    const collectionRate = totalDisbursed > 0 ? (totalPaid / totalDisbursed) * 100 : 0;
    
    // Calculate trends (mock for now)
    const loansTrend = 12.5;
    const activeTrend = 8.3;
    const collectionTrend = 5.7;

    return {
      totalLoans,
      totalLoanAmount,
      totalDisbursed,
      totalPaid,
      outstandingBalance,
      activeLoans,
      pendingApplications,
      approvedApplications,
      collectionRate,
      loansTrend,
      activeTrend,
      collectionTrend,
    };
  }, [loans, applications]);

  // Get the first active loan for summary
  const activeLoan = useMemo(() => {
    return loans.find((loan) => 
      ['Disbursed', 'Active', 'Partially Disbursed'].includes(loan.status)
    );
  }, [loans]);

  // Calculate loan summary values
  const loanSummary = useMemo(() => {
    if (!activeLoan) return null;
    
    const totalPaid = repayments
      .filter((r) => r.loanId === activeLoan.id)
      .reduce((sum, r) => sum + (r.principalPaid || 0), 0);
    
    const loanAmount = activeLoan.loanAmount || 0;
    const remainingBalance = Math.max(0, loanAmount - totalPaid);
    const progressPercent = loanAmount > 0 
      ? Math.round((totalPaid / loanAmount) * 100) 
      : 0;

    const nextPaymentDate = new Date();
    nextPaymentDate.setDate(nextPaymentDate.getDate() + 15);

    return {
      outstandingBalance: remainingBalance,
      nextPaymentDue: nextPaymentDate,
      interestRate: activeLoan.rateOfInterest || 5.2,
      totalPaid,
      remainingBalance,
      progressPercent,
      loanNumber: activeLoan.loanNumber || `#${activeLoan.id?.slice(0, 8).toUpperCase() || 'N/A'}`,
      loanProduct: 'Auto Loan', // TODO: Fetch loan product name if needed
    };
  }, [activeLoan, repayments]);

  // Get recent transactions
  const recentTransactions = useMemo(() => {
    const transactions: Array<{
      id: string;
      type: 'payment' | 'disbursement';
      title: string;
      date: Date;
      amount: number;
      isPayment: boolean;
    }> = repayments
      .slice(0, 5)
      .map((repayment) => ({
        id: repayment.id,
        type: 'payment' as const,
        title: 'Scheduled payment processed',
        date: repayment.postingDate ? new Date(repayment.postingDate) : new Date(),
        amount: repayment.amountPaid || 0,
        isPayment: true,
      }));

    if (activeLoan?.disbursementDate) {
      transactions.unshift({
        id: activeLoan.id,
        type: 'disbursement' as const,
        title: 'Loan disbursement',
        date: new Date(activeLoan.disbursementDate),
        amount: activeLoan.loanAmount || 0,
        isPayment: false,
      });
    }

    return transactions
      .sort((a, b) => b.date.getTime() - a.date.getTime())
      .slice(0, 5);
  }, [repayments, activeLoan]);

  // Chart data for loan status distribution
  const loanStatusData = useMemo(() => {
    const statusCounts = loans.reduce((acc, loan) => {
      acc[loan.status] = (acc[loan.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(statusCounts).map(([name, value]) => ({
      name: name.length > 15 ? name.substring(0, 15) + '...' : name,
      value,
    }));
  }, [loans]);

  // Chart data for monthly trends (mock data - would come from API)
  const monthlyTrendData = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    return months.map((month, index) => ({
      month,
      disbursed: Math.floor(Math.random() * 50000) + 100000,
      collected: Math.floor(Math.random() * 40000) + 80000,
    }));
  }, []);

  const COLORS = ['#0A4DAA', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

  const userName = user?.name || 'User';
  const isLoading = loansLoading || applicationsLoading || repaymentsLoading;
  
  // Log loading completion
  useEffect(() => {
    if (!isLoading) {
      console.log('[DashboardPage] Data loaded:', {
        loans: loans.length,
        applications: applications.length,
        repayments: repayments.length,
        repaymentsTotal: repaymentsResponse?.total || 0,
      });
    }
  }, [isLoading, loans.length, applications.length, repayments.length, repaymentsResponse?.total]);

  return (
    <>
      {/* Page Header */}
      <div className="flex flex-wrap justify-between items-start gap-4 mb-8">
        <div>
          <h1 className="text-text-light dark:text-text-dark text-4xl font-black leading-tight tracking-[-0.033em] mb-2">
            Welcome back, {userName} ! 👋
          </h1>
          <p className="text-subtext-light dark:text-subtext-dark text-base">
            Here's your comprehensive overview of the lending platform today.
          </p>
        </div>
        <Link href="/loan-applications/new">
          <button className="flex min-w-[84px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-11 px-5 bg-primary text-white text-sm font-bold leading-normal tracking-[0.015em] hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all shadow-sm hover:shadow-md">
            <Plus className="w-4 h-4 mr-2" />
            <span className="truncate">New Application</span>
          </button>
        </Link>
      </div>

      {/* Statistics Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {isLoading ? (
          <>
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
          </>
        ) : (
          <>
            {/* Total Loans */}
            <div className="group relative bg-gradient-to-br from-white to-gray-50 dark:from-gray-900/50 dark:to-gray-800/30 rounded-xl border border-gray-200 dark:border-gray-800 p-6 hover:shadow-xl transition-all duration-300 overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500"></div>
              <div className="relative">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 shadow-sm">
                    <Wallet className="w-6 h-6 text-primary" />
                  </div>
                  <span className="text-xs font-semibold text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-2.5 py-1 rounded-full flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" />
                    +{stats.loansTrend}%
                  </span>
                </div>
                <div>
                  <p className="text-text-secondary-light dark:text-text-secondary-dark text-sm font-medium mb-1">
                    Total Loans
                  </p>
                  <p className="text-text-light dark:text-text-dark text-3xl font-bold mb-1">
                    {stats.totalLoans}
                  </p>
                  <p className="text-subtext-light dark:text-subtext-dark text-xs">
                    ${(stats.totalLoanAmount / 1000).toFixed(1)}K total value
                  </p>
                </div>
              </div>
            </div>

            {/* Active Loans */}
            <div className="group relative bg-gradient-to-br from-white to-gray-50 dark:from-gray-900/50 dark:to-gray-800/30 rounded-xl border border-gray-200 dark:border-gray-800 p-6 hover:shadow-xl transition-all duration-300 overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-secondary/5 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500"></div>
              <div className="relative">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-secondary/20 to-secondary/10 shadow-sm">
                    <TrendingUp className="w-6 h-6 text-secondary" />
                  </div>
                  <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-2.5 py-1 rounded-full">
                    Active
                  </span>
                </div>
                <div>
                  <p className="text-text-secondary-light dark:text-text-secondary-dark text-sm font-medium mb-1">
                    Active Loans
                  </p>
                  <p className="text-text-light dark:text-text-dark text-3xl font-bold mb-1">
                    {stats.activeLoans}
                  </p>
                  <p className="text-subtext-light dark:text-subtext-dark text-xs">
                    ${(stats.totalDisbursed / 1000).toFixed(1)}K disbursed
                  </p>
                </div>
              </div>
            </div>

            {/* Outstanding Balance */}
            <div className="group relative bg-gradient-to-br from-white to-gray-50 dark:from-gray-900/50 dark:to-gray-800/30 rounded-xl border border-gray-200 dark:border-gray-800 p-6 hover:shadow-xl transition-all duration-300 overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500"></div>
              <div className="relative">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-amber-500/20 to-amber-500/10 shadow-sm">
                    <Banknote className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                  </div>
                  <span className="text-xs font-semibold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-2.5 py-1 rounded-full">
                    Due
                  </span>
                </div>
                <div>
                  <p className="text-text-secondary-light dark:text-text-secondary-dark text-sm font-medium mb-1">
                    Outstanding Balance
                  </p>
                  <p className="text-text-light dark:text-text-dark text-3xl font-bold mb-1">
                    ${(stats.outstandingBalance / 1000).toFixed(1)}K
                  </p>
                  <p className="text-subtext-light dark:text-subtext-dark text-xs">
                    {stats.collectionRate.toFixed(1)}% collection rate
                  </p>
                </div>
              </div>
            </div>

            {/* Pending Applications */}
            <div className="group relative bg-gradient-to-br from-white to-gray-50 dark:from-gray-900/50 dark:to-gray-800/30 rounded-xl border border-gray-200 dark:border-gray-800 p-6 hover:shadow-xl transition-all duration-300 overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500"></div>
              <div className="relative">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 shadow-sm">
                    <Clock className="w-6 h-6 text-primary" />
                  </div>
                  <span className="text-xs font-semibold text-primary bg-primary/10 px-2.5 py-1 rounded-full">
                    Review
                  </span>
                </div>
                <div>
                  <p className="text-text-secondary-light dark:text-text-secondary-dark text-sm font-medium mb-1">
                    Pending Applications
                  </p>
                  <p className="text-text-light dark:text-text-dark text-3xl font-bold mb-1">
                    {stats.pendingApplications}
                  </p>
                  <p className="text-subtext-light dark:text-subtext-dark text-xs">
                    {stats.approvedApplications} approved
                  </p>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Charts and Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Left Column - Charts */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          {/* Monthly Trends Chart */}
          <div className="bg-white dark:bg-gray-900/50 rounded-xl border border-gray-200 dark:border-gray-800 p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex flex-wrap items-center justify-between mb-6 gap-4">
              <div>
                <h2 className="text-text-light dark:text-text-dark text-xl font-bold leading-tight tracking-[-0.015em]">
                  Monthly Trends
                </h2>
                <p className="text-subtext-light dark:text-subtext-dark text-sm mt-1">
                  Disbursement vs Collection
                </p>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-primary"></div>
                  <span className="text-xs text-subtext-light dark:text-subtext-dark font-medium">Disbursed</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-secondary"></div>
                  <span className="text-xs text-subtext-light dark:text-subtext-dark font-medium">Collected</span>
                </div>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={monthlyTrendData} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" opacity={0.5} />
                <XAxis 
                  dataKey="month" 
                  stroke="#6B7280" 
                  tick={{ fill: '#6B7280', fontSize: 12 }}
                  axisLine={{ stroke: '#E2E8F0' }}
                />
                <YAxis 
                  stroke="#6B7280" 
                  tick={{ fill: '#6B7280', fontSize: 12 }}
                  axisLine={{ stroke: '#E2E8F0' }}
                  tickFormatter={(value) => `$${(value / 1000).toFixed(0)}K`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="disbursed" fill="#0A4DAA" radius={[8, 8, 0, 0]} />
                <Bar dataKey="collected" fill="#10B981" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Loan Status Distribution */}
          <div className="bg-white dark:bg-gray-900/50 rounded-xl border border-gray-200 dark:border-gray-800 p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="mb-6">
              <h2 className="text-text-light dark:text-text-dark text-xl font-bold leading-tight tracking-[-0.015em]">
                Loan Status Distribution
              </h2>
              <p className="text-subtext-light dark:text-subtext-dark text-sm mt-1">
                Overview of all loan statuses
              </p>
            </div>
            {loanStatusData.length > 0 ? (
              <div className="flex flex-col lg:flex-row items-center gap-6">
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie
                      data={loanStatusData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {loanStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-col gap-3 w-full lg:w-auto">
                  {loanStatusData.map((entry, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <div 
                        className="w-4 h-4 rounded" 
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      ></div>
                      <span className="text-sm text-text-light dark:text-text-dark font-medium flex-1">
                        {entry.name}
                      </span>
                      <span className="text-sm font-bold text-text-light dark:text-text-dark">
                        {entry.value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-[280px]">
                <div className="text-center">
                  <PieChartIcon className="w-12 h-12 text-text-secondary-light dark:text-text-secondary-dark mb-3 mx-auto" />
                  <p className="text-subtext-light dark:text-subtext-dark">No loan data available</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column - Quick Stats & Actions */}
        <div className="flex flex-col gap-6">
          {/* Quick Stats Card */}
          <div className="bg-white dark:bg-gray-900/50 rounded-xl border border-gray-200 dark:border-gray-800 p-6 shadow-sm hover:shadow-md transition-shadow">
            <h2 className="text-text-light dark:text-text-dark text-xl font-bold leading-tight tracking-[-0.015em] mb-6">
              Quick Stats
            </h2>
            <div className="space-y-5">
              <div className="flex items-center justify-between pb-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <CreditCard className="w-5 h-5 text-primary" />
                  </div>
                  <span className="text-text-light dark:text-text-dark text-sm font-medium">Total Collected</span>
                </div>
                <span className="text-text-light dark:text-text-dark font-bold text-lg">
                  ${(stats.totalPaid / 1000).toFixed(1)}K
                </span>
              </div>
              <div className="flex items-center justify-between pb-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-secondary/10">
                    <PiggyBank className="w-5 h-5 text-secondary" />
                  </div>
                  <span className="text-text-light dark:text-text-dark text-sm font-medium">Collection Rate</span>
                </div>
                <span className="text-text-light dark:text-text-dark font-bold text-lg">
                  {stats.collectionRate.toFixed(1)}%
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-amber-500/10">
                    <FileText className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                  </div>
                  <span className="text-text-light dark:text-text-dark text-sm font-medium">Total Applications</span>
                </div>
                <span className="text-text-light dark:text-text-dark font-bold text-lg">
                  {applications.length}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white dark:bg-gray-900/50 rounded-xl border border-gray-200 dark:border-gray-800 p-6 shadow-sm hover:shadow-md transition-shadow">
            <h2 className="text-text-light dark:text-text-dark text-xl font-bold leading-tight tracking-[-0.015em] mb-5">
              Quick Actions
            </h2>
            <div className="grid grid-cols-2 gap-3">
              <Link
                href={activeLoan ? `/loans/${activeLoan.id}/repay` : '/repayments'}
                className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl bg-gradient-to-br from-primary/5 to-primary/10 hover:from-primary/10 hover:to-primary/20 transition-all border border-primary/20 hover:border-primary/30 group"
              >
                <CreditCard className="w-8 h-8 text-primary group-hover:scale-110 transition-transform" />
                <span className="text-xs font-semibold text-center text-text-light dark:text-text-dark">Make Payment</span>
              </Link>
              <Link
                href={activeLoan ? `/loans/${activeLoan.id}` : '/loans'}
                className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl bg-gradient-to-br from-secondary/5 to-secondary/10 hover:from-secondary/10 hover:to-secondary/20 transition-all border border-secondary/20 hover:border-secondary/30 group"
              >
                <Download className="w-8 h-8 text-secondary group-hover:scale-110 transition-transform" />
                <span className="text-xs font-semibold text-center text-text-light dark:text-text-dark">Download</span>
              </Link>
              <Link
                href="/settings"
                className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl bg-gradient-to-br from-gray-100 to-gray-50 dark:from-gray-800/50 dark:to-gray-700/30 hover:from-gray-200 hover:to-gray-100 dark:hover:from-gray-700/50 dark:hover:to-gray-600/30 transition-all border border-gray-200 dark:border-gray-700 group"
              >
                <User className="w-8 h-8 text-text-light dark:text-text-dark group-hover:scale-110 transition-transform" />
                <span className="text-xs font-semibold text-center text-text-light dark:text-text-dark">Profile</span>
              </Link>
              <Link
                href="/reports"
                className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl bg-gradient-to-br from-gray-100 to-gray-50 dark:from-gray-800/50 dark:to-gray-700/30 hover:from-gray-200 hover:to-gray-100 dark:hover:from-gray-700/50 dark:hover:to-gray-600/30 transition-all border border-gray-200 dark:border-gray-700 group"
              >
                <BarChart3 className="w-8 h-8 text-text-light dark:text-text-dark group-hover:scale-110 transition-transform" />
                <span className="text-xs font-semibold text-center text-text-light dark:text-text-dark">Reports</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white dark:bg-gray-900/50 rounded-xl border border-gray-200 dark:border-gray-800 p-6 shadow-sm hover:shadow-md transition-shadow">
        <div className="flex flex-wrap items-center justify-between mb-6 gap-4">
          <div>
            <h2 className="text-text-light dark:text-text-dark text-xl font-bold leading-tight tracking-[-0.015em]">
              Recent Activity
            </h2>
            <p className="text-subtext-light dark:text-subtext-dark text-sm mt-1">
              Latest transactions and updates
            </p>
          </div>
          <Link href="/repayments" className="text-primary text-sm font-semibold hover:underline flex items-center gap-1">
            View All
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        {recentTransactions.length > 0 ? (
          <div className="space-y-3">
            {recentTransactions.map((transaction) => (
              <div 
                key={transaction.id} 
                className="flex items-center justify-between p-4 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors border border-transparent hover:border-gray-200 dark:hover:border-gray-700"
              >
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-xl ${
                    transaction.isPayment ? 'bg-green-50 dark:bg-green-900/20' : 'bg-primary/10'
                  }`}>
                    {transaction.isPayment ? (
                      <ArrowDown className={`w-5 h-5 text-green-600 dark:text-green-400`} />
                    ) : (
                      <ArrowUp className={`w-5 h-5 text-primary`} />
                    )}
                  </div>
                  <div>
                    <p className="text-text-light dark:text-text-dark font-semibold text-sm">
                      {transaction.title}
                    </p>
                    <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark mt-0.5">
                      {format(transaction.date, 'MMMM d, yyyy • h:mm a')}
                    </p>
                  </div>
                </div>
                <p className={`font-bold text-lg ${
                  transaction.isPayment ? 'text-green-600 dark:text-green-400' : 'text-primary'
                }`}>
                  {transaction.isPayment ? '-' : '+'}${(transaction.amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <History className="w-12 h-12 text-text-secondary-light dark:text-text-secondary-dark mb-3 mx-auto" />
            <p className="text-text-secondary-light dark:text-text-secondary-dark font-medium">
              No recent transactions
            </p>
          </div>
        )}
      </div>
    </>
  );
}
