'use client';

import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { CreditDecision } from '@/lib/api/credit-assessment';
import { CheckCircle, XCircle, AlertCircle, Clock, TrendingUp, Percent, DollarSign, Calendar } from 'lucide-react';
import { format } from 'date-fns';

interface CreditDecisionCardProps {
  decision: CreditDecision;
  onOverride?: () => void;
  showActions?: boolean;
}

export function CreditDecisionCard({ decision, onOverride, showActions = false }: CreditDecisionCardProps) {
  const getOutcomeIcon = () => {
    switch (decision.outcome) {
      case 'Approved':
        return <CheckCircle className="w-6 h-6 text-green-600" />;
      case 'Conditionally Approved':
        return <AlertCircle className="w-6 h-6 text-yellow-600" />;
      case 'Declined':
        return <XCircle className="w-6 h-6 text-red-600" />;
      case 'Referred':
        return <Clock className="w-6 h-6 text-blue-600" />;
      default:
        return <AlertCircle className="w-6 h-6 text-gray-600" />;
    }
  };

  const getOutcomeVariant = (): 'success' | 'warning' | 'error' | 'info' | 'default' => {
    switch (decision.outcome) {
      case 'Approved':
        return 'success';
      case 'Conditionally Approved':
        return 'warning';
      case 'Declined':
        return 'error';
      case 'Referred':
        return 'info';
      default:
        return 'default';
    }
  };

  const getDecisionTypeColor = () => {
    if (decision.isOverride) return 'bg-purple-100 text-purple-800 border-purple-300';
    switch (decision.decisionType) {
      case 'Automated':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'Manual':
        return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'Override':
        return 'bg-purple-100 text-purple-800 border-purple-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  return (
    <Card className="border-l-4 border-l-blue-500">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          {getOutcomeIcon()}
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Credit Decision</h3>
            <p className="text-sm text-gray-600">
              {format(new Date(decision.decisionDate), 'PPp')}
            </p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          <Badge variant={getOutcomeVariant()}>{decision.outcome}</Badge>
          <Badge className={getDecisionTypeColor()}>
            {decision.decisionType}
            {decision.isOverride && ' (Override)'}
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        <div className="bg-gray-50 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="w-4 h-4 text-gray-600" />
            <span className="text-xs text-gray-600">Credit Score</span>
          </div>
          <p className="text-lg font-semibold text-gray-900">{decision.creditScore}</p>
        </div>

        {decision.debtToIncomeRatio !== undefined && (
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <Percent className="w-4 h-4 text-gray-600" />
              <span className="text-xs text-gray-600">Debt-to-Income</span>
            </div>
            <p className="text-lg font-semibold text-gray-900">
              {(decision.debtToIncomeRatio * 100).toFixed(1)}%
            </p>
          </div>
        )}

        {decision.approvedAmount && (
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <DollarSign className="w-4 h-4 text-gray-600" />
              <span className="text-xs text-gray-600">Approved Amount</span>
            </div>
            <p className="text-lg font-semibold text-gray-900">
              ${decision.approvedAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
        )}

        {decision.approvedInterestRate && (
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <Percent className="w-4 h-4 text-gray-600" />
              <span className="text-xs text-gray-600">Interest Rate</span>
            </div>
            <p className="text-lg font-semibold text-gray-900">
              {decision.approvedInterestRate.toFixed(2)}%
            </p>
          </div>
        )}
      </div>

      {decision.decisionRationale && (
        <div className="mb-4">
          <h4 className="text-sm font-semibold text-gray-700 mb-2">Decision Rationale</h4>
          <p className="text-sm text-gray-600 bg-gray-50 rounded-lg p-3">
            {decision.decisionRationale}
          </p>
        </div>
      )}

      {decision.conditions && (
        <div className="mb-4">
          <h4 className="text-sm font-semibold text-yellow-700 mb-2">Conditions</h4>
          <p className="text-sm text-yellow-800 bg-yellow-50 rounded-lg p-3">
            {decision.conditions}
          </p>
        </div>
      )}

      {decision.isOverride && decision.overrideJustification && (
        <div className="mb-4">
          <h4 className="text-sm font-semibold text-purple-700 mb-2">Override Justification</h4>
          <p className="text-sm text-purple-800 bg-purple-50 rounded-lg p-3">
            {decision.overrideJustification}
          </p>
        </div>
      )}

      {decision.riskFactors && Object.keys(decision.riskFactors).length > 0 && (
        <div className="mb-4">
          <h4 className="text-sm font-semibold text-gray-700 mb-2">Risk Factors</h4>
          <div className="flex flex-wrap gap-2">
            {Object.entries(decision.riskFactors).map(([key, value]) => (
              value && (
                <Badge key={key} variant="warning" className="text-xs">
                  {key.replace(/([A-Z])/g, ' $1').trim()}
                </Badge>
              )
            ))}
          </div>
        </div>
      )}

      {showActions && decision.outcome === 'Declined' && onOverride && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <Button variant="outline" onClick={onOverride} className="w-full">
            Override Decision
          </Button>
        </div>
      )}
    </Card>
  );
}

