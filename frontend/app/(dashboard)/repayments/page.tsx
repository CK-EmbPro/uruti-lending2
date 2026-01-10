'use client';

import { useRepayments } from '@/lib/hooks/useRepayment';
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
import { usePagination } from '@/hooks/usePagination';
import { useSort } from '@/hooks/useSort';
import Link from 'next/link';
import { 
  DollarSign,
  Calendar,
  FileText,
  TrendingUp,
  Eye,
  Download,
  Search,
  Filter,
  X,
  CheckCircle,
  Clock,
  CreditCard,
  Building2,
  ArrowRight,
  Receipt,
  Percent,
} from 'lucide-react';
import { useState, useMemo } from 'react';
import { format } from 'date-fns';

function formatCompactNumber(num: number): string {
  if (typeof num !== 'number' || isNaN(num)) return '0';
  const value = Number(num);
  if (value === 0) return '0';

  const absValue = Math.abs(value);

  if (absValue < 1000) return value.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  if (absValue < 1000000) {
    const kValue = value / 1000;
    return `${kValue.toFixed(kValue % 1 === 0 ? 0 : 1)}K`;
  }
  if (absValue < 1000000000) {
    const mValue = value / 1000000;
    return `${mValue.toFixed(mValue % 1 === 0 ? 0 : 1)}M`;
  }
  const bValue = value / 1000000000;
  return `${bValue.toFixed(bValue % 1 === 0 ? 0 : 1)}B`;
}

function getRepaymentAmount(repayment: any): number {
  const amount = repayment.amountPaid || 0;
  if (typeof amount === 'string') {
    const cleaned = amount.replace(/,/g, '').trim();
    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? 0 : parsed;
  }
  if (typeof amount === 'number') {
    return isNaN(amount) ? 0 : amount;
  }
  return 0;
}

function getRepaymentTypeVariant(type?: string): 'success' | 'warning' | 'info' | 'default' {
  if (!type) return 'default';
  const normalizedType = type.toUpperCase();
  if (normalizedType === 'NORMAL' || normalizedType === 'SCHEDULED') {
    return 'success';
  }
  if (normalizedType === 'EARLY' || normalizedType === 'PARTIAL') {
    return 'info';
  }
  if (normalizedType === 'LATE' || normalizedType === 'OVERDUE') {
    return 'warning';
  }
  return 'default';
}

