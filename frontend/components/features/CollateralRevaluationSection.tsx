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
  useInitiateRevaluation,
  useUpdateValuation,
  useCollateralRevaluations,
  useTakeRevaluationAction,
} from '@/lib/hooks/useRiskManagement';
import {
  Shield,
  DollarSign,
  AlertTriangle,
  Plus,
  Edit,
  CheckCircle,
  XCircle,
  Clock,
} from 'lucide-react';
import { format } from 'date-fns';
import type { RevaluationType, RevaluationStatus } from '@/lib/api/risk-management';

interface CollateralRevaluationSectionProps {
  loanId: string;
}

export function CollateralRevaluationSection({ loanId }: CollateralRevaluationSectionProps) {
  const [showInitiateModal, setShowInitiateModal] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [showActionModal, setShowActionModal] = useState(false);
  const [selectedRevaluation, setSelectedRevaluation] = useState<string | null>(null);
  const [revaluationType, setRevaluationType] = useState<RevaluationType>('AUTOMATED');
  const [newValuation, setNewValuation] = useState('');
  const [valuationSource, setValuationSource] = useState('');
  const [valuationNotes, setValuationNotes] = useState('');
  const [actionNotes, setActionNotes] = useState('');

  const initiateRevaluation = useInitiateRevaluation();
  const updateValuation = useUpdateValuation();
  const { data: revaluations, isLoading, refetch } = useCollateralRevaluations({ loanId });
  const takeAction = useTakeRevaluationAction();

  const handleInitiate = () => {
    initiateRevaluation.mutate(
      {
        loanId,
        revaluationType,
      },
      {
        onSuccess: () => {
          setShowInitiateModal(false);
          setRevaluationType('AUTOMATED');
          refetch();
        },
      },
    );
  };

  const handleUpdate = () => {
    if (!selectedRevaluation) return;

    updateValuation.mutate(
      {
        id: selectedRevaluation,
        dto: {
          newValuation: parseFloat(newValuation),
          valuationEffectiveDate: new Date().toISOString(),
          valuationSource,
          valuationNotes,
        },
      },
      {
        onSuccess: () => {
          setShowUpdateModal(false);
          setSelectedRevaluation(null);
          setNewValuation('');
          setValuationSource('');
          setValuationNotes('');
          refetch();
        },
      },
    );
  };

  const handleTakeAction = () => {
    if (!selectedRevaluation) return;

    takeAction.mutate(
      {
        id: selectedRevaluation,
        dto: {
          requiredAction: actionNotes,
        },
      },
      {
        onSuccess: () => {
          setShowActionModal(false);
          setSelectedRevaluation(null);
          setActionNotes('');
          refetch();
        },
      },
    );
  };

  const getStatusColor = (status: RevaluationStatus) => {
    switch (status) {
      case 'COMPLETED':
        return 'bg-green-100 text-green-800';
      case 'IN_PROGRESS':
        return 'bg-blue-100 text-blue-800';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'FAILED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const pendingRevaluations = revaluations?.filter((r) => r.status === 'PENDING').length || 0;
  const underCollateralized = revaluations?.filter((r) => r.underCollateralized).length || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Collateral Revaluation</h3>
          <p className="text-sm text-gray-600 mt-1">Manage collateral valuations and LTV monitoring</p>
        </div>
        <Button onClick={() => setShowInitiateModal(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Initiate Revaluation
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <div className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Revaluations</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{revaluations?.length || 0}</p>
              </div>
              <Shield className="h-8 w-8 text-blue-600" />
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-yellow-600 mt-1">{pendingRevaluations}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-600" />
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Under-Collateralized</p>
                <p className="text-2xl font-bold text-red-600 mt-1">{underCollateralized}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Revaluations Table */}
      <Card>
        <div className="p-6">
          <h4 className="text-md font-semibold text-gray-900 mb-4">Revaluation History</h4>

          {isLoading ? (
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          ) : revaluations && revaluations.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Previous Valuation
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      New Valuation
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      LTV
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {revaluations.map((reval) => (
                    <tr key={reval.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {format(new Date(reval.revaluationDate), 'MMM dd, yyyy')}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge>{reval.revaluationType.replace(/_/g, ' ')}</Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {reval.previousValuation
                            ? `$${(reval.previousValuation / 1000).toFixed(0)}K`
                            : '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {reval.newValuation ? `$${(reval.newValuation / 1000).toFixed(0)}K` : '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {reval.newLTV ? (
                          <div>
                            <div
                              className={`text-sm font-medium ${
                                reval.underCollateralized ? 'text-red-600' : 'text-gray-900'
                              }`}
                            >
                              {reval.newLTV.toFixed(2)}%
                            </div>
                            {reval.underCollateralized && (
                              <div className="text-xs text-red-600">Exceeds limit</div>
                            )}
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge className={getStatusColor(reval.status)}>{reval.status}</Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center gap-2">
                          {reval.status === 'PENDING' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedRevaluation(reval.id);
                                setShowUpdateModal(true);
                              }}
                            >
                              <Edit className="h-4 w-4 mr-1" />
                              Update
                            </Button>
                          )}
                          {reval.underCollateralized && !reval.actionTaken && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedRevaluation(reval.id);
                                setShowActionModal(true);
                              }}
                            >
                              <AlertTriangle className="h-4 w-4 mr-1" />
                              Take Action
                            </Button>
                          )}
                          {reval.actionTaken && (
                            <div className="flex items-center gap-2 text-green-600">
                              <CheckCircle className="h-4 w-4" />
                              <span className="text-sm">Action Taken</span>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8">
              <Shield className="h-10 w-10 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600">No revaluations found</p>
              <p className="text-sm text-gray-500 mt-2">Initiate a revaluation to get started</p>
            </div>
          )}
        </div>
      </Card>

      {/* Initiate Modal */}
      <Modal
        isOpen={showInitiateModal}
        onClose={() => {
          setShowInitiateModal(false);
          setRevaluationType('AUTOMATED');
        }}
        title="Initiate Collateral Revaluation"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Revaluation Type</label>
            <Select
              value={revaluationType}
              onChange={(e) => setRevaluationType(e.target.value as RevaluationType)}
            >
              <option value="AUTOMATED">Automated</option>
              <option value="FULL_APPRAISAL">Full Appraisal</option>
              <option value="AUTOMATED_VALUATION_MODEL">AVM</option>
              <option value="MARKET_DATA">Market Data</option>
              <option value="MANUAL">Manual</option>
            </Select>
          </div>

          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setShowInitiateModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleInitiate} disabled={initiateRevaluation.isPending}>
              {initiateRevaluation.isPending ? 'Initiating...' : 'Initiate'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Update Modal */}
      <Modal
        isOpen={showUpdateModal}
        onClose={() => {
          setShowUpdateModal(false);
          setSelectedRevaluation(null);
          setNewValuation('');
          setValuationSource('');
          setValuationNotes('');
        }}
        title="Update Valuation"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">New Valuation Amount</label>
            <Input
              type="number"
              value={newValuation}
              onChange={(e) => setNewValuation(e.target.value)}
              placeholder="Enter new valuation"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Valuation Source</label>
            <Input
              value={valuationSource}
              onChange={(e) => setValuationSource(e.target.value)}
              placeholder="e.g., Appraiser Name, AVM Provider"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
            <Textarea
              value={valuationNotes}
              onChange={(e) => setValuationNotes(e.target.value)}
              placeholder="Additional notes about the valuation..."
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => {
                setShowUpdateModal(false);
                setSelectedRevaluation(null);
                setNewValuation('');
                setValuationSource('');
                setValuationNotes('');
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleUpdate} disabled={!newValuation || updateValuation.isPending}>
              {updateValuation.isPending ? 'Updating...' : 'Update Valuation'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Action Modal */}
      <Modal
        isOpen={showActionModal}
        onClose={() => {
          setShowActionModal(false);
          setSelectedRevaluation(null);
          setActionNotes('');
        }}
        title="Take Action on Under-Collateralized Loan"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Required Action</label>
            <Textarea
              value={actionNotes}
              onChange={(e) => setActionNotes(e.target.value)}
              placeholder="Describe the action taken for this under-collateralized loan..."
              rows={4}
            />
          </div>

          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => {
                setShowActionModal(false);
                setSelectedRevaluation(null);
                setActionNotes('');
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleTakeAction} disabled={!actionNotes || takeAction.isPending}>
              {takeAction.isPending ? 'Saving...' : 'Save Action'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

