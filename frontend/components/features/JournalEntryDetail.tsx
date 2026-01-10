'use client';

import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { useJournalEntry } from '@/lib/hooks/useAccounting';
import { format } from 'date-fns';
import type { JournalEntry } from '@/lib/api/accounting';

interface JournalEntryDetailProps {
  entryId: string;
  onClose: () => void;
}

export function JournalEntryDetail({ entryId, onClose }: JournalEntryDetailProps) {
  const { data: entry, isLoading } = useJournalEntry(entryId);

  if (isLoading) {
    return (
      <Card>
        <Skeleton className="h-8 w-64 mb-4" />
        <Skeleton className="h-96 w-full" />
      </Card>
    );
  }

  if (!entry) {
    return (
      <Card>
        <p className="text-gray-500">Journal entry not found</p>
      </Card>
    );
  }

  const getStatusBadge = (status: string) => {
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

  const isBalanced = Number(entry.totalDebit) === Number(entry.totalCredit);

  return (
    <div className="space-y-6">
      <Card>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Journal Entry Details</h2>
            <p className="text-sm text-gray-600 mt-1">Voucher: {entry.voucherNo}</p>
          </div>
          {getStatusBadge(entry.status)}
        </div>

        <div className="grid grid-cols-2 gap-6 mb-6">
          <div>
            <p className="text-sm text-gray-600">Voucher Type</p>
            <p className="text-base font-medium text-gray-900">{entry.voucherType}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Posting Date</p>
            <p className="text-base font-medium text-gray-900">
              {format(new Date(entry.postingDate), 'MMM dd, yyyy')}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Value Date</p>
            <p className="text-base font-medium text-gray-900">
              {format(new Date(entry.valueDate), 'MMM dd, yyyy')}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Company ID</p>
            <p className="text-base font-medium text-gray-900">{entry.companyId}</p>
          </div>
          {entry.referenceType && (
            <div>
              <p className="text-sm text-gray-600">Reference Type</p>
              <p className="text-base font-medium text-gray-900">{entry.referenceType}</p>
            </div>
          )}
          {entry.referenceId && (
            <div>
              <p className="text-sm text-gray-600">Reference ID</p>
              <p className="text-base font-medium text-gray-900">{entry.referenceId}</p>
            </div>
          )}
          {entry.costCenter && (
            <div>
              <p className="text-sm text-gray-600">Cost Center</p>
              <p className="text-base font-medium text-gray-900">{entry.costCenter}</p>
            </div>
          )}
          <div>
            <p className="text-sm text-gray-600">Created At</p>
            <p className="text-base font-medium text-gray-900">
              {format(new Date(entry.createdAt), 'MMM dd, yyyy HH:mm')}
            </p>
          </div>
        </div>

        {entry.remarks && (
          <div className="mb-6">
            <p className="text-sm text-gray-600 mb-1">Remarks</p>
            <p className="text-base text-gray-900">{entry.remarks}</p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
          <div>
            <p className="text-sm text-gray-600">Total Debit</p>
            <p className="text-2xl font-bold text-gray-900">
              ${Number(entry.totalDebit).toLocaleString('en-US', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Total Credit</p>
            <p className="text-2xl font-bold text-gray-900">
              ${Number(entry.totalCredit).toLocaleString('en-US', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </p>
          </div>
        </div>

        {!isBalanced && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm font-medium text-red-800">
              ⚠️ Warning: Entry is not balanced. Debit and Credit amounts do not match.
            </p>
          </div>
        )}
      </Card>

      <Card>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">GL Entries</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Account
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Account Name
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Against Account
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Debit
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Credit
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Party
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Remarks
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {entry.glEntries.map((glEntry) => (
                <tr key={glEntry.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{glEntry.account}</div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{glEntry.accountName || '-'}</div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{glEntry.againstAccount || '-'}</div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-right">
                    {Number(glEntry.debit) > 0 ? (
                      <div className="text-sm font-medium text-gray-900">
                        ${Number(glEntry.debit).toLocaleString('en-US', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </div>
                    ) : (
                      <span className="text-sm text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-right">
                    {Number(glEntry.credit) > 0 ? (
                      <div className="text-sm font-medium text-gray-900">
                        ${Number(glEntry.credit).toLocaleString('en-US', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </div>
                    ) : (
                      <span className="text-sm text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {glEntry.party ? (
                      <div className="text-sm text-gray-600">
                        {glEntry.partyType || 'Party'}: {glEntry.party}
                      </div>
                    ) : (
                      <span className="text-sm text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-sm text-gray-600">{glEntry.remarks || '-'}</div>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-gray-50">
              <tr>
                <td colSpan={3} className="px-4 py-3 text-right text-sm font-medium text-gray-900">
                  Totals:
                </td>
                <td className="px-4 py-3 text-right text-sm font-bold text-gray-900">
                  ${Number(entry.totalDebit).toLocaleString('en-US', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </td>
                <td className="px-4 py-3 text-right text-sm font-bold text-gray-900">
                  ${Number(entry.totalCredit).toLocaleString('en-US', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </td>
                <td colSpan={2}></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </Card>
    </div>
  );
}

