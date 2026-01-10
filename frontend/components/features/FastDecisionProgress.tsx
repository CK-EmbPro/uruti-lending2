'use client';

import { useEffect } from 'react';
import { useGetProgress, useGetResult } from '@/lib/hooks/useFastDecision';
import { DecisionStep, StepStatus, DecisionStatus } from '@/lib/api/fast-decision';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Progress } from '@/components/ui/Progress';
import {
  FileText,
  Shield,
  Calculator,
  CheckCircle,
  Clock,
  AlertCircle,
  XCircle,
  CheckCircle2,
} from 'lucide-react';

interface FastDecisionProgressProps {
  applicationId: string;
  onComplete?: (result: any) => void;
}

const stepConfig = {
  [DecisionStep.DOCUMENT_VERIFICATION]: {
    label: 'Document Verification',
    icon: FileText,
    slaTarget: 30,
    color: 'blue',
  },
  [DecisionStep.KYC_AML]: {
    label: 'KYC/AML Checks',
    icon: Shield,
    slaTarget: 45,
    color: 'purple',
  },
  [DecisionStep.SCORING]: {
    label: 'Credit Scoring',
    icon: Calculator,
    slaTarget: 2,
    color: 'green',
  },
  [DecisionStep.APPROVAL]: {
    label: 'Approval Decision',
    icon: CheckCircle,
    slaTarget: 15,
    color: 'orange',
  },
};

