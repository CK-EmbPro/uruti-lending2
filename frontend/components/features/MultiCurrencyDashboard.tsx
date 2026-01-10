'use client';

import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import {
  currencyApi,
  Currency,
  ExchangeRate,
  FXTransaction,
  FXExposure,
  CurrencyConversionResult,
} from '@/lib/api/currency';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Plus,
  Calculator,
  AlertTriangle,
  Globe,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

interface MultiCurrencyDashboardProps {
  companyId?: string;
}

export function MultiCurrencyDashboard({ companyId }: MultiCurrencyDashboardProps) {
  const [selectedTab, setSelectedTab] = useState<'overview' | 'currencies' | 'rates' | 'converter' | 'exposures'>('overview');
  const [fromCurrencyId, setFromCurrencyId] = useState<string>('');
  const [toCurrencyId, setToCurrencyId] = useState<string>('');
  const [conversionAmount, setConversionAmount] = useState<number | ''>('');

  // Get currencies
  const { data: currencies, isLoading: currenciesLoading } = useQuery({
    queryKey: ['currencies'],
    queryFn: () => currencyApi.getAllCurrencies(),
  });

  // Get base currency
  const { data: baseCurrency, isLoading: baseCurrencyLoading } = useQuery({
    queryKey: ['baseCurrency'],
    queryFn: () => currencyApi.getBaseCurrency(),
  });

  // Get exchange rates
  const { data: exchangeRates, isLoading: ratesLoading } = useQuery({
    queryKey: ['exchangeRates'],
    queryFn: () => currencyApi.getExchangeRates(),
    enabled: selectedTab === 'rates' || selectedTab === 'converter',
  });

  // Currency conversion
  const convertMutation = useMutation({
    mutationFn: (data: {
      fromCurrencyId: string;
      toCurrencyId: string;
      amount: number;
    }) => currencyApi.convertCurrency(data),
    onSuccess: (result) => {
      toast.success(`Converted: ${result.fromAmount} ${result.fromCurrency.code} = ${result.toAmount} ${result.toCurrency.code}`);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Conversion failed');
    },
  });

  const handleConvert = () => {
    if (!fromCurrencyId || !toCurrencyId || !conversionAmount) {
      toast.error('Please select currencies and enter amount');
      return;
    }
    convertMutation.mutate({
      fromCurrencyId,
      toCurrencyId,
      amount: Number(conversionAmount),
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Globe className="w-6 h-6" />
            Multi-Currency Management
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Currency management, exchange rates, and FX risk tracking
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex -mb-px">
          {[
            { id: 'overview', label: 'Overview', icon: DollarSign },
            { id: 'currencies', label: 'Currencies', icon: Globe },
            { id: 'rates', label: 'Exchange Rates', icon: TrendingUp },
            { id: 'converter', label: 'Converter', icon: Calculator },
            { id: 'exposures', label: 'FX Exposures', icon: AlertTriangle },
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

      {/* Overview Tab */}
      {selectedTab === 'overview' && (
        <>
          {baseCurrencyLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="p-6">
                  <Skeleton className="h-8 w-32 mb-2" />
                  <Skeleton className="h-4 w-20" />
                </Card>
              ))}
            </div>
          ) : baseCurrency ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="p-6 border-l-4 border-blue-500">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Base Currency</p>
                  <Globe className="w-5 h-5 text-blue-500" />
                </div>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  {baseCurrency.code}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {baseCurrency.name}
                </p>
              </Card>

              <Card className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Currencies</p>
                  <DollarSign className="w-5 h-5 text-gray-400" />
                </div>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  {currencies?.filter((c) => c.status === 'ACTIVE').length || 0}
                </p>
              </Card>

              <Card className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Exchange Rates</p>
                  <TrendingUp className="w-5 h-5 text-gray-400" />
                </div>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  {exchangeRates?.length || 0}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Active rates configured
                </p>
              </Card>
            </div>
          ) : null}
        </>
      )}

      {/* Currencies Tab */}
      {selectedTab === 'currencies' && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Currencies</h3>
          </div>

          {currenciesLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          ) : currencies && currencies.length > 0 ? (
            <div className="space-y-4">
              {currencies.map((currency) => (
                <div
                  key={currency.id}
                  className="border border-gray-200 dark:border-gray-700 rounded-lg p-4"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-lg font-semibold text-gray-900 dark:text-white">
                            {currency.code}
                          </span>
                          {currency.isBaseCurrency && (
                            <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                              Base
                            </Badge>
                          )}
                          <Badge
                            className={
                              currency.status === 'ACTIVE'
                                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                            }
                          >
                            {currency.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {currency.name} {currency.symbol && `(${currency.symbol})`}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      {currency.exchangeRate && (
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          1 {currency.code} = {currency.exchangeRate.toFixed(4)} {baseCurrency?.code || 'BASE'}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Globe className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">No currencies found</p>
            </div>
          )}
        </Card>
      )}

      {/* Exchange Rates Tab */}
      {selectedTab === 'rates' && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Exchange Rates</h3>
          {ratesLoading ? (
            <Skeleton className="h-64 w-full" />
          ) : exchangeRates && exchangeRates.length > 0 ? (
            <div className="space-y-4">
              {exchangeRates.slice(0, 10).map((rate) => (
                <div
                  key={rate.id}
                  className="border border-gray-200 dark:border-gray-700 rounded-lg p-4"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        1 {rate.fromCurrency.code} = {rate.rate.toFixed(6)} {rate.toCurrency.code}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {format(new Date(rate.rateDate), 'MMM d, yyyy')} • {rate.source}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-600 dark:text-gray-400">No exchange rates found</p>
          )}
        </Card>
      )}

      {/* Converter Tab */}
      {selectedTab === 'converter' && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Currency Converter</h3>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  From Currency
                </label>
                <Select
                  value={fromCurrencyId}
                  onChange={(e) => setFromCurrencyId(e.target.value)}
                >
                  <option value="">Select currency</option>
                  {currencies?.map((currency) => (
                    <option key={currency.id} value={currency.id}>
                      {currency.code} - {currency.name}
                    </option>
                  ))}
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Amount
                </label>
                <Input
                  type="number"
                  value={conversionAmount}
                  onChange={(e) => setConversionAmount(e.target.value ? Number(e.target.value) : '')}
                  placeholder="Enter amount"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  To Currency
                </label>
                <Select
                  value={toCurrencyId}
                  onChange={(e) => setToCurrencyId(e.target.value)}
                >
                  <option value="">Select currency</option>
                  {currencies?.map((currency) => (
                    <option key={currency.id} value={currency.id}>
                      {currency.code} - {currency.name}
                    </option>
                  ))}
                </Select>
              </div>
            </div>

            <Button
              onClick={handleConvert}
              disabled={convertMutation.isPending || !fromCurrencyId || !toCurrencyId || !conversionAmount}
              className="w-full"
            >
              <Calculator className="w-4 h-4 mr-2" />
              {convertMutation.isPending ? 'Converting...' : 'Convert'}
            </Button>

            {convertMutation.data && (
              <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Conversion Result</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {convertMutation.data.fromAmount} {convertMutation.data.fromCurrency.code} ={' '}
                  {convertMutation.data.toAmount} {convertMutation.data.toCurrency.code}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  Rate: 1 {convertMutation.data.fromCurrency.code} = {convertMutation.data.exchangeRate.toFixed(6)}{' '}
                  {convertMutation.data.toCurrency.code} (as of {format(new Date(convertMutation.data.rateDate), 'MMM d, yyyy')})
                </p>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* FX Exposures Tab */}
      {selectedTab === 'exposures' && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">FX Exposures</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Foreign exchange exposure tracking and risk management
          </p>
        </Card>
      )}
    </div>
  );
}

