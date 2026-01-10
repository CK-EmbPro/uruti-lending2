'use client';

import { useState } from 'react';
import { useRecommendProductsMutation } from '@/lib/hooks/useAI';
import { CustomerProfile } from '@/lib/api/ai';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { Sparkles, CheckCircle, XCircle, AlertCircle, TrendingUp, DollarSign, Calendar, Percent } from 'lucide-react';

interface AIProductRecommendationProps {
  companyId: string;
  onProductSelect?: (productId: string) => void;
}

export default function AIProductRecommendation({ companyId, onProductSelect }: AIProductRecommendationProps) {
  const [customerProfile, setCustomerProfile] = useState<CustomerProfile>({
    age: undefined,
    monthlyIncome: undefined,
    employmentType: '',
    creditScore: undefined,
    requestedAmount: undefined,
    preferredTerm: undefined,
    useCase: '',
  });

  const recommendMutation = useRecommendProductsMutation();

  const handleRecommend = () => {
    if (!customerProfile.age || !customerProfile.monthlyIncome || !customerProfile.requestedAmount) {
      return;
    }

    recommendMutation.mutate({
      customerProfile,
      companyId,
      limit: 5,
      includeNotEligible: false,
    });
  };

  const getEligibilityBadge = (status: string) => {
    switch (status) {
      case 'ELIGIBLE':
        return <Badge className="bg-green-100 text-green-800">Eligible</Badge>;
      case 'PARTIALLY_ELIGIBLE':
        return <Badge className="bg-yellow-100 text-yellow-800">Partially Eligible</Badge>;
      case 'NOT_ELIGIBLE':
        return <Badge className="bg-red-100 text-red-800">Not Eligible</Badge>;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-5 h-5 text-blue-600" />
          <h2 className="text-xl font-semibold">AI Product Recommendation</h2>
        </div>
        <p className="text-gray-600 mb-6">
          Tell us about yourself and we'll recommend the best loan products for you.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Age</label>
            <Input
              type="number"
              placeholder="e.g., 35"
              value={customerProfile.age || ''}
              onChange={(e) => setCustomerProfile({ ...customerProfile, age: parseInt(e.target.value) || undefined })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Monthly Income ($)</label>
            <Input
              type="number"
              placeholder="e.g., 5000"
              value={customerProfile.monthlyIncome || ''}
              onChange={(e) =>
                setCustomerProfile({ ...customerProfile, monthlyIncome: parseFloat(e.target.value) || undefined })
              }
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Employment Type</label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={customerProfile.employmentType || ''}
              onChange={(e) => setCustomerProfile({ ...customerProfile, employmentType: e.target.value })}
            >
              <option value="">Select...</option>
              <option value="Salaried">Salaried</option>
              <option value="Self-Employed">Self-Employed</option>
              <option value="Small Business">Small Business</option>
              <option value="Daily Wage">Daily Wage</option>
              <option value="Freelancer">Freelancer</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Credit Score</label>
            <Input
              type="number"
              placeholder="e.g., 650"
              min="300"
              max="850"
              value={customerProfile.creditScore || ''}
              onChange={(e) =>
                setCustomerProfile({ ...customerProfile, creditScore: parseInt(e.target.value) || undefined })
              }
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Requested Amount ($)</label>
            <Input
              type="number"
              placeholder="e.g., 10000"
              value={customerProfile.requestedAmount || ''}
              onChange={(e) =>
                setCustomerProfile({ ...customerProfile, requestedAmount: parseFloat(e.target.value) || undefined })
              }
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Preferred Term (months)</label>
            <Input
              type="number"
              placeholder="e.g., 12"
              value={customerProfile.preferredTerm || ''}
              onChange={(e) =>
                setCustomerProfile({ ...customerProfile, preferredTerm: parseInt(e.target.value) || undefined })
              }
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Use Case</label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={customerProfile.useCase || ''}
              onChange={(e) => setCustomerProfile({ ...customerProfile, useCase: e.target.value })}
            >
              <option value="">Select...</option>
              <option value="Business Expansion">Business Expansion</option>
              <option value="Trip Financing">Trip Financing</option>
              <option value="Emergency Expenses">Emergency Expenses</option>
              <option value="Working Capital">Working Capital</option>
              <option value="Equipment Financing">Equipment Financing</option>
              <option value="Debt Consolidation">Debt Consolidation</option>
              <option value="Home Improvement">Home Improvement</option>
              <option value="Medical Expenses">Medical Expenses</option>
            </select>
          </div>
        </div>

        <div className="mt-6">
          <Button
            onClick={handleRecommend}
            disabled={recommendMutation.isPending || !customerProfile.age || !customerProfile.monthlyIncome || !customerProfile.requestedAmount}
            className="w-full"
          >
            {recommendMutation.isPending ? 'Finding Recommendations...' : 'Get Recommendations'}
          </Button>
        </div>
      </Card>

      {recommendMutation.isPending && (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="p-6">
              <Skeleton className="h-6 w-48 mb-4" />
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-3/4" />
            </Card>
          ))}
        </div>
      )}

      {recommendMutation.isSuccess && recommendMutation.data && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">
              {recommendMutation.data.length} Product{recommendMutation.data.length !== 1 ? 's' : ''} Recommended
            </h3>
            <Badge className="bg-blue-100 text-blue-800">
              Match Score: {((recommendMutation.data[0]?.matchScore || 0) * 100).toFixed(0)}%
            </Badge>
          </div>

          {recommendMutation.data.map((recommendation) => (
            <Card key={recommendation.productId} className="p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="text-lg font-semibold">{recommendation.productName}</h4>
                    {getEligibilityBadge(recommendation.eligibilityStatus)}
                  </div>
                  <p className="text-sm text-gray-600">{recommendation.productCode}</p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-blue-600">
                    {((recommendation.matchScore || 0) * 100).toFixed(0)}%
                  </div>
                  <div className="text-xs text-gray-500">Match Score</div>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div className="flex items-center gap-2">
                  <Percent className="w-4 h-4 text-gray-400" />
                  <div>
                    <div className="text-xs text-gray-500">Interest Rate</div>
                    <div className="font-semibold">{recommendation.rateOfInterest}% / month</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-gray-400" />
                  <div>
                    <div className="text-xs text-gray-500">Amount Range</div>
                    <div className="font-semibold">
                      ${recommendation.minimumLoanAmount?.toLocaleString()} - ${recommendation.maximumLoanAmount?.toLocaleString()}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <div>
                    <div className="text-xs text-gray-500">Term</div>
                    <div className="font-semibold">
                      {recommendation.minimumTerm} - {recommendation.maximumTerm} months
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-gray-400" />
                  <div>
                    <div className="text-xs text-gray-500">Approval Chance</div>
                    <div className="font-semibold">{((recommendation.estimatedApproval || 0) * 100).toFixed(0)}%</div>
                  </div>
                </div>
              </div>

              {recommendation.estimatedMonthlyPayment && (
                <div className="bg-blue-50 p-3 rounded-lg mb-4">
                  <div className="text-sm text-gray-600">Estimated Monthly Payment</div>
                  <div className="text-xl font-bold text-blue-600">
                    ${recommendation.estimatedMonthlyPayment.toLocaleString()}
                  </div>
                </div>
              )}

              <div className="mb-4">
                <div className="text-sm font-medium text-gray-700 mb-2">Why this product?</div>
                <ul className="space-y-1">
                  {recommendation.reasons.map((reason, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm text-gray-600">
                      <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span>{reason}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {recommendation.missingRequirements && recommendation.missingRequirements.length > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle className="w-4 h-4 text-yellow-600" />
                    <div className="text-sm font-medium text-yellow-800">Missing Requirements</div>
                  </div>
                  <ul className="space-y-1">
                    {recommendation.missingRequirements.map((req, idx) => (
                      <li key={idx} className="text-sm text-yellow-700 flex items-start gap-2">
                        <XCircle className="w-3 h-3 text-yellow-600 mt-1 flex-shrink-0" />
                        <span>{req}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <Button
                onClick={() => onProductSelect?.(recommendation.productId)}
                className="w-full"
                variant={recommendation.eligibilityStatus === 'ELIGIBLE' ? 'default' : 'outline'}
              >
                {recommendation.eligibilityStatus === 'ELIGIBLE' ? 'Apply Now' : 'View Details'}
              </Button>
            </Card>
          ))}
        </div>
      )}

      {recommendMutation.isError && (
        <Card className="p-6 bg-red-50 border border-red-200">
          <div className="flex items-center gap-2 text-red-800">
            <XCircle className="w-5 h-5" />
            <div>
              <div className="font-semibold">Failed to get recommendations</div>
              <div className="text-sm">
                {recommendMutation.error?.response?.data?.message || 'Please try again later'}
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}

