'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { Alert } from '@/components/ui/Alert';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import {
  useEarlySettlementAnalytics,
  useGenerateAnalytics,
} from '@/lib/hooks/useEarlySettlement';
import {
  BarChart3,
  TrendingUp,
  DollarSign,
  Users,
  Loader2,
  RefreshCw,
  Percent,
} from 'lucide-react';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import toast from 'react-hot-toast';

interface EarlySettlementAnalyticsDashboardProps {
  companyId?: string;
}

export function EarlySettlementAnalyticsDashboard({
  companyId,
}: EarlySettlementAnalyticsDashboardProps) {
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [selectedSegment, setSelectedSegment] = useState<'MICRO' | 'SME' | 'ENTERPRISE' | undefined>();
  const [periodStart, setPeriodStart] = useState(format(startOfMonth(subMonths(new Date(), 2)), 'yyyy-MM-dd'));
  const [periodEnd, setPeriodEnd] = useState(format(endOfMonth(new Date()), 'yyyy-MM-dd'));

  const { data: analytics, isLoading } = useEarlySettlementAnalytics(
    selectedSegment,
    periodStart,
    periodEnd,
  );
  const generateAnalytics = useGenerateAnalytics();

  const handleGenerate = async () => {
    try {
      await generateAnalytics.mutateAsync({
        periodStart,
        periodEnd,
      });
      setShowGenerateModal(false);
    } catch (error) {
      // Error handled by hook
    }
  };

  if (isLoading) {
    return (
      <Card title="Early Settlement Analytics">
        <Skeleton className="h-32 w-full" />
      </Card>
    );
  }

  const segmentLabels = {
    MICRO: 'Micro',
    SME: 'SME',
    ENTERPRISE: 'Enterprise',
  };

  return (
    <Card title="Early Settlement Analytics">
      <div className="space-y-4">
        {/* Filters */}
        <div className="flex gap-2">
          <Select
            label="Segment"
            value={selectedSegment || ''}
            onChange={(e) => setSelectedSegment(e.target.value as any || undefined)}
            className="flex-1"
          >
            <option value="">All Segments</option>
            <option value="MICRO">Micro</option>
            <option value="SME">SME</option>
            <option value="ENTERPRISE">Enterprise</option>
          </Select>
          <Button
            variant="outline"
            onClick={() => setShowGenerateModal(true)}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Generate
          </Button>
        </div>

        {/* Analytics Display */}
        {analytics && analytics.length > 0 ? (
          <div className="space-y-4">
            {analytics.map((item) => (
              <div
                key={item.id}
                className="p-4 rounded-lg border border-gray-200 bg-white"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-primary" />
                    <span className="font-semibold text-lg">
                      {segmentLabels[item.segment]}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600">
                    {format(new Date(item.periodStart), 'MMM dd')} - {format(new Date(item.periodEnd), 'MMM dd, yyyy')}
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <div className="text-xs text-gray-600 mb-1">Total Loans</div>
                    <div className="text-xl font-bold text-blue-900">{item.totalLoans}</div>
                  </div>
                  <div className="p-3 bg-green-50 rounded-lg">
                    <div className="text-xs text-gray-600 mb-1">Early Settlements</div>
                    <div className="text-xl font-bold text-green-900">{item.earlySettlements}</div>
                  </div>
                  <div className="p-3 bg-purple-50 rounded-lg">
                    <div className="text-xs text-gray-600 mb-1">Settlement Rate</div>
                    <div className="text-xl font-bold text-purple-900 flex items-center gap-1">
                      <Percent className="w-4 h-4" />
                      {item.settlementRate.toFixed(2)}%
                    </div>
                  </div>
                  <div className="p-3 bg-orange-50 rounded-lg">
                    <div className="text-xs text-gray-600 mb-1">Total Rebates</div>
                    <div className="text-xl font-bold text-orange-900">
                      ${item.totalRebateAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-gray-200">
                  <div>
                    <div className="text-xs text-gray-600 mb-1">Avg. Rebate</div>
                    <div className="font-semibold text-green-600">
                      ${item.averageRebateAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-600 mb-1">Avg. Savings</div>
                    <div className="font-semibold text-green-600">
                      ${item.averageSavings.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-600 mb-1">Avg. Months Remaining</div>
                    <div className="font-semibold">
                      {item.averageMonthsRemaining} months
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <Alert variant="info" title="No Analytics">
            Generate analytics for a period to see early settlement rates by segment.
          </Alert>
        )}

        {/* Generate Modal */}
        <Modal
          isOpen={showGenerateModal}
          onClose={() => {
            setShowGenerateModal(false);
            setPeriodStart(format(startOfMonth(subMonths(new Date(), 2)), 'yyyy-MM-dd'));
            setPeriodEnd(format(endOfMonth(new Date()), 'yyyy-MM-dd'));
          }}
          title="Generate Analytics"
          size="md"
          footer={
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  setShowGenerateModal(false);
                  setPeriodStart(format(startOfMonth(subMonths(new Date(), 2)), 'yyyy-MM-dd'));
                  setPeriodEnd(format(endOfMonth(new Date()), 'yyyy-MM-dd'));
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleGenerate}
                disabled={!periodStart || !periodEnd || generateAnalytics.isPending}
              >
                {generateAnalytics.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <BarChart3 className="w-4 h-4 mr-2" />
                    Generate
                  </>
                )}
              </Button>
            </div>
          }
        >
          <div className="space-y-4">
            <Alert variant="info">
              Generate analytics for a period to track early settlement rates by customer segment.
            </Alert>

            <Input
              label="Period Start"
              type="date"
              value={periodStart}
              onChange={(e) => setPeriodStart(e.target.value)}
              required
            />

            <Input
              label="Period End"
              type="date"
              value={periodEnd}
              onChange={(e) => setPeriodEnd(e.target.value)}
              required
            />

            <div className="text-sm text-gray-600">
              <p>Analytics will be generated for all segments (MICRO, SME, ENTERPRISE).</p>
            </div>
          </div>
        </Modal>
      </div>
    </Card>
  );
}

