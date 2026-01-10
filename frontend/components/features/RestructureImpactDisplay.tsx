'use client';

import { Card } from '@/components/ui/Card';
import { Alert } from '@/components/ui/Alert';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Calendar,
  Info,
  AlertCircle,
} from 'lucide-react';

interface RestructureImpactDisplayProps {
  impactAnalysis?: {
    interestDifference: number;
    totalCostDifference: number;
    paymentDifference: number;
    extensionMonths: number;
    percentageIncrease: number;
  };
  oldScheduleSummary?: {
    totalPayments: number;
    totalInterest: number;
    totalPrincipal: number;
    totalCost: number;
    numberOfPayments: number;
  };
  newScheduleSummary?: {
    totalPayments: number;
    totalInterest: number;
    totalPrincipal: number;
    totalCost: number;
    numberOfPayments: number;
  };
  oldTenure?: number;
  newTenure?: number;
}

export function RestructureImpactDisplay({
  impactAnalysis,
  oldScheduleSummary,
  newScheduleSummary,
  oldTenure,
  newTenure,
}: RestructureImpactDisplayProps) {
  if (!impactAnalysis && !oldScheduleSummary && !newScheduleSummary) {
    return null;
  }

  return (
    <Card title="Restructure Impact Analysis">
      <div className="space-y-4">
        {/* Tenure Extension Info */}
        {oldTenure && newTenure && (
          <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="w-4 h-4 text-blue-600" />
              <span className="font-semibold text-sm text-blue-900">Tenure Extension</span>
            </div>
            <div className="text-sm text-blue-800">
              <div>Original: {oldTenure} months</div>
              <div>New: {newTenure} months</div>
              {impactAnalysis && (
                <div className="mt-1 font-semibold">
                  Extension: {impactAnalysis.extensionMonths} months ({impactAnalysis.percentageIncrease.toFixed(1)}%)
                </div>
              )}
            </div>
          </div>
        )}

        {/* Impact Summary */}
        {impactAnalysis && (
          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex items-center gap-2 mb-3">
              <Info className="w-4 h-4 text-gray-500" />
              <span className="font-semibold text-sm">Impact Summary</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-2 bg-white rounded border border-gray-200">
                <div className="text-xs text-gray-600 mb-1">Interest Difference</div>
                <div className={`text-lg font-bold flex items-center gap-1 ${
                  impactAnalysis.interestDifference >= 0 ? 'text-red-600' : 'text-green-600'
                }`}>
                  {impactAnalysis.interestDifference >= 0 ? (
                    <TrendingUp className="w-4 h-4" />
                  ) : (
                    <TrendingDown className="w-4 h-4" />
                  )}
                  ${impactAnalysis.interestDifference >= 0 ? '+' : ''}{impactAnalysis.interestDifference.toLocaleString()}
                </div>
              </div>
              <div className="p-2 bg-white rounded border border-gray-200">
                <div className="text-xs text-gray-600 mb-1">Total Cost Difference</div>
                <div className={`text-lg font-bold flex items-center gap-1 ${
                  impactAnalysis.totalCostDifference >= 0 ? 'text-red-600' : 'text-green-600'
                }`}>
                  {impactAnalysis.totalCostDifference >= 0 ? (
                    <TrendingUp className="w-4 h-4" />
                  ) : (
                    <TrendingDown className="w-4 h-4" />
                  )}
                  ${impactAnalysis.totalCostDifference >= 0 ? '+' : ''}{impactAnalysis.totalCostDifference.toLocaleString()}
                </div>
              </div>
              <div className="p-2 bg-white rounded border border-gray-200">
                <div className="text-xs text-gray-600 mb-1">Payment Difference</div>
                <div className={`text-lg font-bold flex items-center gap-1 ${
                  impactAnalysis.paymentDifference >= 0 ? 'text-red-600' : 'text-green-600'
                }`}>
                  {impactAnalysis.paymentDifference >= 0 ? (
                    <TrendingUp className="w-4 h-4" />
                  ) : (
                    <TrendingDown className="w-4 h-4" />
                  )}
                  ${impactAnalysis.paymentDifference >= 0 ? '+' : ''}{impactAnalysis.paymentDifference.toLocaleString()}
                </div>
              </div>
              <div className="p-2 bg-white rounded border border-gray-200">
                <div className="text-xs text-gray-600 mb-1">Extension</div>
                <div className="text-lg font-bold text-gray-900">
                  {impactAnalysis.extensionMonths} months
                </div>
                <div className="text-xs text-gray-500">
                  {impactAnalysis.percentageIncrease.toFixed(1)}% increase
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Schedule Comparison */}
        {oldScheduleSummary && newScheduleSummary && (
          <div className="p-4 bg-gradient-to-r from-blue-50 to-gray-50 rounded-lg border border-gray-200">
            <div className="flex items-center gap-2 mb-3">
              <DollarSign className="w-4 h-4 text-gray-500" />
              <span className="font-semibold text-sm">Schedule Comparison</span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="font-medium text-sm text-gray-700 mb-2">Old Schedule</div>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Payments:</span>
                    <span className="font-semibold">${oldScheduleSummary.totalPayments.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Interest:</span>
                    <span className="font-semibold">${oldScheduleSummary.totalInterest.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Cost:</span>
                    <span className="font-semibold">${oldScheduleSummary.totalCost.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Payments:</span>
                    <span className="font-semibold">{oldScheduleSummary.numberOfPayments}</span>
                  </div>
                </div>
              </div>
              <div>
                <div className="font-medium text-sm text-gray-700 mb-2">New Schedule</div>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Payments:</span>
                    <span className="font-semibold">${newScheduleSummary.totalPayments.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Interest:</span>
                    <span className="font-semibold">${newScheduleSummary.totalInterest.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Cost:</span>
                    <span className="font-semibold">${newScheduleSummary.totalCost.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Payments:</span>
                    <span className="font-semibold">{newScheduleSummary.numberOfPayments}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Warning if cost increases */}
        {impactAnalysis && impactAnalysis.totalCostDifference > 0 && (
          <Alert variant="warning" title="Cost Increase Notice">
            <div className="text-sm">
              <p>This restructure will increase your total loan cost by:</p>
              <p className="font-semibold mt-1">
                ${impactAnalysis.totalCostDifference.toLocaleString()}
              </p>
              <p className="text-xs text-gray-600 mt-1">
                This is due to the extended repayment period. Please review carefully before acknowledging.
              </p>
            </div>
          </Alert>
        )}
      </div>
    </Card>
  );
}

