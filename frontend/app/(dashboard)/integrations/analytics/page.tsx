'use client';

import { useEffect, useState } from 'react';
import { integrationAdminApi, IntegrationAnalytics } from '@/lib/api/integration-admin';
import toast from 'react-hot-toast';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Activity,
  CheckCircle,
  XCircle,
  Clock,
  DollarSign,
  FileText,
  Webhook,
} from 'lucide-react';
import { format } from 'date-fns';

export default function IntegrationAnalyticsPage() {
  const [analytics, setAnalytics] = useState<IntegrationAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [days, setDays] = useState(30);
  const [platformId, setPlatformId] = useState<string | undefined>();

  useEffect(() => {
    loadAnalytics();
  }, [days, platformId]);

  const loadAnalytics = async () => {
    try {
      setIsLoading(true);
      const data = await integrationAdminApi.getIntegrationAnalytics(platformId, days);
      setAnalytics(data);
    } catch (error: any) {
      toast.error('Failed to load analytics');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return null;
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Integration Analytics</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Monitor integration performance and metrics</p>
        </div>
        <div className="flex items-center gap-4">
          <select
            value={days}
            onChange={(e) => setDays(parseInt(e.target.value))}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
          >
            <option value={7}>Last 7 days</option>
            <option value={30}>Last 30 days</option>
            <option value={90}>Last 90 days</option>
            <option value={365}>Last year</option>
          </select>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Platforms</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{analytics.totalPlatforms}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {analytics.activePlatforms} active
              </p>
            </div>
            <Activity className="w-10 h-10 text-blue-600" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Webhook Success Rate</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {analytics.webhookSuccessRate.toFixed(1)}%
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {analytics.successfulWebhooks} / {analytics.totalWebhooks} successful
              </p>
            </div>
            {analytics.webhookSuccessRate >= 95 ? (
              <CheckCircle className="w-10 h-10 text-green-600" />
            ) : (
              <XCircle className="w-10 h-10 text-red-600" />
            )}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Applications</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{analytics.totalApplications}</p>
            </div>
            <FileText className="w-10 h-10 text-purple-600" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Repayments</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(analytics.totalRepaymentAmount)}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {analytics.totalRepayments} transactions
              </p>
            </div>
            <DollarSign className="w-10 h-10 text-green-600" />
          </div>
        </div>
      </div>

      {/* Webhook Deliveries Chart */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Webhook Deliveries Over Time</h2>
        <div className="h-64 flex items-end gap-2">
          {analytics.webhookDeliveriesByDay.map((day, index) => {
            const maxValue = Math.max(
              ...analytics.webhookDeliveriesByDay.map((d) => d.success + d.failed),
              1,
            );
            const successHeight = (day.success / maxValue) * 100;
            const failedHeight = (day.failed / maxValue) * 100;

            return (
              <div key={index} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full flex flex-col-reverse gap-1" style={{ height: '200px' }}>
                  <div
                    className="w-full bg-green-500 rounded-t"
                    style={{ height: `${successHeight}%` }}
                    title={`Success: ${day.success}`}
                  />
                  <div
                    className="w-full bg-red-500 rounded-t"
                    style={{ height: `${failedHeight}%` }}
                    title={`Failed: ${day.failed}`}
                  />
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-2 transform -rotate-45 origin-left">
                  {format(new Date(day.date), 'MMM d')}
                </p>
              </div>
            );
          })}
        </div>
        <div className="flex items-center gap-4 mt-4">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-500 rounded"></div>
            <span className="text-sm text-gray-600 dark:text-gray-400">Successful</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-500 rounded"></div>
            <span className="text-sm text-gray-600 dark:text-gray-400">Failed</span>
          </div>
        </div>
      </div>

      {/* Top Events */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Top Webhook Events</h2>
        <div className="space-y-3">
          {analytics.topEvents.map((event, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                  <span className="text-sm font-semibold text-blue-600 dark:text-blue-300">{index + 1}</span>
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">{event.eventType}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-32 bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full"
                    style={{
                      width: `${(event.count / Math.max(...analytics.topEvents.map((e) => e.count))) * 100}%`,
                    }}
                  />
                </div>
                <span className="text-sm font-semibold text-gray-900 dark:text-white w-12 text-right">
                  {event.count}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