export default function RepaymentsPage() {
  const { data: repaymentsResponse, isLoading } = useRepayments();
  const repayments = repaymentsResponse?.data || [];
  const { data: loans = [] } = useLoans();
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Calculate statistics
  const stats = useMemo(() => {
    const totalRepayments = repayments.length;
    const totalAmount = repayments.reduce((sum, repay) => {
      return sum + getRepaymentAmount(repay);
    }, 0);
    const avgAmount = totalRepayments > 0 && totalAmount > 0 && !isNaN(totalAmount)
      ? totalAmount / totalRepayments
      : 0;
    
    const totalPrincipal = repayments.reduce((sum, repay) => {
      return sum + (repay.principalPaid || 0);
    }, 0);
    const totalInterest = repayments.reduce((sum, repay) => {
      return sum + (repay.interestPaid || 0);
    }, 0);
    const totalPenalty = repayments.reduce((sum, repay) => {
      return sum + (repay.penaltyPaid || 0);
    }, 0);

    // Calculate this month's repayments
    const now = new Date();
    const thisMonthRepayments = repayments.filter((repay) => {
      if (!repay.postingDate) return false;
      const repayDate = new Date(repay.postingDate);
      return repayDate.getMonth() === now.getMonth() && repayDate.getFullYear() === now.getFullYear();
    });
    const thisMonthAmount = thisMonthRepayments.reduce((sum, repay) => {
      return sum + getRepaymentAmount(repay);
    }, 0);

    return {
      totalRepayments,
      totalAmount: totalAmount > 0 ? totalAmount : 0,
      avgAmount: avgAmount > 0 ? avgAmount : 0,
      totalPrincipal,
      totalInterest,
      totalPenalty,
      thisMonthCount: thisMonthRepayments.length,
      thisMonthAmount: thisMonthAmount > 0 ? thisMonthAmount : 0,
    };
  }, [repayments]);

  // Filter repayments
  const filteredRepayments = useMemo(() => {
    return repayments.filter((repay) => {
      const searchLower = searchTerm.toLowerCase();
      return (
        (repay.id || '').toLowerCase().includes(searchLower) ||
        (repay.referenceNumber || '').toLowerCase().includes(searchLower) ||
        (repay.loanId || '').toLowerCase().includes(searchLower) ||
        (repay.repaymentType || '').toLowerCase().includes(searchLower) ||
        (repay.modeOfPayment || '').toLowerCase().includes(searchLower) ||
        (loans.find(l => l.id === repay.loanId)?.loanNumber || '').toLowerCase().includes(searchLower)
      );
    });
  }, [repayments, searchTerm, loans]);

  const { sortedData, handleSort, getSortDirection } = useSort(filteredRepayments);
  const { currentPage, totalPages, paginatedData, goToPage } = usePagination({
    data: sortedData,
    itemsPerPage: 10,
  });

  // Calculate filtered statistics
  const filteredStats = useMemo(() => {
    const filteredTotalAmount = filteredRepayments.reduce((sum, repay) => {
      return sum + getRepaymentAmount(repay);
    }, 0);
    
    const filteredAvgAmount = filteredRepayments.length > 0 && filteredTotalAmount > 0 && !isNaN(filteredTotalAmount)
      ? filteredTotalAmount / filteredRepayments.length
      : 0;

    return {
      totalAmount: filteredTotalAmount > 0 ? filteredTotalAmount : 0,
      avgAmount: filteredAvgAmount > 0 ? filteredAvgAmount : 0,
    };
  }, [filteredRepayments]);

  return (
    <div className="px-4 py-8 md:px-8 lg:px-12 xl:px-20">
      <div className="mx-auto max-w-7xl">
        {/* Breadcrumb */}
        <div className="mb-6">
          <Breadcrumb items={[{ label: 'Repayments' }]} />
        </div>

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-4xl font-black text-gray-900 leading-tight tracking-tight">
              Repayments
            </h1>
            <p className="text-base text-gray-600 mt-2">
              Track and manage all loan repayments
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2"
            >
              <Filter className="w-4 h-4" />
              Filters
            </Button>
            <Button
              variant="outline"
              className="flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Export
            </Button>
          </div>
        </div>

        {/* Compact Professional Statistics Cards */}
        {!isLoading && repayments.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
            {/* Total Repayments */}
            <div className="rounded-lg border border-gray-200 bg-white shadow-sm hover:shadow transition-shadow p-4">
              <div className="flex items-start justify-between mb-2">
                <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Total</p>
                <Receipt className="w-4 h-4 text-gray-400 flex-shrink-0" />
              </div>
              <p className="text-2xl font-bold text-gray-900 leading-tight mb-1">{stats.totalRepayments}</p>
              <p className="text-[10px] text-gray-500">Repayments</p>
            </div>

            {/* Total Amount */}
            <div className="rounded-lg border border-gray-200 bg-white shadow-sm hover:shadow transition-shadow p-4">
              <div className="flex items-start justify-between mb-2">
                <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Amount</p>
                <DollarSign className="w-4 h-4 text-gray-400 flex-shrink-0" />
              </div>
              <p className="text-2xl font-bold text-gray-900 leading-tight mb-1" title={`$${(filteredStats.totalAmount || 0).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`}>
                ${formatCompactNumber(filteredStats.totalAmount)}
              </p>
              <p className="text-[10px] text-gray-500 truncate" title={`Average: $${(filteredStats.avgAmount || 0).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`}>
                Avg: ${formatCompactNumber(filteredStats.avgAmount)}
              </p>
            </div>

            {/* Principal Paid */}
            <div className="rounded-lg border border-gray-200 bg-white shadow-sm hover:shadow transition-shadow p-4">
              <div className="flex items-start justify-between mb-2">
                <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Principal</p>
                <CreditCard className="w-4 h-4 text-gray-400 flex-shrink-0" />
              </div>
              <p className="text-2xl font-bold text-gray-900 leading-tight mb-1" title={`$${(stats.totalPrincipal || 0).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`}>
                ${formatCompactNumber(stats.totalPrincipal)}
              </p>
              <p className="text-[10px] text-gray-500">Paid</p>
            </div>

            {/* Interest Paid */}
            <div className="rounded-lg border border-gray-200 bg-white shadow-sm hover:shadow transition-shadow p-4">
              <div className="flex items-start justify-between mb-2">
                <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Interest</p>
                <Percent className="w-4 h-4 text-gray-400 flex-shrink-0" />
              </div>
              <p className="text-2xl font-bold text-gray-900 leading-tight mb-1" title={`$${(stats.totalInterest || 0).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`}>
                ${formatCompactNumber(stats.totalInterest)}
              </p>
              <p className="text-[10px] text-gray-500">Paid</p>
            </div>

            {/* This Month */}
            <div className="rounded-lg border border-gray-200 bg-white shadow-sm hover:shadow transition-shadow p-4">
              <div className="flex items-start justify-between mb-2">
                <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">This Month</p>
                <Calendar className="w-4 h-4 text-gray-400 flex-shrink-0" />
              </div>
              <p className="text-2xl font-bold text-gray-900 leading-tight mb-1">{stats.thisMonthCount}</p>
              <p className="text-[10px] text-gray-500 truncate" title={`$${(stats.thisMonthAmount || 0).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`}>
                ${formatCompactNumber(stats.thisMonthAmount)}
              </p>
            </div>

            {/* Average Amount */}
            <div className="rounded-lg border border-gray-200 bg-white shadow-sm hover:shadow transition-shadow p-4">
              <div className="flex items-start justify-between mb-2">
                <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Avg Amount</p>
                <TrendingUp className="w-4 h-4 text-gray-400 flex-shrink-0" />
              </div>
              <p className="text-2xl font-bold text-gray-900 leading-tight mb-1" title={`$${(stats.avgAmount || 0).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`}>
                ${formatCompactNumber(stats.avgAmount)}
              </p>
              <p className="text-[10px] text-gray-500">Per Repayment</p>
            </div>
          </div>
        )}

        {/* Search and Filters */}
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by ID, reference, loan number, type..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Table */}
      {isLoading ? (
          <TableSkeleton rows={5} />
        ) : filteredRepayments.length === 0 ? (
          <EmptyState
            title="No repayments found"
            description={searchTerm ? "Try adjusting your search criteria" : "No repayments have been recorded yet"}
            icon={<FileText className="w-16 h-16 text-gray-400" />}
          />
        ) : (
          <Card className="overflow-hidden">
          <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <SortableHeader
                      onSort={() => handleSort('referenceNumber' as keyof typeof paginatedData[0])}
                      sortDirection={getSortDirection('referenceNumber' as keyof typeof paginatedData[0])}
                      className="font-semibold text-gray-700 text-xs py-2 px-3"
                    >
                      Reference
                    </SortableHeader>
                    <SortableHeader
                      onSort={() => handleSort('loanId' as keyof typeof paginatedData[0])}
                      sortDirection={getSortDirection('loanId' as keyof typeof paginatedData[0])}
                      className="font-semibold text-gray-700 text-xs py-2 px-3"
                    >
                      Loan
                    </SortableHeader>
                    <SortableHeader
                      onSort={() => handleSort('repaymentType' as keyof typeof paginatedData[0])}
                      sortDirection={getSortDirection('repaymentType' as keyof typeof paginatedData[0])}
                      className="font-semibold text-gray-700 text-xs py-2 px-3"
                    >
                      Type
                    </SortableHeader>
                    <SortableHeader
                      onSort={() => handleSort('amountPaid' as keyof typeof paginatedData[0])}
                      sortDirection={getSortDirection('amountPaid' as keyof typeof paginatedData[0])}
                      className="font-semibold text-gray-700 text-xs py-2 px-3"
                    >
                      Amount Paid
                    </SortableHeader>
                    <SortableHeader
                      onSort={() => handleSort('principalPaid' as keyof typeof paginatedData[0])}
                      sortDirection={getSortDirection('principalPaid' as keyof typeof paginatedData[0])}
                      className="font-semibold text-gray-700 text-xs py-2 px-3"
                    >
                      Principal
                    </SortableHeader>
                    <SortableHeader
                      onSort={() => handleSort('postingDate' as keyof typeof paginatedData[0])}
                      sortDirection={getSortDirection('postingDate' as keyof typeof paginatedData[0])}
                      className="font-semibold text-gray-700 text-xs py-2 px-3"
                    >
                      Date
                    </SortableHeader>
                    <TableHead className="text-right font-semibold text-gray-700 text-xs py-2 px-3">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <tbody className="divide-y divide-gray-200">
                  {paginatedData.map((repayment) => {
                    const loan = loans.find(l => l.id === repayment.loanId);
                    const amount = getRepaymentAmount(repayment);
                    const typeVariant = getRepaymentTypeVariant(repayment.repaymentType);

                    return (
                      <TableRow key={repayment.id} className="hover:bg-gray-50">
                        <TableCell className="py-2 px-3">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <Receipt className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                            <span className="text-xs font-medium text-gray-900 truncate" title={repayment.referenceNumber || repayment.id}>
                              {repayment.referenceNumber || repayment.id?.slice(0, 12) || 'N/A'}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="py-2 px-3">
                          <Link 
                            href={`/loans/${repayment.loanId}`}
                            className="flex items-center gap-1.5 min-w-0 group"
                          >
                            <Building2 className="w-3.5 h-3.5 text-gray-400 flex-shrink-0 group-hover:text-primary transition-colors" />
                            <span className="text-xs text-gray-900 font-medium truncate hover:text-primary transition-colors" title={loan?.loanNumber || repayment.loanId}>
                              {loan?.loanNumber || repayment.loanId?.slice(0, 12) || 'N/A'}
                            </span>
                            <ArrowRight className="w-3 h-3 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </Link>
                        </TableCell>
                        <TableCell className="py-2 px-3">
                          <Badge variant={typeVariant} className="text-xs py-0.5 px-2">
                            {repayment.repaymentType || 'N/A'}
                          </Badge>
                        </TableCell>
                        <TableCell className="py-2 px-3">
                          <div className="flex items-center gap-1.5">
                            <DollarSign className="w-3.5 h-3.5 text-secondary flex-shrink-0" />
                            <span 
                              className="text-xs font-bold text-gray-900"
                              title={`$${amount.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`}
                            >
                              ${formatCompactNumber(amount)}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="py-2 px-3">
                          <div className="flex items-center gap-1.5">
                            <CreditCard className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                            <span 
                              className="text-xs text-gray-900"
                              title={`$${(repayment.principalPaid || 0).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`}
                            >
                              ${formatCompactNumber(repayment.principalPaid || 0)}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="py-2 px-3">
                          <div className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                            <span className="text-xs text-gray-900">
                              {repayment.postingDate ? format(new Date(repayment.postingDate), 'MMM d, yyyy') : 'N/A'}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="py-2 px-3 text-right">
                      <Link href={`/repayments/${repayment.id}`}>
                            <Button variant="ghost" size="sm" className="px-2 py-1">
                              <Eye className="w-3.5 h-3.5 mr-1 sm:inline hidden" />
                              <span className="text-xs sm:inline hidden">View</span>
                              <Eye className="w-4 h-4 sm:hidden" />
                            </Button>
                      </Link>
                        </TableCell>
                      </TableRow>
                    );
                  })}
              </tbody>
              </Table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="border-t border-gray-200 px-4 py-3 flex items-center justify-between">
                <button
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="text-sm font-medium text-gray-400 hover:text-primary hover:underline disabled:no-underline disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <div className="text-sm text-gray-600">
                  Page <span className="font-medium">{currentPage}</span> of <span className="font-medium">{totalPages}</span>
                </div>
                <button
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="text-sm font-medium text-primary hover:underline disabled:text-gray-400 disabled:no-underline disabled:cursor-not-allowed"
                >
                  Next
                </button>
          </div>
            )}
        </Card>
      )}
      </div>
    </div>
  );
}