export function FastDecisionProgress({ applicationId, onComplete }: FastDecisionProgressProps) {
  const { data: progress, isLoading } = useGetProgress(applicationId, true, 1000);
  const { data: result } = useGetResult(applicationId, progress?.status === DecisionStatus.COMPLETED);

  useEffect(() => {
    if (result && onComplete) {
      onComplete(result);
    }
  }, [result, onComplete]);

  if (isLoading && !progress) {
    return (
      <Card>
        <div className="flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Loading progress...</span>
        </div>
      </Card>
    );
  }

  if (!progress) {
    return (
      <Card>
        <div className="text-center p-8 text-gray-600">
          No progress data available
        </div>
      </Card>
    );
  }

  const formatTime = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}m`;
  };

  const getStatusIcon = (status: StepStatus) => {
    switch (status) {
      case StepStatus.COMPLETED:
        return <CheckCircle2 className="h-5 w-5 text-green-600" />;
      case StepStatus.IN_PROGRESS:
        return <Clock className="h-5 w-5 text-blue-600 animate-spin" />;
      case StepStatus.FAILED:
        return <XCircle className="h-5 w-5 text-red-600" />;
      case StepStatus.SKIPPED:
        return <AlertCircle className="h-5 w-5 text-gray-400" />;
      default:
        return <Clock className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: StepStatus) => {
    switch (status) {
      case StepStatus.COMPLETED:
        return <Badge variant="success">Completed</Badge>;
      case StepStatus.IN_PROGRESS:
        return <Badge variant="info">In Progress</Badge>;
      case StepStatus.FAILED:
        return <Badge variant="error">Failed</Badge>;
      case StepStatus.SKIPPED:
        return <Badge variant="default">Skipped</Badge>;
      default:
        return <Badge variant="default">Pending</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Overall Progress */}
      <Card>
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-semibold text-gray-900">Fast Decision Progress</h3>
            <Badge variant={progress.slaCompliant ? 'success' : 'error'}>
              {progress.slaCompliant ? 'SLA Compliant' : 'SLA Violated'}
            </Badge>
          </div>
          <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
            <span>Progress: {progress.progressPercentage}%</span>
            <span>Elapsed: {formatTime(progress.elapsedTime)}</span>
          </div>
          <Progress value={progress.progressPercentage} />
          <div className="flex items-center justify-between text-xs text-gray-500 mt-2">
            <span>Estimated remaining: {formatTime(progress.estimatedTimeRemaining)}</span>
            <span>Target: &lt;10 minutes</span>
          </div>
        </div>

        {/* SLA Violations */}
        {progress.slaViolations.length > 0 && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <p className="font-semibold text-red-800">SLA Violations</p>
            </div>
            <ul className="list-disc list-inside space-y-1">
              {progress.slaViolations.map((violation, idx) => (
                <li key={idx} className="text-sm text-red-700">{violation}</li>
              ))}
            </ul>
          </div>
        )}
      </Card>

      {/* Step Details */}
      <Card title="Step Details">
        <div className="space-y-4">
          {Object.values(DecisionStep)
            .filter((step) => step !== DecisionStep.COMPLETED)
            .map((step) => {
              const stepData = progress.steps[step];
              if (!stepData) return null;

              const config = stepConfig[step];
              const StepIcon = config.icon;

              return (
                <div
                  key={step}
                  className={`p-4 border-2 rounded-lg ${
                    stepData.status === StepStatus.IN_PROGRESS
                      ? 'border-blue-300 bg-blue-50'
                      : stepData.status === StepStatus.COMPLETED
                      ? 'border-green-300 bg-green-50'
                      : stepData.status === StepStatus.FAILED
                      ? 'border-red-300 bg-red-50'
                      : 'border-gray-200 bg-gray-50'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(stepData.status)}
                      <StepIcon className={`h-6 w-6 text-${config.color}-600`} />
                      <div>
                        <p className="font-semibold text-gray-900">{config.label}</p>
                        <p className="text-xs text-gray-600">SLA Target: &lt;{config.slaTarget}s</p>
                      </div>
                    </div>
                    {getStatusBadge(stepData.status)}
                  </div>

                  {stepData.duration !== undefined && (
                    <div className="mt-2 flex items-center justify-between text-sm">
                      <span className="text-gray-600">Duration:</span>
                      <span
                        className={`font-semibold ${
                          stepData.slaMet ? 'text-green-600' : 'text-red-600'
                        }`}
                      >
                        {formatTime(stepData.duration)}
                        {stepData.slaMet ? ' ✓' : ' ✗'}
                      </span>
                    </div>
                  )}

                  {stepData.error && (
                    <div className="mt-2 p-2 bg-red-100 rounded text-sm text-red-800">
                      Error: {stepData.error}
                    </div>
                  )}

                  {stepData.result && stepData.status === StepStatus.COMPLETED && (
                    <div className="mt-2 p-2 bg-white rounded text-xs text-gray-600">
                      <pre>{JSON.stringify(stepData.result, null, 2)}</pre>
                    </div>
                  )}
                </div>
              );
            })}
        </div>
      </Card>

      {/* Result Display */}
      {result && (
        <Card title="Decision Result">
          <div className={`p-6 rounded-lg ${
            result.approved
              ? 'bg-green-50 border-2 border-green-200'
              : 'bg-yellow-50 border-2 border-yellow-200'
          }`}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                {result.approved ? (
                  <CheckCircle2 className="h-8 w-8 text-green-600" />
                ) : (
                  <AlertCircle className="h-8 w-8 text-yellow-600" />
                )}
                <div>
                  <p className="text-xl font-bold text-gray-900">
                    {result.approved ? 'Application Approved' : 'Requires Manual Review'}
                  </p>
                  <p className="text-sm text-gray-600">
                    Processed in {formatTime(result.totalProcessingTime)}
                  </p>
                </div>
              </div>
              <Badge variant={result.slaCompliant ? 'success' : 'error'}>
                {result.slaCompliant ? 'SLA Met' : 'SLA Violated'}
              </Badge>
            </div>

            {result.approved && (
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div>
                  <p className="text-sm text-gray-600">Approved Amount</p>
                  <p className="text-lg font-semibold text-gray-900">
                    ${result.approvedAmount?.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Interest Rate</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {result.approvedInterestRate}%
                  </p>
                </div>
              </div>
            )}

            {result.conditions && result.conditions.length > 0 && (
              <div className="mt-4">
                <p className="text-sm font-medium text-gray-700 mb-2">Conditions:</p>
                <ul className="list-disc list-inside space-y-1">
                  {result.conditions.map((condition, idx) => (
                    <li key={idx} className="text-sm text-gray-600">{condition}</li>
                  ))}
                </ul>
              </div>
            )}

            {result.rationale && (
              <div className="mt-4">
                <p className="text-sm font-medium text-gray-700 mb-2">Rationale:</p>
                <p className="text-sm text-gray-600">{result.rationale}</p>
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}

