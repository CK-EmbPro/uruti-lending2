'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { useJournalEntries, useSubmitJournalEntry, useCancelJournalEntry } from '@/lib/hooks/useAccounting';
import { Eye, CheckCircle, XCircle, Plus, Filter, X } from 'lucide-react';
import { format } from 'date-fns';
import type { JournalEntry, JournalEntryStatus, VoucherType } from '@/lib/api/accounting';

interface JournalEntryListProps {
  onViewDetail: (entry: JournalEntry) => void;
  onCreateNew: () => void;
}

export function JournalEntryList({ onViewDetail, onCreateNew }: JournalEntryListProps) {
  const [filters, setFilters] = useState<{
    status?: JournalEntryStatus;
    voucherType?: VoucherType;
    startDate?: string;
    endDate?: string;
  }>({});
  const [showFilters, setShowFilters] = useState(false);

  const { data: entries, isLoading, refetch } = useJournalEntries(filters);
  const submitEntry = useSubmitJournalEntry();
  const cancelEntry = useCancelJournalEntry();

  const getStatusBadge = (status: JournalEntryStatus) => {
    switch (status) {
      case 'Draft':
        return <Badge variant="warning">Draft</Badge>;
      case 'Submitted':
        return <Badge variant="success">Submitted</Badge>;
      case 'Cancelled':
        return <Badge variant="error">Cancelled</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getVoucherTypeColor = (type: VoucherType) => {
    switch (type) {
      case 'Disbursement':
        return 'text-blue-600';
      case 'Repayment':
        return 'text-green-600';
      case 'Write Off':
        return 'text-red-600';
      case 'Refund':
        return 'text-purple-600';
      default:
        return 'text-gray-600';
    }
  };

  const handleSubmit = (id: string) => {
    if (confirm('Are you sure you want to submit this journal entry?')) {
      submitEntry.mutate(id, {
        onSuccess: () => {
          refetch();
        },
      });
    }
  };

  const handleCancel = (id: string) => {
    if (confirm('Are you sure you want to cancel this journal entry?')) {
      cancelEntry.mutate(id, {
        onSuccess: () => {
          refetch();
        },
      });
    }
  };

  const clearFilters = () => {
    setFilters({});
    setShowFilters(false);
  };

  return (
    <Card>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Journal Entries</h2>
          <p className="text-sm text-gray-600 mt-1">
            Manage and track all accounting journal entries
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="w-4 h-4 mr-2" />
            Filters
          </Button>
          <Button onClick={onCreateNew}>
            <Plus className="w-4 h-4 mr-2" />
            New Entry
          </Button>
        </div>
      </div>

      {showFilters && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Select
              label="Status"
              value={filters.status || ''}
              onChange={(e) =>
                setFilters({ ...filters, status: e.target.value as JournalEntryStatus || undefined })
              }
              options={[
                { value: '', label: 'All Statuses' },
                { value: 'Draft', label: 'Draft' },
                { value: 'Submitted', label: 'Submitted' },
                { value: 'Cancelled', label: 'Cancelled' },
              ]}
            />
            <Select
              label="Voucher Type"
              value={filters.voucherType || ''}
              onChange={(e) =>
                setFilters({ ...filters, voucherType: e.target.value as VoucherType || undefined })
              }
              options={[
                { value: '', label: 'All Types' },
                { value: 'Journal Entry', label: 'Journal Entry' },
                { value: 'Disbursement', label: 'Disbursement' },
                { value: 'Repayment', label: 'Repayment' },
                { value: 'Write Off', label: 'Write Off' },
                { value: 'Refund', label: 'Refund' },
                { value: 'Adjustment', label: 'Adjustment' },
              ]}
            />
            <Input
              label="Start Date"
              type="date"
              value={filters.startDate || ''}
              onChange={(e) =>
                setFilters({ ...filters, startDate: e.target.value || undefined })
              }
            />
            <Input
              label="End Date"
              type="date"
              value={filters.endDate || ''}
              onChange={(e) =>
                setFilters({ ...filters, endDate: e.target.value || undefined })
              }
            />
          </div>
          <div className="mt-4 flex justify-end">
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              <X className="w-4 h-4 mr-2" />
              Clear Filters
            </Button>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      ) : !entries || entries.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500">No journal entries found</p>
          <Button className="mt-4" onClick={onCreateNew}>
            <Plus className="w-4 h-4 mr-2" />
            Create First Entry
          </Button>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Voucher No
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Posting Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Debit
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Credit
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Reference
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {entries.map((entry) => (
                <tr key={entry.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{entry.voucherNo}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`text-sm font-medium ${getVoucherTypeColor(entry.voucherType)}`}>
                      {entry.voucherType}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {format(new Date(entry.postingDate), 'MMM dd, yyyy')}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(entry.status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="text-sm font-medium text-gray-900">
                      ${Number(entry.totalDebit).toLocaleString('en-US', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="text-sm font-medium text-gray-900">
                      ${Number(entry.totalCredit).toLocaleString('en-US', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {entry.referenceType && entry.referenceId ? (
                      <div className="text-sm text-gray-600">
                        {entry.referenceType}: {entry.referenceId.substring(0, 8)}...
                      </div>
                    ) : (
                      <span className="text-sm text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onViewDetail(entry)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      {entry.status === 'Draft' && (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleSubmit(entry.id)}
                            disabled={submitEntry.isPending}
                          >
                            <CheckCircle className="w-4 h-4 text-green-600" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleCancel(entry.id)}
                            disabled={cancelEntry.isPending}
                          >
                            <XCircle className="w-4 h-4 text-red-600" />
                          </Button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}

