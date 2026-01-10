'use client';

import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import {
  predictiveAnalyticsApi,
  PredictionType,
  PredictionResult,
  RiskLevel,
  PredictDefaultProbabilityDto,
  PredictCustomerLifetimeValueDto,
  PredictChurnRiskDto,
  PredictOptimalPricingDto,
} from '@/lib/api/predictive-analytics';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import {
  TrendingUp,
  TrendingDown,
  Users,
  DollarSign,
  AlertTriangle,
  Target,
  Brain,
  BarChart3,
  RefreshCw,
} from 'lucide-react';
import toast from 'react-hot-toast';

interface PredictiveAnalyticsDashboardProps {
  companyId?: string;
}

const riskLevelColors: Record<RiskLevel, string> = {
  [RiskLevel.LOW]: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  [RiskLevel.MEDIUM]: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  [RiskLevel.HIGH]: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  [RiskLevel.CRITICAL]: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
};

export function PredictiveAnalyticsDashboard({ companyId }: PredictiveAnalyticsDashboardProps) {
  const [selectedPrediction, setSelectedPrediction] = useState<PredictionType | null>(null);
  const [entityId, setEntityId] = useState('');
  const [predictionResult, setPredictionResult] = useState<PredictionResult | null>(null);

  // Default Probability Prediction
  const defaultProbabilityMutation = useMutation({
    mutationFn: (dto: PredictDefaultProbabilityDto) =>
      predictiveAnalyticsApi.predictDefaultProbability(dto),
    onSuccess: (data) => {
      setPredictionResult(data);
      toast.success('Default probability predicted successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to predict default probability');
    },
  });

  // Customer Lifetime Value Prediction
  const clvMutation = useMutation({
    mutationFn: (dto: PredictCustomerLifetimeValueDto) =>
      predictiveAnalyticsApi.predictCustomerLifetimeValue(dto),
    onSuccess: (data) => {
      setPredictionResult(data);
      toast.success('Customer lifetime value predicted successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to predict customer lifetime value');
    },
  });

  // Churn Risk Prediction
  const churnRiskMutation = useMutation({
    mutationFn: (dto: PredictChurnRiskDto) => predictiveAnalyticsApi.predictChurnRisk(dto),
    onSuccess: (data) => {
      setPredictionResult(data);
      toast.success('Churn risk predicted successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to predict churn risk');
    },
  });

  // Optimal Pricing Prediction
  const optimalPricingMutation = useMutation({
    mutationFn: (dto: PredictOptimalPricingDto) =>
      predictiveAnalyticsApi.predictOptimalPricing(dto),
    onSuccess: (data) => {
      setPredictionResult(data);
      toast.success('Optimal pricing predicted successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to predict optimal pricing');
    },
  });

  const handlePredict = () => {
    if (!selectedPrediction || !entityId) {
      toast.error('Please select prediction type and enter entity ID');
      return;
    }

    switch (selectedPrediction) {
      case PredictionType.DEFAULT_PROBABILITY:
        defaultProbabilityMutation.mutate({ entityId, entityType: 'loan' });
        break;
      case PredictionType.CUSTOMER_LIFETIME_VALUE:
        clvMutation.mutate({ customerId: entityId });
        break;
      case PredictionType.CHURN_RISK:
        churnRiskMutation.mutate({ customerId: entityId });
        break;
      case PredictionType.OPTIMAL_PRICING:
        optimalPricingMutation.mutate({ applicationId: entityId });
        break;
    }
  };

  const isLoading =
    defaultProbabilityMutation.isPending ||
    clvMutation.isPending ||
    churnRiskMutation.isPending ||
    optimalPricingMutation.isPending;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Brain className="w-6 h-6" />
            Predictive Analytics
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            ML-powered predictions for risk assessment, pricing, and customer insights
          </p>
        </div>
      </div>

      {/* Prediction Types Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card
          className="p-6 cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => setSelectedPrediction(PredictionType.DEFAULT_PROBABILITY)}
        >
          <div className="flex items-center justify-between mb-2">
            <AlertTriangle className="w-5 h-5 text-orange-500" />
            <Badge
              className={
                selectedPrediction === PredictionType.DEFAULT_PROBABILITY
                  ? 'bg-blue-500'
                  : 'bg-gray-200'
              }
            >
              {selectedPrediction === PredictionType.DEFAULT_PROBABILITY ? 'Selected' : 'Select'}
            </Badge>
          </div>
          <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
            Default Probability
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Predict loan default risk
          </p>
        </Card>

        <Card
          className="p-6 cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => setSelectedPrediction(PredictionType.CUSTOMER_LIFETIME_VALUE)}
        >
          <div className="flex items-center justify-between mb-2">
            <DollarSign className="w-5 h-5 text-green-500" />
            <Badge
              className={
                selectedPrediction === PredictionType.CUSTOMER_LIFETIME_VALUE
                  ? 'bg-blue-500'
                  : 'bg-gray-200'
              }
            >
              {selectedPrediction === PredictionType.CUSTOMER_LIFETIME_VALUE ? 'Selected' : 'Select'}
            </Badge>
          </div>
          <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
            Customer Lifetime Value
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Predict customer value
          </p>
        </Card>

        <Card
          className="p-6 cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => setSelectedPrediction(PredictionType.CHURN_RISK)}
        >
          <div className="flex items-center justify-between mb-2">
            <TrendingDown className="w-5 h-5 text-red-500" />
            <Badge
              className={
                selectedPrediction === PredictionType.CHURN_RISK ? 'bg-blue-500' : 'bg-gray-200'
              }
            >
              {selectedPrediction === PredictionType.CHURN_RISK ? 'Selected' : 'Select'}
            </Badge>
          </div>
          <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Churn Risk</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Predict customer churn
          </p>
        </Card>

        <Card
          className="p-6 cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => setSelectedPrediction(PredictionType.OPTIMAL_PRICING)}
        >
          <div className="flex items-center justify-between mb-2">
            <Target className="w-5 h-5 text-blue-500" />
            <Badge
              className={
                selectedPrediction === PredictionType.OPTIMAL_PRICING
                  ? 'bg-blue-500'
                  : 'bg-gray-200'
              }
            >
              {selectedPrediction === PredictionType.OPTIMAL_PRICING ? 'Selected' : 'Select'}
            </Badge>
          </div>
          <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Optimal Pricing</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Predict optimal rates
          </p>
        </Card>
      </div>

      {/* Prediction Input */}
      {selectedPrediction && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Run Prediction
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Entity ID
              </label>
              <Input
                value={entityId}
                onChange={(e) => setEntityId(e.target.value)}
                placeholder={
                  selectedPrediction === PredictionType.CUSTOMER_LIFETIME_VALUE ||
                  selectedPrediction === PredictionType.CHURN_RISK
                    ? 'Customer ID'
                    : selectedPrediction === PredictionType.OPTIMAL_PRICING
                    ? 'Application ID'
                    : 'Loan ID or Application ID'
                }
              />
            </div>
            <Button onClick={handlePredict} disabled={isLoading || !entityId} className="w-full">
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Predicting...
                </>
              ) : (
                <>
                  <Brain className="w-4 h-4 mr-2" />
                  Run Prediction
                </>
              )}
            </Button>
          </div>
        </Card>
      )}

      {/* Prediction Result */}
      {predictionResult && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Prediction Result
          </h3>
          <div className="space-y-4">
            {/* Score Display */}
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  {predictionResult.predictionType === PredictionType.DEFAULT_PROBABILITY
                    ? 'Default Probability'
                    : predictionResult.predictionType === PredictionType.CUSTOMER_LIFETIME_VALUE
                    ? 'Customer Lifetime Value'
                    : predictionResult.predictionType === PredictionType.CHURN_RISK
                    ? 'Churn Risk'
                    : 'Optimal Interest Rate'}
                </span>
                {predictionResult.riskLevel && (
                  <Badge className={riskLevelColors[predictionResult.riskLevel]}>
                    {predictionResult.riskLevel}
                  </Badge>
                )}
              </div>
              <div className="text-3xl font-bold text-gray-900 dark:text-white">
                {predictionResult.predictionType === PredictionType.CUSTOMER_LIFETIME_VALUE
                  ? `$${predictionResult.score.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                  : predictionResult.predictionType === PredictionType.OPTIMAL_PRICING
                  ? `${predictionResult.score.toFixed(2)}%`
                  : `${(predictionResult.score * 100).toFixed(1)}%`}
              </div>
              {predictionResult.confidence && (
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Confidence: {predictionResult.confidence.toFixed(0)}%
                </p>
              )}
            </div>

            {/* Explanation */}
            {predictionResult.explanation && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Explanation
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {predictionResult.explanation}
                </p>
              </div>
            )}

            {/* Factors */}
            {predictionResult.factors && Object.keys(predictionResult.factors).length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Contributing Factors
                </h4>
                <div className="space-y-1">
                  {Object.entries(predictionResult.factors).map(([key, value]) => (
                    <div key={key} className="flex items-center justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400 capitalize">
                        {key.replace(/([A-Z])/g, ' $1').trim()}:
                      </span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {typeof value === 'number' ? value.toFixed(2) : String(value)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recommendations */}
            {predictionResult.recommendations?.actions &&
              predictionResult.recommendations.actions.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Recommendations
                  </h4>
                  <ul className="list-disc list-inside space-y-1 text-sm text-gray-600 dark:text-gray-400">
                    {predictionResult.recommendations.actions.map((action: string, index: number) => (
                      <li key={index}>{action}</li>
                    ))}
                  </ul>
                </div>
              )}
          </div>
        </Card>
      )}
    </div>
  );
}

