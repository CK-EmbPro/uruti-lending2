'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { Alert } from '@/components/ui/Alert';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import {
  useDailyCalculations,
  useCalculateDailyPayoffsRange,
  useRebateFormula,
} from '@/lib/hooks/useEarlySettlement';
import {
  Calendar,
  TrendingDown,
  DollarSign,
  Loader2,
  RefreshCw,
  Info,
  BarChart3,
} from 'lucide-react';
import { format, subDays, addDays } from 'date-fns';
import toast from 'react-hot-toast';

interface EarlySettlementDailyCalculationSectionProps {
  loanId: string;
}

export function EarlySettlementDailyCalculationSection({
  loanId,
}: EarlySettlementDailyCalculationSectionProps) {
  const [showCalculateModal, setShowCalculateModal] = useState(false);
  const [startDate, setStartDate] = useState(format(subDays(new Date(), 7), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));

  const { data: dailyCalculations, isLoading } = useDailyCalculations(
    loanId,
    startDate,
    endDate,
  );
  const { data: rebateFormula } = useRebateFormula();
  const calculateRange = useCalculateDailyPayoffsRange();

  const handleCalculateRange = async () => {
    try {
      await calculateRange.mutateAsync({
        loanId,
        startDate,
        endDate,
      });
      setShowCalculateModal(false);
    } catch (error) {
      // Error handled by hook
    }
  };

  if (isLoading) {
    return (
      <Card title="Daily Payoff Calculation">
        <Skeleton className="h-32 w-full" />
      </Card>
    );
  }

  return (
    <Card title="Daily Payoff Calculation">
      <div className="space-y-4">
        {/* Info Alert */}
        <Alert variant="info" title="Daily Calculation">
          <div className="text-sm">
            <p>Payoff amounts are calculated daily with interest rebates.</p>
            <p className="text-xs text-gray-600 mt-1">
              The amount decreases daily as you save on interest. Calculate for a date range to see the trend.
            </p>
          </div>
        </Alert>

        {/* Rebate Formula Info */}
        {rebateFormula && (
          <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center gap-2 mb-2">
              <Info className="w-4 h-4 text-blue-600" />
              <span className="font-semibold text-sm text-blue-900">Rebate Formula</span>
            </div>
            <div className="text-xs text-blue-800 space-y-1">
              {rebateFormula.tiers.map((tier, index) => (
                <div key={index}>
                  {tier.monthsRemaining} months remaining: {tier.rebatePercentage}% rebate
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Calculate Range Button */}
        <Button
          variant="outline"
          onClick={() => setShowCalculateModal(true)}
          className="w-full"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Calculate Daily Payoffs
        </Button>

        {/* Daily Calculations Display */}
        {dailyCalculations && dailyCalculations.length > 0 ? (
          <div className="space-y-3">
            <div className="text-sm font-semibold text-gray-900">
              Daily Payoff Trend ({dailyCalculations.length} days)
            </div>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {dailyCalculations.map((calc, index) => (
                <div
                  key={index}
                  className="p-3 rounded-lg border border-gray-200 bg-white"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span className="font-medium text-sm">
                        {format(new Date(calc.date), 'MMM dd, yyyy')}
                      </span>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-primary">
                        ${calc.totalPayoffAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                      {calc.dailyChange < 0 && (
                        <div className="text-xs text-green-600 flex items-center gap-1">
                          <TrendingDown className="w-3 h-3" />
                          ${Math.abs(calc.dailyChange).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} less
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                    <div>
                      <span className="font-medium">Rebate:</span>{' '}
                      <span className="text-green-600">
                        ${calc.interestRebate.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ({calc.rebatePercentage}%)
                      </span>
                    </div>
                    <div>
                      <span className="font-medium">Months Remaining:</span> {calc.monthsRemaining}
                    </div>
                    <div>
                      <span className="font-medium">Savings:</span>{' '}
                      <span className="text-green-600 font-semibold">
                        ${calc.savingsAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div>
                      <span className="font-medium">Original:</span>{' '}
                      ${calc.originalPayoffAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <Alert variant="info" title="No Calculations">
            Calculate daily payoffs for a date range to see how the amount changes daily.
          </Alert>
        )}

        {/* Calculate Modal */}
        <Modal
          isOpen={showCalculateModal}
          onClose={() => {
            setShowCalculateModal(false);
            setStartDate(format(subDays(new Date(), 7), 'yyyy-MM-dd'));
            setEndDate(format(new Date(), 'yyyy-MM-dd'));
          }}
          title="Calculate Daily Payoffs"
          size="md"
          footer={
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  setShowCalculateModal(false);
                  setStartDate(format(subDays(new Date(), 7), 'yyyy-MM-dd'));
                  setEndDate(format(new Date(), 'yyyy-MM-dd'));
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleCalculateRange}
                disabled={!startDate || !endDate || calculateRange.isPending}
              >
                {calculateRange.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Calculating...
                  </>
                ) : (
                  <>
                    <BarChart3 className="w-4 h-4 mr-2" />
                    Calculate
                  </>
                )}
              </Button>
            </div>
          }
        >
          <div className="space-y-4">
            <Alert variant="info">
              Calculate daily payoff amounts for a date range. The amount will decrease daily as you save on interest.
            </Alert>

            <Input
              label="Start Date"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              required
            />

            <Input
              label="End Date"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              required
            />

            <div className="text-sm text-gray-600">
              <p>This will calculate payoff amounts for each day in the range.</p>
              <p className="text-xs text-gray-500 mt-1">
                Maximum recommended range: 30 days
              </p>
            </div>
          </div>
        </Modal>
      </div>
    </Card>
  );
}

