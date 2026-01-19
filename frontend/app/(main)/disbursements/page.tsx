'use client';

import { useDisbursements } from '@/lib/hooks/useDisbursement';
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

function getDisbursementAmount(disbursement: any): number {
  const amount = disbursement.disbursedAmount || disbursement.disbursementAmount || 0;
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

function getStatusVariant(status?: string): 'success' | 'warning' | 'error' | 'info' | 'default' {
  if (!status) return 'default';
  const normalizedStatus = status.toUpperCase();
  if (normalizedStatus === 'COMPLETED' || normalizedStatus === 'DISBURSED' || normalizedStatus === 'SUCCESS') {
    return 'success';
  }
  if (normalizedStatus === 'PENDING' || normalizedStatus === 'PROCESSING') {
    return 'warning';
  }
  if (normalizedStatus === 'FAILED' || normalizedStatus === 'CANCELLED') {
    return 'error';
  }
  return 'default';
}

function getStatusIcon(status?: string) {
  if (!status) return <Clock className="w-4 h-4" />;
  const normalizedStatus = status.toUpperCase();
  if (normalizedStatus === 'COMPLETED' || normalizedStatus === 'DISBURSED' || normalizedStatus === 'SUCCESS') {
    return <CheckCircle className="w-4 h-4" />;
  }
  if (normalizedStatus === 'PENDING' || normalizedStatus === 'PROCESSING') {
    return <Clock className="w-4 h-4" />;
  }
  return <Clock className="w-4 h-4" />;
}

export default function DisbursementsPage() {
  const { data: disbursements = [], isLoading } = useDisbursements();
  const { data: loans = [] } = useLoans();
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Calculate statistics
  const stats = useMemo(() => {
    const totalDisbursements = disbursements.length;
    const totalAmount = disbursements.reduce((sum, disb) => {
      return sum + getDisbursementAmount(disb);
    }, 0);
    const avgAmount = totalDisbursements > 0 && totalAmount > 0 && !isNaN(totalAmount)
      ? totalAmount / totalDisbursements
      : 0;
    const completedCount = disbursements.filter(
      (disb) => 
        (disb.status || '').toUpperCase() === 'COMPLETED' || 
        (disb.status || '').toUpperCase() === 'DISBURSED' ||
        (disb.status || '').toUpperCase() === 'SUCCESS'
    ).length;
    const pendingCount = disbursements.filter(
      (disb) => 
        (disb.status || '').toUpperCase() === 'PENDING' || 
        (disb.status || '').toUpperCase() === 'PROCESSING'
    ).length;

    // Calculate this month's disbursements
    const now = new Date();
    const thisMonthDisbursements = disbursements.filter((disb) => {
      if (!disb.disbursementDate) return false;
      const disbDate = new Date(disb.disbursementDate);
      return disbDate.getMonth() === now.getMonth() && disbDate.getFullYear() === now.getFullYear();
    });
    const thisMonthAmount = thisMonthDisbursements.reduce((sum, disb) => {
      return sum + getDisbursementAmount(disb);
    }, 0);

    return {
      totalDisbursements,
      totalAmount: totalAmount > 0 ? totalAmount : 0,
      avgAmount: avgAmount > 0 ? avgAmount : 0,
      completedCount,
      pendingCount,
      thisMonthCount: thisMonthDisbursements.length,
      thisMonthAmount: thisMonthAmount > 0 ? thisMonthAmount : 0,
    };
  }, [disbursements]);

  // Filter disbursements
  const filteredDisbursements = useMemo(() => {
    return disbursements.filter((disb) => {
      const searchLower = searchTerm.toLowerCase();
      return (
        (disb.id || '').toLowerCase().includes(searchLower) ||
        (disb.referenceNumber || '').toLowerCase().includes(searchLower) ||
        (disb.loanId || '').toLowerCase().includes(searchLower) ||
        (disb.status || '').toLowerCase().includes(searchLower) ||
        (disb.modeOfPayment || '').toLowerCase().includes(searchLower) ||
        (loans.find(l => l.id === disb.loanId)?.loanNumber || '').toLowerCase().includes(searchLower)
      );
    });
  }, [disbursements, searchTerm, loans]);

  const { sortedData, handleSort, getSortDirection } = useSort(filteredDisbursements);
  const { currentPage, totalPages, paginatedData, goToPage } = usePagination({
    data: sortedData,
    itemsPerPage: 10,
  });

  // Calculate filtered statistics
  const filteredStats = useMemo(() => {
    const filteredTotalAmount = filteredDisbursements.reduce((sum, disb) => {
      return sum + getDisbursementAmount(disb);
    }, 0);
    
    const filteredAvgAmount = filteredDisbursements.length > 0 && filteredTotalAmount > 0 && !isNaN(filteredTotalAmount)
      ? filteredTotalAmount / filteredDisbursements.length
      : 0;

    return {
      totalAmount: filteredTotalAmount > 0 ? filteredTotalAmount : 0,
      avgAmount: filteredAvgAmount > 0 ? filteredAvgAmount : 0,
    };
  }, [filteredDisbursements]);

  return (
    <div className="px-4 py-8 md:px-8 lg:px-12 xl:px-20">
      <div className="mx-auto max-w-7xl">
        {/* Breadcrumb */}
        <div className="mb-6">
          <Breadcrumb items={[{ label: 'Disbursements' }]} />
        </div>

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-4xl font-black text-gray-900 leading-tight tracking-tight">
              Disbursements
            </h1>
            <p className="text-base text-gray-600 mt-2">
              Track and manage all loan disbursements
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
        {!isLoading && disbursements.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
            {/* Total Disbursements */}
            <div className="rounded-lg border border-gray-200 bg-white shadow-sm hover:shadow transition-shadow p-4">
              <div className="flex items-start justify-between mb-2">
                <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Total</p>
                <FileText className="w-4 h-4 text-gray-400 flex-shrink-0" />
              </div>
              <p className="text-2xl font-bold text-gray-900 leading-tight mb-1">{stats.totalDisbursements}</p>
              <p className="text-[10px] text-gray-500">Disbursements</p>
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

            {/* Completed */}
            <div className="rounded-lg border border-gray-200 bg-white shadow-sm hover:shadow transition-shadow p-4">
              <div className="flex items-start justify-between mb-2">
                <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Completed</p>
                <CheckCircle className="w-4 h-4 text-gray-400 flex-shrink-0" />
              </div>
              <p className="text-2xl font-bold text-gray-900 leading-tight mb-1">{stats.completedCount}</p>
              <p className="text-[10px] text-gray-500">
                {stats.totalDisbursements > 0 ? `${Math.round((stats.completedCount / stats.totalDisbursements) * 100)}%` : '0%'}
              </p>
            </div>

            {/* Pending */}
            <div className="rounded-lg border border-gray-200 bg-white shadow-sm hover:shadow transition-shadow p-4">
              <div className="flex items-start justify-between mb-2">
                <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Pending</p>
                <Clock className="w-4 h-4 text-gray-400 flex-shrink-0" />
              </div>
              <p className="text-2xl font-bold text-gray-900 leading-tight mb-1">{stats.pendingCount}</p>
              <p className="text-[10px] text-gray-500">In Process</p>
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
              <p className="text-[10px] text-gray-500">Per Disbursement</p>
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
                placeholder="Search by ID, reference, loan number, status..."
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
        ) : filteredDisbursements.length === 0 ? (
          <EmptyState
            title="No disbursements found"
            description={searchTerm ? "Try adjusting your search criteria" : "No disbursements have been recorded yet"}
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
                      onSort={() => handleSort('disbursedAmount' as keyof typeof paginatedData[0])}
                      sortDirection={getSortDirection('disbursedAmount' as keyof typeof paginatedData[0])}
                      className="font-semibold text-gray-700 text-xs py-2 px-3"
                    >
                      Amount
                    </SortableHeader>
                    <SortableHeader
                      onSort={() => handleSort('disbursementDate' as keyof typeof paginatedData[0])}
                      sortDirection={getSortDirection('disbursementDate' as keyof typeof paginatedData[0])}
                      className="font-semibold text-gray-700 text-xs py-2 px-3"
                    >
                      Date
                    </SortableHeader>
                    <SortableHeader
                      onSort={() => handleSort('modeOfPayment' as keyof typeof paginatedData[0])}
                      sortDirection={getSortDirection('modeOfPayment' as keyof typeof paginatedData[0])}
                      className="font-semibold text-gray-700 text-xs py-2 px-3"
                    >
                      Payment Mode
                    </SortableHeader>
                    <SortableHeader
                      onSort={() => handleSort('status' as keyof typeof paginatedData[0])}
                      sortDirection={getSortDirection('status' as keyof typeof paginatedData[0])}
                      className="font-semibold text-gray-700 text-xs py-2 px-3"
                    >
                      Status
                    </SortableHeader>
                    <TableHead className="text-right font-semibold text-gray-700 text-xs py-2 px-3">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <tbody className="divide-y divide-gray-200">
                  {paginatedData.map((disbursement) => {
                    const loan = loans.find(l => l.id === disbursement.loanId);
                    const amount = getDisbursementAmount(disbursement);
                    const statusVariant = getStatusVariant(disbursement.status);
                    const statusIcon = getStatusIcon(disbursement.status);

                    return (
                      <TableRow key={disbursement.id} className="hover:bg-gray-50">
                        <TableCell className="py-2 px-3">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <FileText className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                            <span className="text-xs font-medium text-gray-900 truncate" title={disbursement.referenceNumber || disbursement.id}>
                              {disbursement.referenceNumber || disbursement.id?.slice(0, 12) || 'N/A'}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="py-2 px-3">
                          <Link 
                            href={`/loans/${disbursement.loanId}`}
                            className="flex items-center gap-1.5 min-w-0 group"
                          >
                            <Building2 className="w-3.5 h-3.5 text-gray-400 flex-shrink-0 group-hover:text-primary transition-colors" />
                            <span className="text-xs text-gray-900 font-medium truncate hover:text-primary transition-colors" title={loan?.loanNumber || disbursement.loanId}>
                              {loan?.loanNumber || disbursement.loanId?.slice(0, 12) || 'N/A'}
                            </span>
                            <ArrowRight className="w-3 h-3 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </Link>
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
                            <Calendar className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                            <span className="text-xs text-gray-900">
                              {disbursement.disbursementDate ? format(new Date(disbursement.disbursementDate), 'MMM d, yyyy') : 'N/A'}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="py-2 px-3">
                          <div className="flex items-center gap-1.5">
                            <CreditCard className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                            <span className="text-xs text-gray-600">
                              {disbursement.modeOfPayment || 'N/A'}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="py-2 px-3">
                          <Badge variant={statusVariant} className="inline-flex items-center gap-1 text-xs py-0.5 px-2">
                            <span className="w-3 h-3" style={{ width: '12px', height: '12px' }}>
                              {statusIcon}
                            </span>
                            {disbursement.status || 'N/A'}
                          </Badge>
                        </TableCell>
                        <TableCell className="py-2 px-3 text-right">
                          <Link href={`/disbursements/${disbursement.id}`}>
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
