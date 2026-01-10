'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { currencyApi, PortfolioByCurrency, FXExposureReport } from '@/lib/api/currency';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Globe,
  RefreshCw,
  BarChart3,
  Shield,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

interface MultiCurrencyDashboardProps {
  companyId?: string;
}

export function MultiCurrencyDashboard({ companyId }: MultiCurrencyDashboardProps) {
  const [selectedTab, setSelectedTab] = useState<'portfolio' | 'exposure' | 'rates'>('portfolio');

  // Get portfolio by currency
  const { data: portfolio, isLoading: portfolioLoading, refetch: refetchPortfolio } = useQuery({
    queryKey: ['portfolioByCurrency', companyId],
    queryFn: () => currencyApi.getPortfolioByCurrency(companyId),
    enabled: selectedTab === 'portfolio',
  });

  // Get FX exposure
  const { data: exposure, isLoading: exposureLoading, refetch: refetchExposure } = useQuery({
    queryKey: ['fxExposure', companyId],
    queryFn: () => currencyApi.getFXExposureReport(companyId),
    enabled: selectedTab === 'exposure',
  });

  // Update exchange rates
  const handleUpdateRates = async () => {
    try {
      const result = await currencyApi.updateExchangeRates();
      toast.success(`Updated ${result.updated} exchange rates`);
      refetchPortfolio();
      refetchExposure();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update exchange rates');
    }
  };

  const formatCurrency = (amount: number, currencyCode: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currencyCode,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'HIGH':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'MEDIUM':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'LOW':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Globe className="w-6 h-6" />
            Multi-Currency Dashboard
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Manage currencies, exchange rates, and FX exposure
          </p>
        </div>
        <Button onClick={handleUpdateRates} variant="outline" size="sm">
          <RefreshCw className="w-4 h-4 mr-2" />
          Update Rates
        </Button>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex -mb-px">
          {[
            { id: 'portfolio', label: 'Portfolio by Currency', icon: BarChart3 },
            { id: 'exposure', label: 'FX Exposure', icon: Shield },
            { id: 'rates', label: 'Exchange Rates', icon: TrendingUp },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setSelectedTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2 border-b-2 font-medium text-sm ${
                  selectedTab === tab.id
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Portfolio Tab */}
      {selectedTab === 'portfolio' && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Portfolio by Currency
          </h3>
          {portfolioLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-24 w-full" />
              ))}
            </div>
          ) : portfolio && portfolio.length > 0 ? (
            <div className="space-y-4">
              {portfolio.map((item) => (
                <div
                  key={item.currency.id}
                  className="border border-gray-200 dark:border-gray-700 rounded-lg p-4"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                        <DollarSign className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900 dark:text-white">
                          {item.currency.name} ({item.currency.code})
                        </h4>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {item.totalLoans} loans
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline">{item.currency.code}</Badge>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                        Total Loan Amount
                      </p>
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {formatCurrency(item.totalLoanAmount, item.currency.code)}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {formatCurrency(item.totalLoanAmountBaseCurrency)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                        Total Disbursed
                      </p>
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {formatCurrency(item.totalDisbursed, item.currency.code)}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {formatCurrency(item.totalDisbursedBaseCurrency)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                        Total Repaid
                      </p>
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {formatCurrency(item.totalRepaid, item.currency.code)}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {formatCurrency(item.totalRepaidBaseCurrency)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                        Outstanding
                      </p>
                      <p className="font-semibold text-orange-600 dark:text-orange-400">
                        {formatCurrency(item.outstandingAmount, item.currency.code)}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {formatCurrency(item.outstandingAmountBaseCurrency)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Globe className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">No portfolio data available</p>
            </div>
          )}
        </Card>
      )}

      {/* FX Exposure Tab */}
      {selectedTab === 'exposure' && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            FX Exposure Report
          </h3>
          {exposureLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-24 w-full" />
              ))}
            </div>
          ) : exposure && exposure.length > 0 ? (
            <div className="space-y-4">
              {exposure.map((item) => (
                <div
                  key={item.currency.id}
                  className="border border-gray-200 dark:border-gray-700 rounded-lg p-4"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center">
                        <Shield className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900 dark:text-white">
                          {item.currency.name} ({item.currency.code})
                        </h4>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Current Rate: {item.currentRate.toFixed(4)}
                        </p>
                      </div>
                    </div>
                    <Badge className={getRiskColor(item.riskLevel)}>{item.riskLevel}</Badge>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                        Total Exposure
                      </p>
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {formatCurrency(item.exposure, item.currency.code)}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {formatCurrency(item.exposureBaseCurrency)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                        Hedged Amount
                      </p>
                      <p className="font-semibold text-green-600 dark:text-green-400">
                        {formatCurrency(item.hedgedAmount, item.currency.code)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                        Unhedged Amount
                      </p>
                      <p className="font-semibold text-orange-600 dark:text-orange-400">
                        {formatCurrency(item.unhedgedAmount, item.currency.code)}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {formatCurrency(item.unhedgedAmountBaseCurrency)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                        Hedging Coverage
                      </p>
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {item.exposure > 0
                          ? ((item.hedgedAmount / item.exposure) * 100).toFixed(1)
                          : 0}
                        %
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Shield className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">No FX exposure data available</p>
            </div>
          )}
        </Card>
      )}

      {/* Exchange Rates Tab */}
      {selectedTab === 'rates' && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Exchange Rates
          </h3>
          <div className="text-center py-8">
            <TrendingUp className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">
              Exchange rate history and charts coming soon
            </p>
          </div>
        </Card>
      )}
    </div>
  );
}

