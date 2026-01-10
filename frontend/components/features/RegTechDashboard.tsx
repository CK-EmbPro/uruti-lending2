'use client';

import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import {
  complianceApi,
  ComplianceMetrics,
  ComplianceCheck,
  ComplianceCheckType,
  ComplianceCheckStatus,
  RegulatoryChange,
  RegulatorySource,
  RegulatoryChangePriority,
  ReportType,
} from '@/lib/api/compliance';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import {
  Shield,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  FileText,
  TrendingUp,
  BarChart3,
  RefreshCw,
  Plus,
  Download,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

interface RegTechDashboardProps {
  companyId?: string;
}

const statusColors: Record<ComplianceCheckStatus, string> = {
  [ComplianceCheckStatus.PASSED]: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  [ComplianceCheckStatus.FAILED]: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  [ComplianceCheckStatus.WARNING]: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  [ComplianceCheckStatus.PENDING]: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
};

const priorityColors: Record<RegulatoryChangePriority, string> = {
  [RegulatoryChangePriority.CRITICAL]: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  [RegulatoryChangePriority.HIGH]: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  [RegulatoryChangePriority.MEDIUM]: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  [RegulatoryChangePriority.LOW]: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
};

export function RegTechDashboard({ companyId }: RegTechDashboardProps) {
  const [selectedTab, setSelectedTab] = useState<'overview' | 'checks' | 'policies' | 'reports'>('overview');

  // Get compliance metrics
  const { data: metrics, isLoading: metricsLoading, refetch: refetchMetrics } = useQuery({
    queryKey: ['complianceMetrics'],
    queryFn: () => complianceApi.getComplianceMetrics(),
  });

  // Get recent compliance checks
  const { data: checksData, isLoading: checksLoading, refetch: refetchChecks } = useQuery({
    queryKey: ['complianceChecks'],
    queryFn: () => complianceApi.getComplianceChecks({ limit: 10 }),
  });

  // Run compliance check mutation
  const runCheckMutation = useMutation({
    mutationFn: (data: {
      entityType: string;
      entityId: string;
      checkType: ComplianceCheckType;
    }) => complianceApi.runComplianceCheck(data),
    onSuccess: () => {
      toast.success('Compliance check completed');
      refetchChecks();
      refetchMetrics();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to run compliance check');
    },
  });

  const handleRunCheck = (entityType: string, entityId: string, checkType: ComplianceCheckType) => {
    runCheckMutation.mutate({ entityType, entityId, checkType });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Shield className="w-6 h-6" />
            RegTech & Compliance Automation
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Automated compliance monitoring, regulatory change tracking, and compliance reporting
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => refetchMetrics()}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex -mb-px">
          {[
            { id: 'overview', label: 'Overview', icon: BarChart3 },
            { id: 'checks', label: 'Compliance Checks', icon: Shield },
            { id: 'policies', label: 'Policies', icon: FileText },
            { id: 'reports', label: 'Reports', icon: Download },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setSelectedTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2 border-b-2 font-medium text-sm ${
                  selectedTab === tab.id
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Overview Tab */}
      {selectedTab === 'overview' && (
        <>
          {/* Metrics Cards */}
          {metricsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <Card key={i} className="p-6">
                  <Skeleton className="h-8 w-32 mb-2" />
                  <Skeleton className="h-4 w-20" />
                </Card>
              ))}
            </div>
          ) : metrics ? (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card className="p-6 border-l-4 border-green-500">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Compliance Rate</p>
                  <CheckCircle className="w-5 h-5 text-green-500" />
                </div>
                <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                  {metrics.complianceRate.toFixed(1)}%
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {metrics.passedChecks} of {metrics.totalChecks} checks passed
                </p>
              </Card>

              <Card className="p-6 border-l-4 border-red-500">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Failed Checks</p>
                  <XCircle className="w-5 h-5 text-red-500" />
                </div>
                <p className="text-3xl font-bold text-red-600 dark:text-red-400">
                  {metrics.failedChecks}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {metrics.recentViolations} violations in last 30 days
                </p>
              </Card>

              <Card className="p-6 border-l-4 border-yellow-500">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Pending Changes</p>
                  <Clock className="w-5 h-5 text-yellow-500" />
                </div>
                <p className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">
                  {metrics.pendingRegulatoryChanges}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {metrics.overdueComplianceDeadlines} overdue deadlines
                </p>
              </Card>

              <Card className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Policies</p>
                  <FileText className="w-5 h-5 text-gray-400" />
                </div>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  {metrics.activePolicies}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Compliance policies in effect
                </p>
              </Card>
            </div>
          ) : null}

          {/* Recent Compliance Checks */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Compliance Checks</h3>
              <Button variant="outline" size="sm" onClick={() => refetchChecks()}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
            </div>

            {checksLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-20 w-full" />
                ))}
              </div>
            ) : checksData && checksData.checks.length > 0 ? (
              <div className="space-y-4">
                {checksData.checks.map((check) => (
                  <div
                    key={check.id}
                    className="border border-gray-200 dark:border-gray-700 rounded-lg p-4"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <Badge className={statusColors[check.status]}>
                            {check.status}
                          </Badge>
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                            {check.checkName}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                          <span>{check.entityType}: {check.entityId}</span>
                          <span>{check.checkType.replace(/_/g, ' ')}</span>
                          {check.complianceScore !== null && (
                            <span>Score: {check.complianceScore}/100</span>
                          )}
                          <span>{format(new Date(check.checkedAt), 'MMM d, yyyy HH:mm')}</span>
                        </div>
                        {check.violations.length > 0 && (
                          <div className="mt-2">
                            <p className="text-sm text-red-600 dark:text-red-400">
                              {check.violations.length} violation(s) found
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Shield className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-400">No compliance checks found</p>
              </div>
            )}
          </Card>
        </>
      )}

      {/* Compliance Checks Tab */}
      {selectedTab === 'checks' && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Compliance Checks</h3>
            <Button
              onClick={() => handleRunCheck('loan', 'example-loan-id', ComplianceCheckType.POLICY_COMPLIANCE)}
              disabled={runCheckMutation.isPending}
            >
              <Plus className="w-4 h-4 mr-2" />
              Run Check
            </Button>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Run automated compliance checks on loans, applications, and other entities
          </p>
          {/* Check list would go here */}
        </Card>
      )}

      {/* Policies Tab */}
      {selectedTab === 'policies' && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Compliance Policies</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Manage compliance policies and track regulatory changes
          </p>
        </Card>
      )}

      {/* Reports Tab */}
      {selectedTab === 'reports' && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Compliance Reports</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Generate and view compliance reports
          </p>
        </Card>
      )}
    </div>
  );
}

