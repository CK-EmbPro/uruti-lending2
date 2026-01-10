'use client';

import { useState } from 'react';
import { loanCalculatorApi, CostComparisonRequest, CostComparisonResponse } from '@/lib/api/loan-calculator';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import toast from 'react-hot-toast';
import { TrendingUp, TrendingDown, DollarSign, Calendar, BarChart3 } from 'lucide-react';

interface RepaymentStructureComparisonProps {
  initialLoanAmount?: number;
  initialInterestRate?: number;
  initialTenureMonths?: number;
  onStructureSelect?: (structure: string) => void;
}

export function RepaymentStructureComparison({
  initialLoanAmount = 1000,
  initialInterestRate = 12,
  initialTenureMonths = 12,
  onStructureSelect,
}: RepaymentStructureComparisonProps) {
  const [loanAmount, setLoanAmount] = useState(initialLoanAmount);
  const [interestRate, setInterestRate] = useState(initialInterestRate);
  const [tenureMonths, setTenureMonths] = useState(initialTenureMonths);
  const [repaymentFrequency, setRepaymentFrequency] = useState<'Monthly' | 'Quarterly' | 'Semi-Annual' | 'Annual'>('Monthly');
  const [comparison, setComparison] = useState<CostComparisonResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedStructure, setSelectedStructure] = useState<string | null>(null);

  const handleCompare = async () => {
    if (!loanAmount || !interestRate || !tenureMonths) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsLoading(true);
    try {
      const request: CostComparisonRequest = {
        loanAmount,
        interestRate,
        tenureMonths,
        repaymentFrequency,
      };

      const result = await loanCalculatorApi.compareRepaymentStructures(request);
      setComparison(result);
      toast.success('Comparison calculated successfully');
    } catch (error: any) {
      toast.error('Failed to calculate comparison: ' + (error.response?.data?.message || error.message));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectStructure = (structure: string) => {
    setSelectedStructure(structure);
    if (onStructureSelect) {
      onStructureSelect(structure);
    }
    toast.success(`Selected ${structure} repayment structure`);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const StructureCard = ({ title, result, structureType }: { title: string; result: RepaymentStructureResult; structureType: string }) => {
    const isSelected = selectedStructure === structureType;
    const isCheapest = comparison?.summary.cheapest === structureType;
    const isMostExpensive = comparison?.summary.mostExpensive === structureType;

    return (
      <div
        className={`p-6 border-2 rounded-lg transition-all cursor-pointer ${
          isSelected
            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
        }`}
        onClick={() => handleSelectStructure(structureType)}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">{title}</h3>
          {isSelected && (
            <span className="px-2 py-1 text-xs font-medium bg-blue-500 text-white rounded">Selected</span>
          )}
          {isCheapest && (
            <span className="px-2 py-1 text-xs font-medium bg-green-500 text-white rounded flex items-center gap-1">
              <TrendingDown className="w-3 h-3" /> Cheapest
            </span>
          )}
          {isMostExpensive && (
            <span className="px-2 py-1 text-xs font-medium bg-red-500 text-white rounded flex items-center gap-1">
              <TrendingUp className="w-3 h-3" /> Most Expensive
            </span>
          )}
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600 dark:text-gray-400">Total Cost:</span>
            <span className="text-lg font-bold">{formatCurrency(result.totalCost)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600 dark:text-gray-400">Total Interest:</span>
            <span className="font-semibold">{formatCurrency(result.totalInterest)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600 dark:text-gray-400">Monthly Payment Range:</span>
            <span className="font-semibold">
              {formatCurrency(result.minPayment)} - {formatCurrency(result.maxPayment)}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600 dark:text-gray-400">Average Payment:</span>
            <span className="font-semibold">{formatCurrency(result.averagePayment)}</span>
          </div>
        </div>

        <Button
          type="button"
          variant={isSelected ? 'default' : 'outline'}
          className="w-full mt-4"
          onClick={(e) => {
            e.stopPropagation();
            handleSelectStructure(structureType);
          }}
        >
          {isSelected ? 'Selected' : 'Select This Structure'}
        </Button>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <Card title="Repayment Structure Comparison">
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              label="Loan Amount ($)"
              type="number"
              value={loanAmount}
              onChange={(e) => setLoanAmount(parseFloat(e.target.value) || 0)}
              min={1}
            />
            <Input
              label="Interest Rate (%)"
              type="number"
              value={interestRate}
              onChange={(e) => setInterestRate(parseFloat(e.target.value) || 0)}
              min={0}
              max={100}
              step="0.01"
            />
            <Input
              label="Tenure (Months)"
              type="number"
              value={tenureMonths}
              onChange={(e) => setTenureMonths(parseInt(e.target.value) || 0)}
              min={1}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              label="Repayment Frequency"
              value={repaymentFrequency}
              onChange={(e) => setRepaymentFrequency(e.target.value as any)}
              options={[
                { value: 'Monthly', label: 'Monthly' },
                { value: 'Quarterly', label: 'Quarterly' },
                { value: 'Semi-Annual', label: 'Semi-Annual' },
                { value: 'Annual', label: 'Annual' },
              ]}
            />
          </div>

          <Button onClick={handleCompare} isLoading={isLoading} className="w-full">
            <BarChart3 className="w-4 h-4 mr-2" />
            Compare All Structures
          </Button>
        </div>
      </Card>

      {comparison && (
        <div className="space-y-6">
          <Card title="Comparison Results">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <StructureCard title="Fixed Payment" result={comparison.fixed} structureType="FIXED" />
              <StructureCard title="Graduated Payment" result={comparison.graduated} structureType="GRADUATED" />
              <StructureCard title="Seasonal Payment" result={comparison.seasonal} structureType="SEASONAL" />
              <StructureCard title="Bullet Payment" result={comparison.bullet} structureType="BULLET" />
            </div>
          </Card>

          <Card title="Summary">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingDown className="w-5 h-5 text-green-600" />
                  <span className="font-semibold">Cheapest Option</span>
                </div>
                <p className="text-2xl font-bold text-green-600">{comparison.summary.cheapest}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Total Cost: {formatCurrency(comparison[comparison.summary.cheapest.toLowerCase() as keyof CostComparisonResponse]?.totalCost || 0)}
                </p>
              </div>

              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="w-5 h-5 text-blue-600" />
                  <span className="font-semibold">Lowest Monthly Payment</span>
                </div>
                <p className="text-2xl font-bold text-blue-600">{comparison.summary.lowestMonthlyPayment.structure}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Amount: {formatCurrency(comparison.summary.lowestMonthlyPayment.amount)}
                </p>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

