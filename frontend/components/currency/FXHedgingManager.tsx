'use client';

import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { currencyApi, HedgingPosition } from '@/lib/api/currency';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Skeleton } from '@/components/ui/Skeleton';
import {
  Shield,
  Plus,
  TrendingUp,
  TrendingDown,
  Calendar,
  DollarSign,
  AlertCircle,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

interface FXHedgingManagerProps {
  loanId?: string;
}

export function FXHedgingManager({ loanId }: FXHedgingManagerProps) {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    loanId: loanId || '',
    strategy: 'FORWARD_CONTRACT',
    hedgeAmount: '',
    hedgeCurrency: '',
    maturityDate: '',
    targetRate: '',
  });

  // Get active hedging positions
  const { data: positions, isLoading, refetch } = useQuery({
    queryKey: ['hedgingPositions'],
    queryFn: () => currencyApi.getActiveHedgingPositions(),
  });

  // Get FX exposure for loan (if loanId provided)
  const { data: exposure } = useQuery({
    queryKey: ['fxExposure', loanId],
    queryFn: () => currencyApi.getFXExposure(loanId!),
    enabled: !!loanId,
  });

  // Get hedging recommendations (if loanId provided)
  const { data: recommendations } = useQuery({
    queryKey: ['hedgingRecommendations', loanId],
    queryFn: () => currencyApi.getHedgingRecommendations(loanId!),
    enabled: !!loanId,
  });

  // Create hedging position mutation
  const createMutation = useMutation({
    mutationFn: (data: any) => currencyApi.createHedgingPosition(data),
    onSuccess: () => {
      toast.success('Hedging position created successfully');
      setIsCreateModalOpen(false);
      setFormData({
        loanId: loanId || '',
        strategy: 'FORWARD_CONTRACT',
        hedgeAmount: '',
        hedgeCurrency: '',
        maturityDate: '',
        targetRate: '',
      });
      refetch();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create hedging position');
    },
  });

  // Mark to market mutation
  const markToMarketMutation = useMutation({
    mutationFn: (positionId: string) => currencyApi.markToMarket(positionId),
    onSuccess: () => {
      toast.success('Position marked to market');
      refetch();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to mark to market');
    },
  });

  // Execute position mutation
  const executeMutation = useMutation({
    mutationFn: (positionId: string) => currencyApi.executeHedgingPosition(positionId),
    onSuccess: () => {
      toast.success('Hedging position executed');
      refetch();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to execute position');
    },
  });

  const handleCreate = () => {
    if (!formData.loanId || !formData.hedgeAmount || !formData.hedgeCurrency || !formData.maturityDate) {
      toast.error('Please fill in all required fields');
      return;
    }

    createMutation.mutate({
      ...formData,
      hedgeAmount: parseFloat(formData.hedgeAmount),
      targetRate: formData.targetRate ? parseFloat(formData.targetRate) : undefined,
    });
  };

  const formatCurrency = (amount: number, currencyCode: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currencyCode,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Shield className="w-6 h-6" />
            FX Hedging Management
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Manage foreign exchange hedging positions
          </p>
        </div>
        <Button onClick={() => setIsCreateModalOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Create Hedging Position
        </Button>
      </div>

      {/* Recommendations (if loanId provided) */}
      {recommendations && (
        <Card className="p-4 border-l-4 border-blue-500">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-blue-500 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                Hedging Recommendation
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                {recommendations.reason}
              </p>
              {recommendations.recommended && (
                <div className="flex items-center gap-4 text-sm">
                  <span className="text-gray-600 dark:text-gray-400">
                    Strategy: <strong>{recommendations.strategy}</strong>
                  </span>
                  <span className="text-gray-600 dark:text-gray-400">
                    Hedge: <strong>{recommendations.hedgePercentage}%</strong>
                  </span>
                </div>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* FX Exposure (if loanId provided) */}
      {exposure && (
        <Card className="p-4">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
            Current FX Exposure
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Exposure</p>
              <p className="font-semibold text-gray-900 dark:text-white">
                {formatCurrency(exposure.exposureBaseCurrency)}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Current Rate</p>
              <p className="font-semibold text-gray-900 dark:text-white">
                {exposure.currentRate.toFixed(4)}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Risk Level</p>
              <Badge
                className={
                  exposure.riskLevel === 'HIGH'
                    ? 'bg-red-100 text-red-800'
                    : exposure.riskLevel === 'MEDIUM'
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-green-100 text-green-800'
                }
              >
                {exposure.riskLevel}
              </Badge>
            </div>
          </div>
        </Card>
      )}

      {/* Active Positions */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Active Hedging Positions
        </h3>
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-32 w-full" />
            ))}
          </div>
        ) : positions && positions.length > 0 ? (
          <div className="space-y-4">
            {positions.map((position) => (
              <div
                key={position.id}
                className="border border-gray-200 dark:border-gray-700 rounded-lg p-4"
              >
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white">
                      {position.strategy.replace(/_/g, ' ')}
                    </h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Loan: {position.loanId.substring(0, 8)}...
                    </p>
                  </div>
                  <Badge
                    className={
                      position.status === 'ACTIVE'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }
                  >
                    {position.status}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Hedge Amount</p>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {formatCurrency(position.hedgeAmount, position.hedgeCurrency)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Target Rate</p>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {position.targetRate.toFixed(4)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Current Rate</p>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {position.currentRate.toFixed(4)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Maturity Date</p>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {format(new Date(position.maturityDate), 'MMM d, yyyy')}
                    </p>
                  </div>
                </div>

                {position.unrealizedPnL !== null && (
                  <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-2">
                      {position.unrealizedPnL >= 0 ? (
                        <TrendingUp className="w-4 h-4 text-green-500" />
                      ) : (
                        <TrendingDown className="w-4 h-4 text-red-500" />
                      )}
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                        Unrealized P&L:
                      </span>
                      <span
                        className={`text-sm font-semibold ${
                          position.unrealizedPnL >= 0
                            ? 'text-green-600 dark:text-green-400'
                            : 'text-red-600 dark:text-red-400'
                        }`}
                      >
                        {formatCurrency(position.unrealizedPnL)}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => markToMarketMutation.mutate(position.id)}
                        disabled={markToMarketMutation.isPending}
                      >
                        Mark to Market
                      </Button>
                      {new Date(position.maturityDate) <= new Date() && (
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => executeMutation.mutate(position.id)}
                          disabled={executeMutation.isPending}
                        >
                          Execute
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <Shield className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">No active hedging positions</p>
          </div>
        )}
      </Card>

      {/* Create Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create Hedging Position"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Loan ID
            </label>
            <Input
              value={formData.loanId}
              onChange={(e) => setFormData({ ...formData, loanId: e.target.value })}
              placeholder="Enter loan ID"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Strategy
            </label>
            <Select
              value={formData.strategy}
              onValueChange={(value) => setFormData({ ...formData, strategy: value })}
            >
              <option value="FORWARD_CONTRACT">Forward Contract</option>
              <option value="OPTIONS">Options</option>
              <option value="NATURAL_HEDGE">Natural Hedge</option>
              <option value="NO_HEDGE">No Hedge</option>
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Hedge Amount
            </label>
            <Input
              type="number"
              value={formData.hedgeAmount}
              onChange={(e) => setFormData({ ...formData, hedgeAmount: e.target.value })}
              placeholder="Enter hedge amount"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Hedge Currency
            </label>
            <Input
              value={formData.hedgeCurrency}
              onChange={(e) => setFormData({ ...formData, hedgeCurrency: e.target.value.toUpperCase() })}
              placeholder="EUR, GBP, etc."
              maxLength={3}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Maturity Date
            </label>
            <Input
              type="date"
              value={formData.maturityDate}
              onChange={(e) => setFormData({ ...formData, maturityDate: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Target Rate (Optional)
            </label>
            <Input
              type="number"
              step="0.0001"
              value={formData.targetRate}
              onChange={(e) => setFormData({ ...formData, targetRate: e.target.value })}
              placeholder="Enter target exchange rate"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={() => setIsCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={createMutation.isPending}>
              {createMutation.isPending ? 'Creating...' : 'Create Position'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

