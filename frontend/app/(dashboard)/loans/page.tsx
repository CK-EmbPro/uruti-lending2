'use client';

import { useLoans } from '@/lib/hooks/useLoan';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { Table, TableHeader, TableRow, TableHead, TableCell } from '@/components/ui/Table';
import { SortableHeader } from '@/components/ui/SortableHeader';
import { Pagination } from '@/components/ui/Pagination';
import { TableSkeleton } from '@/components/ui/Skeleton';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { Select } from '@/components/ui/Select';
import { usePagination } from '@/hooks/usePagination';
import { useSort } from '@/hooks/useSort';
import Link from 'next/link';
import {
  Plus,
  FileText,
  Search,
  Filter,
  DollarSign,
  TrendingUp,
  CheckCircle2,
  AlertCircle,
  X,
  Calendar,
  Users,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import { useState, useMemo } from 'react';
import { cn } from '@/lib/utils/cn';

function getStatusVariant(status: string): 'success' | 'warning' | 'error' | 'info' | 'default' {
  if (status === 'Disbursed' || status === 'Active') return 'success';
  if (status === 'Closed') return 'default';
  if (status === 'Rejected' || status === 'Cancelled') return 'error';
  if (status === 'Sanctioned' || status === 'Partially Disbursed') return 'info';
  return 'warning';
}

export default function LoansPage() {
  const { data: loans = [], isLoading } = useLoans();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);

  // Calculate statistics
  const stats = useMemo(() => {
    const totalLoans = loans.length;
    const totalAmount = loans.reduce((sum, loan) => sum + loan.loanAmount, 0);
    const totalDisbursed = loans.reduce((sum, loan) => sum + loan.disbursedAmount, 0);
    const activeLoans = loans.filter(
      (loan) => loan.status === 'Active' || loan.status === 'Disbursed' || loan.status === 'Partially Disbursed'
    ).length;
    const closedLoans = loans.filter((loan) => loan.status === 'Closed').length;
    const totalPaid = loans.reduce((sum, loan) => sum + loan.totalAmountPaid, 0);
    const outstandingAmount = totalDisbursed - totalPaid;

    return {
      totalLoans,
      totalAmount,
      totalDisbursed,
      activeLoans,
      closedLoans,
      totalPaid,
      outstandingAmount,
    };
  }, [loans]);

  // Get unique statuses for filter
  const uniqueStatuses = useMemo(() => {
    const statuses = Array.from(new Set(loans.map((loan) => loan.status))).sort();
    return statuses;
  }, [loans]);

  const filteredLoans = useMemo(
    () => {
      let filtered = loans.filter(
        (loan) =>
          loan.loanNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          loan.applicantType?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          loan.id?.toLowerCase().includes(searchTerm.toLowerCase())
      );

      if (statusFilter !== 'all') {
        filtered = filtered.filter((loan) => loan.status === statusFilter);
      }

      return filtered;
    },
    [loans, searchTerm, statusFilter]
  );

  const { sortedData, handleSort, getSortDirection } = useSort(filteredLoans);
  const { currentPage, totalPages, paginatedData, goToPage } = usePagination({
    data: sortedData,
    itemsPerPage: 10,
  });

  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setShowFilters(false);
  };

  const hasActiveFilters = searchTerm !== '' || statusFilter !== 'all';

  return (
    <div className="space-y-6 md:space-y-8">
      <Breadcrumb items={[{ label: 'Loans' }]} />

      {/* Header Section */}
      <div className="flex flex-col gap-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-black tracking-tight bg-gradient-to-r from-gray-900 via-blue-800 to-gray-900 bg-clip-text text-transparent">
              Loans Management
            </h1>
            <p className="text-sm md:text-base text-gray-600 mt-2">
              Manage and track all loans in the system. Monitor disbursements, repayments, and loan status.
            </p>
          </div>
          <Link href="/loans/new">
            <Button className="w-full sm:w-auto shadow-lg hover:shadow-xl transition-shadow">
              <Plus className="w-4 h-4 mr-2" />
              New Loan
            </Button>
          </Link>
        </div>

        {/* Statistics Cards */}
        {!isLoading && loans.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-700 mb-1">Total Loans</p>
                  <p className="text-2xl md:text-3xl font-bold text-blue-900">{stats.totalLoans}</p>
                </div>
                <div className="p-3 bg-blue-200 rounded-lg">
                  <FileText className="w-6 h-6 text-blue-700" />
                </div>
              </div>
            </Card>

            <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200 hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-700 mb-1">Total Amount</p>
                  <p className="text-2xl md:text-3xl font-bold text-green-900">
                    ${(stats.totalAmount / 1000).toFixed(0)}K
                  </p>
                </div>
                <div className="p-3 bg-green-200 rounded-lg">
                  <DollarSign className="w-6 h-6 text-green-700" />
                </div>
              </div>
            </Card>

            <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-700 mb-1">Active Loans</p>
                  <p className="text-2xl md:text-3xl font-bold text-purple-900">{stats.activeLoans}</p>
                </div>
                <div className="p-3 bg-purple-200 rounded-lg">
                  <TrendingUp className="w-6 h-6 text-purple-700" />
                </div>
              </div>
            </Card>

            <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200 hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-orange-700 mb-1">Outstanding</p>
                  <p className="text-2xl md:text-3xl font-bold text-orange-900">
                    ${(stats.outstandingAmount / 1000).toFixed(0)}K
                  </p>
                </div>
                <div className="p-3 bg-orange-200 rounded-lg">
                  <AlertCircle className="w-6 h-6 text-orange-700" />
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>

      {/* Search and Filters */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search Bar */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by loan number, applicant type, or ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-sm hover:shadow-md"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Filter Toggle */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className={cn(
                'shadow-sm hover:shadow-md transition-shadow',
                showFilters && 'bg-blue-50 border-blue-300'
              )}
            >
              <Filter className="w-4 h-4 mr-2" />
              Filters
              {hasActiveFilters && (
                <span className="ml-2 px-2 py-0.5 bg-blue-600 text-white text-xs rounded-full">
                  {[searchTerm && '1', statusFilter !== 'all' && '1'].filter(Boolean).length}
                </span>
              )}
            </Button>
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters} className="text-xs">
                Clear
              </Button>
            )}
          </div>
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-4 md:p-6 animate-in slide-in-from-top-2 duration-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                <Filter className="w-4 h-4" />
                Filters
              </h3>
              <button
                onClick={() => setShowFilters(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <Select
                  label="Status"
                  options={[
                    { value: 'all', label: 'All Statuses' },
                    ...uniqueStatuses.map((status) => ({
                      value: status,
                      label: status,
                    })),
                  ]}
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Results Count */}
      {!isLoading && filteredLoans.length > 0 && (
        <div className="flex items-center justify-between text-sm text-gray-600">
          <p>
            Showing <span className="font-semibold text-gray-900">{paginatedData.length}</span> of{' '}
            <span className="font-semibold text-gray-900">{filteredLoans.length}</span> loans
            {hasActiveFilters && ' (filtered)'}
          </p>
        </div>
      )}

      {/* Loans Table */}
      <Card className="overflow-hidden">
        {isLoading ? (
          <div className="p-6">
            <TableSkeleton rows={8} />
          </div>
        ) : paginatedData && paginatedData.length > 0 ? (
          <>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <SortableHeader
                      onSort={() => handleSort('loanNumber' as keyof typeof paginatedData[0])}
                      sortDirection={getSortDirection('loanNumber' as keyof typeof paginatedData[0])}
                    >
                      Loan Number
                    </SortableHeader>
                    <SortableHeader
                      onSort={() => handleSort('applicantType' as keyof typeof paginatedData[0])}
                      sortDirection={getSortDirection('applicantType' as keyof typeof paginatedData[0])}
                    >
                      Applicant Type
                    </SortableHeader>
                    <SortableHeader
                      onSort={() => handleSort('loanAmount' as keyof typeof paginatedData[0])}
                      sortDirection={getSortDirection('loanAmount' as keyof typeof paginatedData[0])}
                    >
                      Loan Amount
                    </SortableHeader>
                    <SortableHeader
                      onSort={() => handleSort('disbursedAmount' as keyof typeof paginatedData[0])}
                      sortDirection={getSortDirection('disbursedAmount' as keyof typeof paginatedData[0])}
                    >
                      Disbursed
                    </SortableHeader>
                    <TableHead>Outstanding</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <tbody className="divide-y divide-gray-200">
                  {paginatedData.map((loan) => {
                    const outstanding = loan.disbursedAmount - loan.totalAmountPaid;
                    const disbursementPercentage =
                      loan.loanAmount > 0 ? (loan.disbursedAmount / loan.loanAmount) * 100 : 0;
                    const repaymentPercentage =
                      loan.disbursedAmount > 0
                        ? (loan.totalAmountPaid / loan.disbursedAmount) * 100
                        : 0;

                    return (
                      <TableRow
                        key={loan.id}
                        onClick={() => (window.location.href = `/loans/${loan.id}`)}
                        className="cursor-pointer hover:bg-blue-50/50 transition-colors group"
                      >
                        <TableCell className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                          <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4 text-gray-400" />
                            {loan.loanNumber || loan.id.slice(0, 8)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Users className="w-4 h-4 text-gray-400" />
                            <span className="capitalize">{loan.applicantType}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <span className="font-semibold text-gray-900">
                              ${loan.loanAmount.toLocaleString()}
                            </span>
                            {loan.isTermLoan && (
                              <Badge variant="info" size="sm" className="ml-2">
                                Term
                              </Badge>
                            )}
                            {loan.isSecuredLoan && (
                              <Badge variant="info" size="sm" className="ml-2">
                                Secured
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <span className="font-medium text-gray-900">
                              ${loan.disbursedAmount.toLocaleString()}
                            </span>
                            <div className="w-full bg-gray-200 rounded-full h-1.5">
                              <div
                                className="bg-blue-600 h-1.5 rounded-full transition-all"
                                style={{ width: `${Math.min(disbursementPercentage, 100)}%` }}
                              />
                            </div>
                            <span className="text-xs text-gray-500">
                              {disbursementPercentage.toFixed(0)}% of loan
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <span
                              className={cn(
                                'font-medium',
                                outstanding > 0 ? 'text-orange-600' : 'text-green-600'
                              )}
                            >
                              ${outstanding.toLocaleString()}
                            </span>
                            {loan.disbursedAmount > 0 && (
                              <>
                                <div className="w-full bg-gray-200 rounded-full h-1.5">
                                  <div
                                    className={cn(
                                      'h-1.5 rounded-full transition-all',
                                      repaymentPercentage >= 100
                                        ? 'bg-green-600'
                                        : repaymentPercentage >= 50
                                        ? 'bg-yellow-500'
                                        : 'bg-orange-500'
                                    )}
                                    style={{ width: `${Math.min(repaymentPercentage, 100)}%` }}
                                  />
                                </div>
                                <span className="text-xs text-gray-500">
                                  {repaymentPercentage.toFixed(0)}% repaid
                                </span>
                              </>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={getStatusVariant(loan.status)} size="md">
                            {loan.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div onClick={(e: any) => e.stopPropagation()}>
                            <Link href={`/loans/${loan.id}`}>
                              <Button
                                variant="outline"
                                size="sm"
                                className="group-hover:bg-blue-600 group-hover:text-white group-hover:border-blue-600 transition-colors"
                              >
                                View
                                <ArrowUpRight className="w-3.5 h-3.5 ml-1.5" />
                              </Button>
                            </Link>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </tbody>
              </Table>
            </div>
            {totalPages > 1 && (
              <div className="p-4 md:p-6 border-t bg-gray-50">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={goToPage}
                />
              </div>
            )}
          </>
        ) : (
          <div className="p-8 md:p-12">
            <EmptyState
              icon={<FileText className="w-16 h-16 text-gray-400" />}
              title={hasActiveFilters ? 'No loans match your filters' : 'No loans found'}
              description={
                hasActiveFilters
                  ? 'Try adjusting your search terms or filters to find what you\'re looking for.'
                  : 'Get started by creating your first loan or loan application.'
              }
              action={
                !hasActiveFilters
                  ? {
                      label: 'Create New Loan',
                      onClick: () => (window.location.href = '/loans/new'),
                    }
                  : {
                      label: 'Clear Filters',
                      onClick: clearFilters,
                    }
              }
            />
          </div>
        )}
      </Card>
    </div>
  );
}
