'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import {
  useCreateStressTest,
  useRunStressTest,
  useStressTests,
} from '@/lib/hooks/useRiskManagement';
import {
  TrendingDown,
  DollarSign,
  AlertCircle,
  Play,
  Plus,
  Clock,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { format } from 'date-fns';
import type { StressTestType, StressTestStatus } from '@/lib/api/risk-management';

export function StressTestingDashboard() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [testName, setTestName] = useState('');
  const [testType, setTestType] = useState<StressTestType>('CUSTOM');
  const [defaultRate, setDefaultRate] = useState('5');
  const [lossRate, setLossRate] = useState('3');

  const createTest = useCreateStressTest();
  const runTest = useRunStressTest();
  const { data: tests, isLoading, refetch } = useStressTests();

  const handleCreate = () => {
    createTest.mutate(
      {
        testName,
        testType,
        scenarioParameters: {
          defaultRate: parseFloat(defaultRate) / 100,
          lossRate: parseFloat(lossRate) / 100,
        },
      },
      {
        onSuccess: () => {
          setShowCreateModal(false);
          setTestName('');
          refetch();
        },
      },
    );
  };

  const handleRun = (id: string) => {
    runTest.mutate(
      {
        id,
        dto: {},
      },
      {
        onSuccess: () => {
          refetch();
        },
      },
    );
  };

  const getStatusColor = (status: StressTestStatus) => {
    switch (status) {
      case 'COMPLETED':
        return 'bg-green-100 text-green-800';
      case 'RUNNING':
        return 'bg-blue-100 text-blue-800';
      case 'FAILED':
        return 'bg-red-100 text-red-800';
      case 'DRAFT':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const completedTests = tests?.filter((t) => t.status === 'COMPLETED') || [];
  const avgLossRate = completedTests.length > 0
    ? completedTests.reduce((sum, t) => sum + t.lossRate, 0) / completedTests.length
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Stress Testing</h2>
          <p className="text-sm text-gray-600 mt-1">Run stress scenarios to evaluate portfolio resilience</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Test
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <div className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Tests</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{tests?.length || 0}</p>
              </div>
              <TrendingDown className="h-8 w-8 text-blue-600" />
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-green-600 mt-1">{completedTests.length}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Avg Loss Rate</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{avgLossRate.toFixed(2)}%</p>
              </div>
              <AlertCircle className="h-8 w-8 text-orange-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Tests Table */}
      <Card>
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Stress Test Scenarios</h3>

          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          ) : tests && tests.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Test Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Projected Losses
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Capital Ratio
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {tests.map((test) => (
                    <tr key={test.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{test.testName}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge>{test.testType}</Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {format(new Date(test.testDate), 'MMM dd, yyyy')}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge className={getStatusColor(test.status)}>{test.status}</Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {test.status === 'COMPLETED' ? (
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              ${(test.projectedLosses / 1000).toFixed(0)}K
                            </div>
                            <div className="text-xs text-gray-500">{test.lossRate.toFixed(2)}%</div>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {test.status === 'COMPLETED' ? (
                          <div className="text-sm font-medium text-gray-900">
                            {test.capitalAdequacyRatio.toFixed(2)}%
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        {test.status === 'DRAFT' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRun(test.id)}
                            disabled={runTest.isPending}
                          >
                            <Play className="h-4 w-4 mr-1" />
                            Run
                          </Button>
                        )}
                        {test.status === 'RUNNING' && (
                          <div className="flex items-center gap-2 text-blue-600">
                            <Clock className="h-4 w-4 animate-spin" />
                            <span>Running...</span>
                          </div>
                        )}
                        {test.status === 'COMPLETED' && (
                          <span className="text-sm text-green-600">Completed</span>
                        )}
                        {test.status === 'FAILED' && (
                          <div className="flex items-center gap-2 text-red-600">
                            <XCircle className="h-4 w-4" />
                            <span>Failed</span>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <TrendingDown className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No stress tests found</p>
              <p className="text-sm text-gray-500 mt-2">Create a new stress test scenario to get started</p>
            </div>
          )}
        </div>
      </Card>

      {/* Create Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          setTestName('');
          setTestType('CUSTOM');
          setDefaultRate('5');
          setLossRate('3');
        }}
        title="Create Stress Test"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Test Name</label>
            <Input
              value={testName}
              onChange={(e) => setTestName(e.target.value)}
              placeholder="e.g., Q4 2024 Adverse Scenario"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Test Type</label>
            <Select value={testType} onChange={(e) => setTestType(e.target.value as StressTestType)}>
              <option value="CUSTOM">Custom</option>
              <option value="REGULATORY">Regulatory</option>
              <option value="BASELINE">Baseline</option>
              <option value="ADVERSE">Adverse</option>
              <option value="SEVERELY_ADVERSE">Severely Adverse</option>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Default Rate (%)
              </label>
              <Input
                type="number"
                value={defaultRate}
                onChange={(e) => setDefaultRate(e.target.value)}
                placeholder="5"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Loss Rate (%)</label>
              <Input
                type="number"
                value={lossRate}
                onChange={(e) => setLossRate(e.target.value)}
                placeholder="3"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => {
                setShowCreateModal(false);
                setTestName('');
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={!testName || createTest.isPending}>
              {createTest.isPending ? 'Creating...' : 'Create Test'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

