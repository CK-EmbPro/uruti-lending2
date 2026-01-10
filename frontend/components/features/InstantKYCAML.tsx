'use client';

import { useState } from 'react';
import { usePerformInstantKYCAML } from '@/lib/hooks/useInstantKYCAML';
import { InstantKYCCheckRequestDto, RiskLevel, CheckStatus } from '@/lib/api/instant-kyc-aml';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import {
  Shield,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  UserCheck,
  CreditCard,
  Ban,
  FileSearch,
} from 'lucide-react';

interface InstantKYCAMLProps {
  applicationId: string;
  onComplete?: (result: any) => void;
}

export function InstantKYCAML({ applicationId, onComplete }: InstantKYCAMLProps) {
  const [nationalIdNumber, setNationalIdNumber] = useState('');
  const [fullName, setFullName] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [customerId, setCustomerId] = useState('');
  const [result, setResult] = useState<any>(null);

  const performChecks = usePerformInstantKYCAML();

  const handlePerformChecks = async () => {
    if (!applicationId) {
      alert('Application ID is required');
      return;
    }

    try {
      const request: InstantKYCCheckRequestDto = {
        applicationId,
        ...(nationalIdNumber && {
          nationalId: {
            idNumber: nationalIdNumber,
            fullName: fullName || undefined,
            dateOfBirth: dateOfBirth || undefined,
          },
        }),
        ...(customerId && {
          creditBureau: {
            customerId,
          },
        }),
        ...(fullName && {
          sanctions: {
            fullName,
            dateOfBirth: dateOfBirth || undefined,
            checkOFAC: true,
            checkLocal: true,
          },
          adverseMedia: {
            fullName,
            dateOfBirth: dateOfBirth || undefined,
          },
        }),
      };

      const checkResult = await performChecks.mutateAsync(request);
      setResult(checkResult);
      if (onComplete) {
        onComplete(checkResult);
      }
    } catch (error) {
      console.error('Failed to perform KYC/AML checks:', error);
    }
  };

  const getRiskLevelColor = (level: RiskLevel) => {
    switch (level) {
      case RiskLevel.GREEN:
        return 'success';
      case RiskLevel.YELLOW:
        return 'warning';
      case RiskLevel.RED:
        return 'error';
      default:
        return 'default';
    }
  };

  const getCheckStatusIcon = (status: CheckStatus) => {
    switch (status) {
      case CheckStatus.COMPLETED:
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case CheckStatus.FAILED:
        return <XCircle className="h-5 w-5 text-red-600" />;
      case CheckStatus.IN_PROGRESS:
        return <Clock className="h-5 w-5 text-yellow-600" />;
      default:
        return <Clock className="h-5 w-5 text-gray-400" />;
    }
  };

  const getCheckTypeIcon = (checkType: string) => {
    switch (checkType) {
      case 'NATIONAL_ID':
        return <UserCheck className="h-5 w-5" />;
      case 'CREDIT_BUREAU':
        return <CreditCard className="h-5 w-5" />;
      case 'SANCTIONS':
        return <Ban className="h-5 w-5" />;
      case 'ADVERSE_MEDIA':
        return <FileSearch className="h-5 w-5" />;
      default:
        return <Shield className="h-5 w-5" />;
    }
  };

  return (
    <div className="space-y-6">
      <Card
        title="Instant KYC/AML Checks"
        subtitle="Real-time verification with National ID, Credit Bureau, Sanctions, and Adverse Media screening"
      >
        <div className="space-y-4">
          {/* Application ID Display */}
          <div className="p-3 bg-blue-50 rounded-lg">
            <p className="text-sm text-gray-600">Application ID</p>
            <p className="font-semibold text-gray-900">{applicationId}</p>
          </div>

          {/* National ID Verification */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              National ID Number (Optional)
            </label>
            <Input
              value={nationalIdNumber}
              onChange={(e) => setNationalIdNumber(e.target.value)}
              placeholder="Enter National ID number"
              disabled={performChecks.isPending}
            />
          </div>

          {/* Full Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Full Name (Optional)
            </label>
            <Input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Enter full name"
              disabled={performChecks.isPending}
            />
          </div>

          {/* Date of Birth */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date of Birth (Optional)
            </label>
            <Input
              type="date"
              value={dateOfBirth}
              onChange={(e) => setDateOfBirth(e.target.value)}
              disabled={performChecks.isPending}
            />
          </div>

          {/* Customer ID for Credit Bureau */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Customer ID for Credit Bureau (Optional)
            </label>
            <Input
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value)}
              placeholder="Enter customer ID"
              disabled={performChecks.isPending}
            />
          </div>

          {/* Perform Checks Button */}
          <Button
            onClick={handlePerformChecks}
            isLoading={performChecks.isPending}
            disabled={!applicationId}
            className="w-full"
          >
            <Shield className="h-5 w-5 mr-2" />
            Perform Instant KYC/AML Checks
          </Button>

          <p className="text-xs text-gray-500 text-center">
            All checks run in parallel. Sanctions hits result in automatic rejection.
          </p>
        </div>
      </Card>

      {/* Results Display */}
      {result && (
        <Card title="KYC/AML Check Results">
          <div className="space-y-6">
            {/* Risk Level Summary */}
            <div className={`p-6 rounded-lg ${
              result.riskLevel === RiskLevel.GREEN
                ? 'bg-green-50 border-2 border-green-200'
                : result.riskLevel === RiskLevel.YELLOW
                ? 'bg-yellow-50 border-2 border-yellow-200'
                : 'bg-red-50 border-2 border-red-200'
            }`}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <Shield className={`h-8 w-8 ${
                    result.riskLevel === RiskLevel.GREEN
                      ? 'text-green-600'
                      : result.riskLevel === RiskLevel.YELLOW
                      ? 'text-yellow-600'
                      : 'text-red-600'
                  }`} />
                  <div>
                    <p className="text-lg font-bold text-gray-900">Risk Level</p>
                    <p className="text-sm text-gray-600">Risk Score: {result.riskScore}/100</p>
                  </div>
                </div>
                <Badge variant={getRiskLevelColor(result.riskLevel)} size="lg">
                  {result.riskLevel}
                </Badge>
              </div>
              {result.autoRejected && (
                <div className="mt-4 p-3 bg-red-100 rounded-lg">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-red-600" />
                    <p className="font-semibold text-red-800">Application Auto-Rejected</p>
                  </div>
                  {result.rejectionReason && (
                    <p className="text-sm text-red-700 mt-1">{result.rejectionReason}</p>
                  )}
                </div>
              )}
              {result.processingTime && (
                <p className="text-xs text-gray-600 mt-2">
                  Processed in {(result.processingTime / 1000).toFixed(2)}s
                </p>
              )}
            </div>

            {/* Individual Check Results */}
            <div>
              <h4 className="font-semibold text-gray-900 mb-4">Check Results</h4>
              <div className="space-y-3">
                {result.checks?.map((check: any, idx: number) => (
                  <div
                    key={idx}
                    className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-3">
                        {getCheckTypeIcon(check.checkType)}
                        <div>
                          <p className="font-semibold text-gray-900">
                            {check.checkType.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(check.timestamp).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {getCheckStatusIcon(check.status)}
                        <Badge variant={check.passed ? 'success' : 'error'}>
                          {check.passed ? 'Passed' : 'Failed'}
                        </Badge>
                      </div>
                    </div>
                    <div className="mt-3 flex items-center justify-between">
                      <span className="text-sm text-gray-600">Score:</span>
                      <span className="text-sm font-semibold text-gray-900">{check.score}/100</span>
                    </div>
                    {check.issues && check.issues.length > 0 && (
                      <div className="mt-3 p-2 bg-yellow-50 rounded">
                        <p className="text-xs font-medium text-yellow-800 mb-1">Issues:</p>
                        <ul className="list-disc list-inside space-y-1">
                          {check.issues.map((issue: string, issueIdx: number) => (
                            <li key={issueIdx} className="text-xs text-yellow-700">{issue}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {check.details && Object.keys(check.details).length > 0 && (
                      <div className="mt-3 p-2 bg-gray-50 rounded">
                        <p className="text-xs font-medium text-gray-700 mb-1">Details:</p>
                        <pre className="text-xs text-gray-600 overflow-x-auto">
                          {JSON.stringify(check.details, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Summary */}
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm font-medium text-gray-700 mb-2">Summary</p>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-gray-600">Total Checks:</span>{' '}
                  <span className="font-semibold">{result.checks?.length || 0}</span>
                </div>
                <div>
                  <span className="text-gray-600">Passed:</span>{' '}
                  <span className="font-semibold text-green-600">
                    {result.checks?.filter((c: any) => c.passed).length || 0}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Failed:</span>{' '}
                  <span className="font-semibold text-red-600">
                    {result.checks?.filter((c: any) => !c.passed).length || 0}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Completed At:</span>{' '}
                  <span className="font-semibold">
                    {new Date(result.completedAt).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}

