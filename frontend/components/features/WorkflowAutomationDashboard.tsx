'use client';

import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import {
  workflowAutomationApi,
  TriggerType,
  EventType,
  ScheduleType,
  ExecutionStatus,
  CreateWorkflowTriggerDto,
  ExecuteWorkflowDto,
  WorkflowTrigger,
  WorkflowExecution,
} from '@/lib/api/workflow-automation';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import {
  Play,
  Clock,
  Zap,
  Settings,
  BarChart3,
  CheckCircle,
  XCircle,
  AlertCircle,
  RefreshCw,
  Plus,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

interface WorkflowAutomationDashboardProps {
  companyId?: string;
}

const statusColors: Record<ExecutionStatus, string> = {
  [ExecutionStatus.PENDING]: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  [ExecutionStatus.RUNNING]: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  [ExecutionStatus.COMPLETED]: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  [ExecutionStatus.FAILED]: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  [ExecutionStatus.CANCELLED]: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
};

export function WorkflowAutomationDashboard({ companyId }: WorkflowAutomationDashboardProps) {
  const [showCreateTrigger, setShowCreateTrigger] = useState(false);
  const [selectedTriggerType, setSelectedTriggerType] = useState<TriggerType>(TriggerType.EVENT);

  // Get performance metrics
  const { data: metrics, isLoading: metricsLoading } = useQuery({
    queryKey: ['workflowPerformance'],
    queryFn: () => workflowAutomationApi.getPerformanceMetrics(),
  });

  // Get recent executions
  const { data: executionsData, isLoading: executionsLoading, refetch: refetchExecutions } = useQuery({
    queryKey: ['workflowExecutions'],
    queryFn: () => workflowAutomationApi.getExecutions({ limit: 10 }),
  });

  // Create trigger mutation
  const createTriggerMutation = useMutation({
    mutationFn: (dto: CreateWorkflowTriggerDto) => workflowAutomationApi.createTrigger(dto),
    onSuccess: () => {
      toast.success('Workflow trigger created successfully');
      setShowCreateTrigger(false);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create trigger');
    },
  });

  // Execute workflow mutation
  const executeWorkflowMutation = useMutation({
    mutationFn: (dto: ExecuteWorkflowDto) => workflowAutomationApi.executeWorkflow(dto),
    onSuccess: () => {
      toast.success('Workflow executed successfully');
      refetchExecutions();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to execute workflow');
    },
  });

  const handleCreateTrigger = (formData: any) => {
    const dto: CreateWorkflowTriggerDto = {
      workflowId: formData.workflowId,
      triggerType: selectedTriggerType,
      eventType: selectedTriggerType === TriggerType.EVENT ? formData.eventType : undefined,
      scheduleType: selectedTriggerType === TriggerType.SCHEDULE ? formData.scheduleType : undefined,
      cronExpression: formData.cronExpression,
      scheduleTime: formData.scheduleTime,
      conditions: formData.conditions ? JSON.parse(formData.conditions) : {},
      parameters: formData.parameters ? JSON.parse(formData.parameters) : {},
      isActive: formData.isActive !== false,
    };

    createTriggerMutation.mutate(dto);
  };

  const handleExecuteWorkflow = (workflowId: string, documentType: string, documentId: string) => {
    executeWorkflowMutation.mutate({
      workflowId,
      documentType,
      documentId,
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Zap className="w-6 h-6" />
            Workflow Automation
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Event-driven triggers, scheduled workflows, and automated execution
          </p>
        </div>
        <Button onClick={() => setShowCreateTrigger(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Create Trigger
        </Button>
      </div>

      {/* Performance Metrics */}
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
          <Card className="p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Executions</p>
              <BarChart3 className="w-5 h-5 text-gray-400" />
            </div>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">
              {metrics.totalExecutions}
            </p>
          </Card>

          <Card className="p-6 border-l-4 border-green-500">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Success Rate</p>
              <CheckCircle className="w-5 h-5 text-green-500" />
            </div>
            <p className="text-3xl font-bold text-green-600 dark:text-green-400">
              {metrics.successRate.toFixed(1)}%
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {metrics.successfulExecutions} successful
            </p>
          </Card>

          <Card className="p-6 border-l-4 border-red-500">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Failed Executions</p>
              <XCircle className="w-5 h-5 text-red-500" />
            </div>
            <p className="text-3xl font-bold text-red-600 dark:text-red-400">
              {metrics.failedExecutions}
            </p>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Avg Duration</p>
              <Clock className="w-5 h-5 text-gray-400" />
            </div>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">
              {metrics.averageDuration}ms
            </p>
          </Card>
        </div>
      ) : null}

      {/* Create Trigger Modal */}
      {showCreateTrigger && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Create Workflow Trigger
          </h3>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.target as HTMLFormElement);
              handleCreateTrigger(Object.fromEntries(formData));
            }}
            className="space-y-4"
          >
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Trigger Type
              </label>
              <Select
                value={selectedTriggerType}
                onChange={(e) => setSelectedTriggerType(e.target.value as TriggerType)}
              >
                <option value={TriggerType.EVENT}>Event-Driven</option>
                <option value={TriggerType.SCHEDULE}>Scheduled</option>
                <option value={TriggerType.MANUAL}>Manual</option>
              </Select>
            </div>

            {selectedTriggerType === TriggerType.EVENT && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Event Type
                </label>
                <Select name="eventType" required>
                  {Object.values(EventType).map((event) => (
                    <option key={event} value={event}>
                      {event.replace(/_/g, ' ')}
                    </option>
                  ))}
                </Select>
              </div>
            )}

            {selectedTriggerType === TriggerType.SCHEDULE && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Schedule Type
                  </label>
                  <Select name="scheduleType" required>
                    <option value={ScheduleType.DAILY}>Daily</option>
                    <option value={ScheduleType.WEEKLY}>Weekly</option>
                    <option value={ScheduleType.MONTHLY}>Monthly</option>
                    <option value={ScheduleType.CUSTOM}>Custom (Cron)</option>
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Schedule Time (HH:mm)
                  </label>
                  <Input type="time" name="scheduleTime" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Cron Expression (for custom)
                  </label>
                  <Input name="cronExpression" placeholder="0 0 * * *" />
                </div>
              </>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Workflow ID
              </label>
              <Input name="workflowId" required placeholder="workflow-uuid" />
            </div>

            <div className="flex gap-2">
              <Button type="submit" disabled={createTriggerMutation.isPending}>
                {createTriggerMutation.isPending ? 'Creating...' : 'Create Trigger'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowCreateTrigger(false)}
              >
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Recent Executions */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Executions</h3>
          <Button variant="outline" size="sm" onClick={() => refetchExecutions()}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>

        {executionsLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        ) : executionsData && executionsData.executions.length > 0 ? (
          <div className="space-y-4">
            {executionsData.executions.map((execution) => (
              <div
                key={execution.id}
                className="border border-gray-200 dark:border-gray-700 rounded-lg p-4"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <Badge className={statusColors[execution.status]}>
                        {execution.status}
                      </Badge>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {execution.documentType}: {execution.documentId}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                      {execution.startedAt && (
                        <span>
                          Started: {format(new Date(execution.startedAt), 'MMM d, yyyy HH:mm')}
                        </span>
                      )}
                      {execution.duration > 0 && (
                        <span>Duration: {execution.duration}ms</span>
                      )}
                      {execution.stepCount > 0 && <span>Steps: {execution.stepCount}</span>}
                    </div>
                    {execution.errorMessage && (
                      <p className="text-sm text-red-600 dark:text-red-400 mt-2">
                        Error: {execution.errorMessage}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">No workflow executions found</p>
          </div>
        )}
      </Card>
    </div>
  );
}

