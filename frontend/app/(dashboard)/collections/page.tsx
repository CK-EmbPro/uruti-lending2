'use client';

import { useState } from 'react';
import { useDelinquentLoans } from '@/lib/hooks/useCollections';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import Link from 'next/link';
import {
  AlertCircle,
  DollarSign,
  Calendar,
  TrendingUp,
  Filter,
  Search,
} from 'lucide-react';
import { format } from 'date-fns';

export default function CollectionsPage() {
  const [stage, setStage] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const { data: loans, isLoading } = useDelinquentLoans(stage || undefined);

  const getCollectionStage = (dpd: number) => {
    if (dpd <= 30) return 'Early Delinquency';
    if (dpd <= 60) return 'Moderate Delinquency';
    if (dpd <= 90) return 'Serious Delinquency';
    if (dpd <= 120) return 'Severe Delinquency';
    return 'Charge-Off Eligible';
  };

  const getStageColor = (stage: string) => {
    switch (stage) {
      case 'Early Delinquency':
        return 'bg-yellow-100 text-yellow-800';
      case 'Moderate Delinquency':
        return 'bg-orange-100 text-orange-800';
      case 'Serious Delinquency':
        return 'bg-red-100 text-red-800';
      case 'Severe Delinquency':
        return 'bg-red-200 text-red-900';
      case 'Charge-Off Eligible':
        return 'bg-gray-900 text-white';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredLoans = loans?.filter((loan: any) => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      loan.loanNumber?.toLowerCase().includes(search) ||
      loan.applicantId?.toLowerCase().includes(search)
    );
  }) || [];

  const stageStats = {
    'Early Delinquency': filteredLoans.filter((l: any) => getCollectionStage(l.daysPastDue) === 'Early Delinquency').length,
    'Moderate Delinquency': filteredLoans.filter((l: any) => getCollectionStage(l.daysPastDue) === 'Moderate Delinquency').length,
    'Serious Delinquency': filteredLoans.filter((l: any) => getCollectionStage(l.daysPastDue) === 'Serious Delinquency').length,
    'Severe Delinquency': filteredLoans.filter((l: any) => getCollectionStage(l.daysPastDue) === 'Severe Delinquency').length,
    'Charge-Off Eligible': filteredLoans.filter((l: any) => getCollectionStage(l.daysPastDue) === 'Charge-Off Eligible').length,
  };

  return (
    <div className="px-4 py-8 md:px-8 lg:px-12 xl:px-20">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-black text-gray-900 mb-2">Collections Management</h1>
          <p className="text-gray-600">Manage delinquent accounts and collection activities</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          {Object.entries(stageStats).map(([stageName, count]) => (
            <Card key={stageName} className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">{stageName}</p>
                  <p className="text-2xl font-bold text-gray-900">{count}</p>
                </div>
                <Badge className={getStageColor(stageName)}>{count}</Badge>
              </div>
            </Card>
          ))}
        </div>

        {/* Filters */}
        <Card className="p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  placeholder="Search by loan number or applicant..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select
              label="Filter by Stage"
              value={stage}
              onChange={(e) => setStage(e.target.value)}
              options={[
                { value: '', label: 'All Stages' },
                { value: 'Early Delinquency', label: 'Early Delinquency' },
                { value: 'Moderate Delinquency', label: 'Moderate Delinquency' },
                { value: 'Serious Delinquency', label: 'Serious Delinquency' },
                { value: 'Severe Delinquency', label: 'Severe Delinquency' },
                { value: 'Charge-Off Eligible', label: 'Charge-Off Eligible' },
              ]}
            />
          </div>
        </Card>

        {/* Delinquent Loans Table */}
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-20" />
            ))}
          </div>
        ) : filteredLoans.length === 0 ? (
          <Card className="p-12 text-center">
            <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No delinquent loans found</p>
          </Card>
        ) : (
          <Card>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                      Loan Number
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                      Days Past Due
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                      Stage
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                      Outstanding Balance
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-600 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredLoans.map((loan: any) => {
                    const collectionStage = getCollectionStage(loan.daysPastDue);
                    const outstandingBalance = (loan.loanAmount || 0) - (loan.totalPrincipalPaid || 0);
                    return (
                      <tr key={loan.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Link href={`/loans/${loan.id}`} className="text-primary hover:underline font-medium">
                            {loan.loanNumber}
                          </Link>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="font-semibold text-red-600">{loan.daysPastDue || 0}</span> days
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge className={getStageColor(collectionStage)}>{collectionStage}</Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          ${outstandingBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge variant="default">{loan.status}</Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <Link href={`/loans/${loan.id}`}>
                            <Button variant="outline" size="sm">
                              View Details
                            </Button>
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}

