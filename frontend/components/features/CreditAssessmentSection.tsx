'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { Alert } from '@/components/ui/Alert';
import { CreditDecisionCard } from './CreditDecisionCard';
import { UnderwritingReviewCard } from './UnderwritingReviewCard';
import { FraudAlertCard } from './FraudAlertCard';
import { AdverseActionNoticeCard } from './AdverseActionNoticeCard';
import {
  useCreditDecision,
  usePerformCreditDecision,
  useUnderwritingReviewsForApplication,
  useFraudAlertsForApplication,
  useAdverseActionNoticeForApplication,
  useDetectFraud,
  useGenerateAdverseActionNotice,
} from '@/lib/hooks/useCreditAssessment';
import {
  Brain,
  UserCheck,
  Shield,
  FileText,
  AlertTriangle,
  Sparkles,
  RefreshCw,
} from 'lucide-react';

interface CreditAssessmentSectionProps {
  applicationId: string;
  applicationStatus: string;
}

export function CreditAssessmentSection({ applicationId, applicationStatus }: CreditAssessmentSectionProps) {
  const [activeTab, setActiveTab] = useState<'decision' | 'review' | 'fraud' | 'notice'>('decision');

  const { data: creditDecision, isLoading: isLoadingDecision } = useCreditDecision(applicationId);
  const { data: reviews, isLoading: isLoadingReviews } = useUnderwritingReviewsForApplication(applicationId);
  const { data: fraudAlerts, isLoading: isLoadingFraud } = useFraudAlertsForApplication(applicationId);
  const { data: adverseNotice, isLoading: isLoadingNotice } = useAdverseActionNoticeForApplication(applicationId);

  const performCreditDecision = usePerformCreditDecision();
  const detectFraud = useDetectFraud();
  const generateNotice = useGenerateAdverseActionNotice();

  const canPerformDecision = applicationStatus === 'Submitted' || applicationStatus === 'SUBMITTED';
  const canDetectFraud = applicationStatus !== 'Draft' && applicationStatus !== 'DRAFT';
  const canGenerateNotice = applicationStatus === 'Rejected' || applicationStatus === 'REJECTED';

  const tabs = [
    { id: 'decision', label: 'Credit Decision', icon: Brain, count: creditDecision ? 1 : 0 },
    { id: 'review', label: 'Underwriting', icon: UserCheck, count: reviews?.length || 0 },
    { id: 'fraud', label: 'Fraud Alerts', icon: Shield, count: fraudAlerts?.length || 0 },
    { id: 'notice', label: 'Adverse Action', icon: FileText, count: adverseNotice ? 1 : 0 },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Credit Assessment</h2>
          <p className="text-sm text-gray-600 mt-1">
            Automated credit decisioning, underwriting review, fraud detection, and compliance
          </p>
        </div>
        <div className="flex gap-2">
          {canPerformDecision && !creditDecision && (
            <Button
              variant="primary"
              onClick={() => performCreditDecision.mutate(applicationId)}
              disabled={performCreditDecision.isPending}
            >
              {performCreditDecision.isPending ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Run Credit Decision
                </>
              )}
            </Button>
          )}
          {canDetectFraud && (
            <Button
              variant="outline"
              onClick={() => detectFraud.mutate(applicationId)}
              disabled={detectFraud.isPending}
            >
              {detectFraud.isPending ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Checking...
                </>
              ) : (
                <>
                  <Shield className="w-4 h-4 mr-2" />
                  Detect Fraud
                </>
              )}
            </Button>
          )}
          {canGenerateNotice && !adverseNotice && (
            <Button
              variant="outline"
              onClick={() => generateNotice.mutate({ applicationId })}
              disabled={generateNotice.isPending}
            >
              {generateNotice.isPending ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <FileText className="w-4 h-4 mr-2" />
                  Generate Notice
                </>
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`
                  flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors
                  ${
                    activeTab === tab.id
                      ? 'border-primary text-primary'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
                {tab.count > 0 && (
                  <Badge variant="default" size="sm">
                    {tab.count}
                  </Badge>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Content */}
      <div className="mt-6">
        {activeTab === 'decision' && (
          <div>
            {isLoadingDecision ? (
              <Skeleton className="h-64" />
            ) : creditDecision ? (
              <CreditDecisionCard decision={creditDecision} showActions={true} />
            ) : (
              <Alert variant="info" title="No Credit Decision">
                {canPerformDecision
                  ? 'Click "Run Credit Decision" to perform automated credit assessment.'
                  : 'Credit decision will be available after the application is submitted.'}
              </Alert>
            )}
          </div>
        )}

        {activeTab === 'review' && (
          <div className="space-y-4">
            {isLoadingReviews ? (
              <Skeleton className="h-64" />
            ) : reviews && reviews.length > 0 ? (
              reviews.map((review) => (
                <UnderwritingReviewCard key={review.id} review={review} showActions={true} />
              ))
            ) : (
              <Alert variant="info" title="No Underwriting Reviews">
                No underwriting reviews have been created for this application yet.
              </Alert>
            )}
          </div>
        )}

        {activeTab === 'fraud' && (
          <div className="space-y-4">
            {isLoadingFraud ? (
              <Skeleton className="h-64" />
            ) : fraudAlerts && fraudAlerts.length > 0 ? (
              fraudAlerts.map((alert) => (
                <FraudAlertCard key={alert.id} alert={alert} showActions={true} />
              ))
            ) : (
              <Alert variant="success" title="No Fraud Alerts">
                No fraud alerts have been detected for this application.
              </Alert>
            )}
          </div>
        )}

        {activeTab === 'notice' && (
          <div>
            {isLoadingNotice ? (
              <Skeleton className="h-64" />
            ) : adverseNotice ? (
              <AdverseActionNoticeCard notice={adverseNotice} showActions={true} />
            ) : (
              <Alert variant="info" title="No Adverse Action Notice">
                {canGenerateNotice
                  ? 'Click "Generate Notice" to create an adverse action notice for this declined application.'
                  : 'Adverse action notices are only generated for declined applications.'}
              </Alert>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

