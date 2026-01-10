'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Skeleton } from '@/components/ui/Skeleton';
import { usePortfolioPerformance } from '@/lib/hooks/useReporting';
import { TrendingUp, TrendingDown, DollarSign, AlertCircle, Percent, BarChart3 } from 'lucide-react';
import { format } from 'date-fns';

export function PortfolioPerformanceDashboard() {
  const [filters, setFilters] = useState({
    fromDate: format(new Date(new Date().setMonth(new Date().getMonth() - 1)), 'yyyy-MM-dd'),
    toDate: format(new Date(), 'yyyy-MM-dd'),
    segmentType: 'PRODUCT' as 'PRODUCT' | 'STATUS' | 'DELINQUENCY_STAGE' | 'GEOGRAPHY',
    includeTrends: true,
  });

  const { data, isLoading, error } = usePortfolioPerformance(filters);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <div className="p-6 text-center text-red-600">
          Failed to load portfolio performance data
        </div>
      </Card>
    );
  }

  if (!data) return null;

  const { summary, byProduct, byStatus, byDelinquencyStage } = data;

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <div className="p-4 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">From Date</label>
            <Input
              type="date"
              value={filters.fromDate}
              onChange={(e) => setFilters({ ...filters, fromDate: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">To Date</label>
            <Input
              type="date"
              value={filters.toDate}
              onChange={(e) => setFilters({ ...filters, toDate: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Segment Type</label>
            <Select
              value={filters.segmentType}
              onChange={(e) => setFilters({ ...filters, segmentType: e.target.value as any })}
            >
              <option value="PRODUCT">By Product</option>
              <option value="STATUS">By Status</option>
              <option value="DELINQUENCY_STAGE">By Delinquency Stage</option>
            </Select>
          </div>
          <div className="flex items-end">
            <Button className="w-full">Apply Filters</Button>
          </div>
        </div>
      </Card>

      {/* Summary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-600">Total Loans</h3>
              <BarChart3 className="h-5 w-5 text-gray-400" />
            </div>
            <p className="text-2xl font-bold">{summary.totalLoans.toLocaleString()}</p>
            <p className="text-sm text-gray-500 mt-1">
              ${summary.totalDisbursed.toLocaleString()} disbursed
            </p>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-600">Total Outstanding</h3>
              <DollarSign className="h-5 w-5 text-gray-400" />
            </div>
            <p className="text-2xl font-bold">${summary.totalOutstanding.toLocaleString()}</p>
            <p className="text-sm text-gray-500 mt-1">
              {summary.totalDelinquentLoans} delinquent loans
            </p>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-600">Delinquency Rate</h3>
              <AlertCircle className="h-5 w-5 text-gray-400" />
            </div>
            <p className="text-2xl font-bold">{summary.delinquencyRate.toFixed(2)}%</p>
            <p className="text-sm text-gray-500 mt-1">
              ${summary.totalDelinquentAmount.toLocaleString()} at risk
            </p>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-600">Profit Margin</h3>
              <Percent className="h-5 w-5 text-gray-400" />
            </div>
            <p className="text-2xl font-bold">{summary.netProfitMargin.toFixed(2)}%</p>
            <p className="text-sm text-gray-500 mt-1">
              ${(summary.totalInterestEarned + summary.totalFeesEarned).toLocaleString()} earned
            </p>
          </div>
        </Card>
      </div>

      {/* By Product Breakdown */}
      {filters.segmentType === 'PRODUCT' && (
        <Card>
          <div className="p-6">
            <h2 className="text-lg font-semibold mb-4">Performance by Product</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Product</th>
                    <th className="text-right p-2">Loans</th>
                    <th className="text-right p-2">Disbursed</th>
                    <th className="text-right p-2">Outstanding</th>
                    <th className="text-right p-2">Delinquent</th>
                    <th className="text-right p-2">Delinquency Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {byProduct.map((product) => (
                    <tr key={product.productId} className="border-b">
                      <td className="p-2">{product.productName}</td>
                      <td className="text-right p-2">{product.loans}</td>
                      <td className="text-right p-2">${product.disbursed.toLocaleString()}</td>
                      <td className="text-right p-2">${product.outstanding.toLocaleString()}</td>
                      <td className="text-right p-2">{product.delinquent}</td>
                      <td className="text-right p-2">
                        <span className={product.delinquencyRate > 10 ? 'text-red-600' : 'text-green-600'}>
                          {product.delinquencyRate.toFixed(2)}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </Card>
      )}

      {/* By Delinquency Stage */}
      {filters.segmentType === 'DELINQUENCY_STAGE' && (
        <Card>
          <div className="p-6">
            <h2 className="text-lg font-semibold mb-4">Delinquency by Stage</h2>
            <div className="space-y-4">
              {byDelinquencyStage.map((stage) => (
                <div key={stage.stage} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium">{stage.stage}</p>
                    <p className="text-sm text-gray-500">{stage.count} loans</p>
                  </div>
                  <p className="text-lg font-semibold">${stage.amount.toLocaleString()}</p>
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}

