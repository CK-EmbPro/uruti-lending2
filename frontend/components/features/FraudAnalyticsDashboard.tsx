'use client';

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fraudDetectionApi, FraudAnalytics, RiskLevel } from '@/lib/api/fraud-detection';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { Badge } from '@/components/ui/Badge';
import {
  AlertTriangle,
  Shield,
  TrendingUp,
  TrendingDown,
  Activity,
  BarChart3,
  Download,
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface FraudAnalyticsDashboardProps {
  companyId?: string;
}

const COLORS = {
  [RiskLevel.CRITICAL]: '#DC2626',
  [RiskLevel.HIGH]: '#F59E0B',
  [RiskLevel.MEDIUM]: '#FBBF24',
  [RiskLevel.LOW]: '#10B981',
};

export function FraudAnalyticsDashboard({ companyId }: FraudAnalyticsDashboardProps) {
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d');

  const getDateFilters = () => {
    const now = new Date();
    const filters: { fromDate?: string; toDate?: string; companyId?: string } = {
      companyId,
    };

    switch (dateRange) {
      case '7d':
        const weekAgo = new Date(now);
        weekAgo.setDate(weekAgo.getDate() - 7);
        filters.fromDate = weekAgo.toISOString().split('T')[0];
        break;
      case '30d':
        const monthAgo = new Date(now);
        monthAgo.setDate(monthAgo.getDate() - 30);
        filters.fromDate = monthAgo.toISOString().split('T')[0];
        break;
      case '90d':
        const quarterAgo = new Date(now);
        quarterAgo.setDate(quarterAgo.getDate() - 90);
        filters.fromDate = quarterAgo.toISOString().split('T')[0];
        break;
      case '1y':
        const yearAgo = new Date(now);
        yearAgo.setFullYear(yearAgo.getFullYear() - 1);
        filters.fromDate = yearAgo.toISOString().split('T')[0];
        break;
    }

    return filters;
  };

  const { data: analytics, isLoading, refetch } = useQuery<FraudAnalytics>({
    queryKey: ['fraudAnalytics', dateRange, companyId],
    queryFn: () => fraudDetectionApi.getFraudAnalytics(getDateFilters()),
  });

  const pieData = analytics
    ? [
        { name: 'Critical', value: analytics.critical, color: COLORS[RiskLevel.CRITICAL] },
        { name: 'High', value: analytics.high, color: COLORS[RiskLevel.HIGH] },
        { name: 'Medium', value: analytics.medium, color: COLORS[RiskLevel.MEDIUM] },
        { name: 'Low', value: analytics.low, color: COLORS[RiskLevel.LOW] },
      ].filter((item) => item.value > 0)
    : [];

  const barData = analytics
    ? [
        { name: 'Critical', value: analytics.critical, color: COLORS[RiskLevel.CRITICAL] },
        { name: 'High', value: analytics.high, color: COLORS[RiskLevel.HIGH] },
        { name: 'Medium', value: analytics.medium, color: COLORS[RiskLevel.MEDIUM] },
        { name: 'Low', value: analytics.low, color: COLORS[RiskLevel.LOW] },
      ]
    : [];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="p-6">
              <Skeleton className="h-8 w-32 mb-2" />
              <Skeleton className="h-4 w-20" />
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <Card className="p-8 text-center">
        <AlertTriangle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600 dark:text-gray-400">No fraud analytics data available</p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Shield className="w-6 h-6" />
            Fraud Detection Analytics
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Real-time fraud risk analysis and detection metrics
          </p>
        </div>
        <div className="flex items-center gap-2">
          {(['7d', '30d', '90d', '1y'] as const).map((range) => (
            <Button
              key={range}
              variant={dateRange === range ? 'default' : 'outline'}
              size="sm"
              onClick={() => setDateRange(range)}
            >
              {range === '7d' ? '7 Days' : range === '30d' ? '30 Days' : range === '90d' ? '90 Days' : '1 Year'}
            </Button>
          ))}
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <Activity className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Scored</p>
            <BarChart3 className="w-5 h-5 text-gray-400" />
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">{analytics.total}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Applications analyzed</p>
        </Card>

        <Card className="p-6 border-l-4 border-red-500">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Critical Risk</p>
            <AlertTriangle className="w-5 h-5 text-red-500" />
          </div>
          <p className="text-3xl font-bold text-red-600 dark:text-red-400">{analytics.critical}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {analytics.total > 0 ? ((analytics.critical / analytics.total) * 100).toFixed(1) : 0}% of total
          </p>
        </Card>

        <Card className="p-6 border-l-4 border-orange-500">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">High Risk</p>
            <TrendingUp className="w-5 h-5 text-orange-500" />
          </div>
          <p className="text-3xl font-bold text-orange-600 dark:text-orange-400">{analytics.high}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {analytics.total > 0 ? ((analytics.high / analytics.total) * 100).toFixed(1) : 0}% of total
          </p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Average Score</p>
            <Activity className="w-5 h-5 text-gray-400" />
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">
            {analytics.averageScore.toFixed(1)}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Out of 100</p>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Risk Distribution Pie Chart */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Risk Level Distribution
          </h3>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-300 flex items-center justify-center text-gray-500">
              No data available
            </div>
          )}
        </Card>

        {/* Risk Level Bar Chart */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Risk Level Breakdown
          </h3>
          {barData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={barData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="value" fill="#8884d8">
                  {barData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-300 flex items-center justify-center text-gray-500">
              No data available
            </div>
          )}
        </Card>
      </div>

      {/* Risk Distribution Table */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Detailed Risk Distribution
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">
                  Risk Level
                </th>
                <th className="text-right py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">
                  Count
                </th>
                <th className="text-right py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">
                  Percentage
                </th>
                <th className="text-right py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">
                  Distribution
                </th>
              </tr>
            </thead>
            <tbody>
              {[
                { level: 'Critical', count: analytics.critical, color: COLORS[RiskLevel.CRITICAL] },
                { level: 'High', count: analytics.high, color: COLORS[RiskLevel.HIGH] },
                { level: 'Medium', count: analytics.medium, color: COLORS[RiskLevel.MEDIUM] },
                { level: 'Low', count: analytics.low, color: COLORS[RiskLevel.LOW] },
              ].map((item) => {
                const percentage = analytics.total > 0 ? (item.count / analytics.total) * 100 : 0;
                return (
                  <tr key={item.level} className="border-b border-gray-100 dark:border-gray-800">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: item.color }}
                        />
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {item.level}
                        </span>
                      </div>
                    </td>
                    <td className="text-right py-3 px-4 text-sm text-gray-900 dark:text-white">
                      {item.count}
                    </td>
                    <td className="text-right py-3 px-4 text-sm text-gray-600 dark:text-gray-400">
                      {percentage.toFixed(1)}%
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-end gap-2">
                        <div className="w-32 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${percentage}%`,
                              backgroundColor: item.color,
                            }}
                          />
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

