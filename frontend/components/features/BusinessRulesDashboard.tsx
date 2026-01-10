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
  useCreateBusinessRule,
  useUpdateBusinessRule,
  useTestBusinessRule,
  useAnalyzeBusinessRuleImpact,
  usePromoteBusinessRule,
  useBusinessRules,
} from '@/lib/hooks/useAdministration';
import {
  Code,
  Plus,
  Play,
  TrendingUp,
  Rocket,
  FileText,
  CheckCircle,
} from 'lucide-react';
import { format } from 'date-fns';
import type { RuleStatus, CreateBusinessRuleDto } from '@/lib/api/administration';

export function BusinessRulesDashboard() {
  const [selectedStatus, setSelectedStatus] = useState<RuleStatus | ''>('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showTestModal, setShowTestModal] = useState(false);
  const [showPromoteModal, setShowPromoteModal] = useState(false);
  const [selectedRuleId, setSelectedRuleId] = useState<string | null>(null);
  const [ruleName, setRuleName] = useState('');
  const [ruleCategory, setRuleCategory] = useState('');
  const [ruleDescription, setRuleDescription] = useState('');
  const [ruleDefinition, setRuleDefinition] = useState('');
  const [testRemarks, setTestRemarks] = useState('');
  const [promotionNotes, setPromotionNotes] = useState('');
  const [rolloutPercentage, setRolloutPercentage] = useState('100');

  const createRule = useCreateBusinessRule();
  const testRule = useTestBusinessRule();
  const analyzeImpact = useAnalyzeBusinessRuleImpact();
  const promoteRule = usePromoteBusinessRule();
  const { data: rules, isLoading, refetch } = useBusinessRules(selectedStatus || undefined);

  const handleCreate = () => {
    let parsedDefinition: Record<string, any> = {};
    try {
      parsedDefinition = JSON.parse(ruleDefinition || '{}');
    } catch (e) {
      // Invalid JSON, use empty object
    }

    const dto: CreateBusinessRuleDto = {
      ruleName,
      ruleCategory,
      ruleDescription,
      ruleDefinition: parsedDefinition,
    };

    createRule.mutate(dto, {
      onSuccess: () => {
        setShowCreateModal(false);
        resetForm();
        refetch();
      },
    });
  };

  const handleTest = () => {
    if (!selectedRuleId) return;

    testRule.mutate(
      {
        id: selectedRuleId,
        dto: { testRemarks: testRemarks || undefined },
      },
      {
        onSuccess: () => {
          setShowTestModal(false);
          setSelectedRuleId(null);
          setTestRemarks('');
          refetch();
        },
      },
    );
  };

  const handleAnalyzeImpact = (id: string) => {
    analyzeImpact.mutate(
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

  const handlePromote = () => {
    if (!selectedRuleId) return;

    promoteRule.mutate(
      {
        id: selectedRuleId,
        dto: {
          promotionNotes: promotionNotes || undefined,
          rolloutPercentage: rolloutPercentage ? parseInt(rolloutPercentage) : undefined,
        },
      },
      {
        onSuccess: () => {
          setShowPromoteModal(false);
          setSelectedRuleId(null);
          setPromotionNotes('');
          setRolloutPercentage('100');
          refetch();
        },
      },
    );
  };

  const resetForm = () => {
    setRuleName('');
    setRuleCategory('');
    setRuleDescription('');
    setRuleDefinition('');
  };

  const getStatusColor = (status: RuleStatus) => {
    switch (status) {
      case 'Active':
        return 'bg-green-100 text-green-800';
      case 'Testing':
        return 'bg-blue-100 text-blue-800';
      case 'Draft':
        return 'bg-gray-100 text-gray-800';
      case 'Inactive':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const activeCount = rules?.filter((r) => r.status === 'Active').length || 0;
  const testingCount = rules?.filter((r) => r.status === 'Testing').length || 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Business Rules Management</h2>
          <p className="text-sm text-gray-600 mt-1">Create, test, and manage decisioning rules with sandbox testing</p>
        </div>
        <div className="flex items-center gap-3">
          <Select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value as RuleStatus | '')}
            className="w-40"
          >
            <option value="">All Status</option>
            <option value="Draft">Draft</option>
            <option value="Testing">Testing</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </Select>
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Rule
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <div className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Rules</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{rules?.length || 0}</p>
              </div>
              <Code className="h-8 w-8 text-blue-600" />
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active</p>
                <p className="text-2xl font-bold text-green-600 mt-1">{activeCount}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">In Testing</p>
                <p className="text-2xl font-bold text-yellow-600 mt-1">{testingCount}</p>
              </div>
              <Play className="h-8 w-8 text-yellow-600" />
            </div>
          </div>
        </Card>
      </div>

      <Card>
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Business Rules</h3>

          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          ) : rules && rules.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Rule
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Version
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {rules.map((rule) => (
                    <tr key={rule.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{rule.ruleName}</div>
                          <div className="text-sm text-gray-500">{rule.ruleDescription}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge>{rule.ruleCategory}</Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge className={getStatusColor(rule.status)}>{rule.status}</Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{rule.version || '1.0.0'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center gap-2">
                          {rule.status === 'Draft' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedRuleId(rule.id);
                                setShowTestModal(true);
                              }}
                            >
                              <Play className="h-4 w-4 mr-1" />
                              Test
                            </Button>
                          )}
                          {rule.status === 'Testing' && (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleAnalyzeImpact(rule.id)}
                              >
                                <TrendingUp className="h-4 w-4 mr-1" />
                                Analyze
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedRuleId(rule.id);
                                  setShowPromoteModal(true);
                                }}
                              >
                                <Rocket className="h-4 w-4 mr-1" />
                                Promote
                              </Button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <Code className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No business rules found</p>
            </div>
          )}
        </div>
      </Card>

      {/* Create Rule Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          resetForm();
        }}
        title="Create Business Rule"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Rule Name</label>
            <Input
              value={ruleName}
              onChange={(e) => setRuleName(e.target.value)}
              placeholder="Credit Score Threshold Rule"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
            <Input
              value={ruleCategory}
              onChange={(e) => setRuleCategory(e.target.value)}
              placeholder="Credit Decisioning"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
            <Textarea
              value={ruleDescription}
              onChange={(e) => setRuleDescription(e.target.value)}
              placeholder="Describe the business rule..."
              rows={3}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Rule Definition (JSON)</label>
            <Textarea
              value={ruleDefinition}
              onChange={(e) => setRuleDefinition(e.target.value)}
              placeholder='{"condition": "creditScore >= 700", "action": "approve"}'
              rows={6}
            />
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setShowCreateModal(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              disabled={!ruleName || !ruleCategory || !ruleDescription || createRule.isPending}
            >
              {createRule.isPending ? 'Creating...' : 'Create Rule'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Test Rule Modal */}
      <Modal
        isOpen={showTestModal}
        onClose={() => {
          setShowTestModal(false);
          setSelectedRuleId(null);
          setTestRemarks('');
        }}
        title="Test Business Rule"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Test Remarks</label>
            <Textarea
              value={testRemarks}
              onChange={(e) => setTestRemarks(e.target.value)}
              placeholder="Enter test notes..."
              rows={4}
            />
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setShowTestModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleTest} disabled={testRule.isPending}>
              {testRule.isPending ? 'Testing...' : 'Run Tests'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Promote Rule Modal */}
      <Modal
        isOpen={showPromoteModal}
        onClose={() => {
          setShowPromoteModal(false);
          setSelectedRuleId(null);
          setPromotionNotes('');
          setRolloutPercentage('100');
        }}
        title="Promote Business Rule to Production"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Promotion Notes</label>
            <Textarea
              value={promotionNotes}
              onChange={(e) => setPromotionNotes(e.target.value)}
              placeholder="Enter promotion notes..."
              rows={3}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Rollout Percentage (0-100)</label>
            <Input
              type="number"
              min="0"
              max="100"
              value={rolloutPercentage}
              onChange={(e) => setRolloutPercentage(e.target.value)}
              placeholder="100"
            />
            <p className="text-xs text-gray-500 mt-1">Use 100 for full rollout, or lower for gradual rollout</p>
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setShowPromoteModal(false)}>
              Cancel
            </Button>
            <Button onClick={handlePromote} disabled={promoteRule.isPending}>
              {promoteRule.isPending ? 'Promoting...' : 'Promote to Production'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

