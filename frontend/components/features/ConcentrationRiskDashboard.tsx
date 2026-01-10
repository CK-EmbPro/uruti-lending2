'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { Modal } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Select';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import {
  useAssessConcentrationRisk,
  useConcentrationRisks,
  useTakeCorrectiveAction,
} from '@/lib/hooks/useRiskManagement';
import {
  AlertTriangle,
  TrendingUp,
  DollarSign,
  CheckCircle,
  XCircle,
  RefreshCw,
  FileText,
} from 'lucide-react';
import { format } from 'date-fns';
import type { ConcentrationType, RiskLevel } from '@/lib/api/risk-management';

export function ConcentrationRiskDashboard() {
  const [selectedType, setSelectedType] = useState<ConcentrationType>('PRODUCT');
  const [showActionModal, setShowActionModal] = useState(false);
  const [selectedRisk, setSelectedRisk] = useState<string | null>(null);
  const [actionNotes, setActionNotes] = useState('');

  const assessRisk = useAssessConcentrationRisk();
  const { data: risks, isLoading, refetch } = useConcentrationRisks({
    concentrationType: selectedType,
  });
  const takeAction = useTakeCorrectiveAction();

  const handleAssess = () => {
    assessRisk.mutate(
      {
        concentrationType: selectedType,
        includeLoanBreakdown: true,
      },
      {
        onSuccess: () => {
          refetch();
        },
      },
    );
  };

  const handleTakeAction = () => {
    if (!selectedRisk) return;

    takeAction.mutate(
      {
        id: selectedRisk,
        dto: {
          correctiveAction: actionNotes,
        },
      },
      {
        onSuccess: () => {
          setShowActionModal(false);
          setSelectedRisk(null);
          setActionNotes('');
          refetch();
        },
      },
    );
  };

  const getRiskLevelColor = (level: RiskLevel) => {
    switch (level) {
      case 'CRITICAL':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'HIGH':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'MEDIUM':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'LOW':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const totalExposure = risks?.reduce((sum, r) => sum + r.totalExposure, 0) || 0;
  const totalPortfolio = risks?.[0]?.portfolioTotal || 0;
  const limitExceededCount = risks?.filter((r) => r.limitExceeded).length || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Concentration Risk Monitoring</h2>
          <p className="text-sm text-gray-600 mt-1">Monitor portfolio concentration by segment</p>
        </div>
        <div className="flex items-center gap-3">
          <Select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value as ConcentrationType)}
            className="w-48"
          >
            <option value="PRODUCT">By Product</option>
            <option value="GEOGRAPHY">By Geography</option>
            <option value="INDUSTRY">By Industry</option>
            <option value="CUSTOMER">By Customer</option>
            <option value="SECTOR">By Sector</option>
          </Select>
          <Button onClick={handleAssess} disabled={assessRisk.isPending}>
            <RefreshCw className={`h-4 w-4 mr-2 ${assessRisk.isPending ? 'animate-spin' : ''}`} />
            Assess Risk
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <div className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Exposure</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  ${(totalExposure / 1000000).toFixed(2)}M
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-blue-600" />
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Portfolio Total</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  ${(totalPortfolio / 1000000).toFixed(2)}M
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Segments</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{risks?.length || 0}</p>
              </div>
              <FileText className="h-8 w-8 text-purple-600" />
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Limits Exceeded</p>
                <p className="text-2xl font-bold text-red-600 mt-1">{limitExceededCount}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Risk Table */}
      <Card>
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Concentration Risk Assessment</h3>

          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : risks && risks.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Segment
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Exposure
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Concentration
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Limit
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Risk Level
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
                  {risks.map((risk) => (
                    <tr key={risk.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{risk.segmentName}</div>
                          <div className="text-sm text-gray-500">{risk.segmentIdentifier}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          ${(risk.totalExposure / 1000).toFixed(0)}K
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {risk.concentrationPercentage.toFixed(2)}%
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {risk.limitPercentage ? `${risk.limitPercentage}%` : 'N/A'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge className={getRiskLevelColor(risk.riskLevel)}>{risk.riskLevel}</Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {risk.limitExceeded ? (
                          <div className="flex items-center gap-2">
                            <XCircle className="h-4 w-4 text-red-600" />
                            <span className="text-sm text-red-600">Exceeded</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-green-600" />
                            <span className="text-sm text-green-600">Within Limit</span>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        {risk.limitExceeded && !risk.actionTaken && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedRisk(risk.id);
                              setShowActionModal(true);
                            }}
                          >
                            Take Action
                          </Button>
                        )}
                        {risk.actionTaken && (
                          <span className="text-sm text-gray-500">Action Taken</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No concentration risk assessments found</p>
              <p className="text-sm text-gray-500 mt-2">Click "Assess Risk" to generate an assessment</p>
            </div>
          )}
        </div>
      </Card>

      {/* Action Modal */}
      <Modal
        isOpen={showActionModal}
        onClose={() => {
          setShowActionModal(false);
          setSelectedRisk(null);
          setActionNotes('');
        }}
        title="Take Corrective Action"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Corrective Action
            </label>
            <Textarea
              value={actionNotes}
              onChange={(e) => setActionNotes(e.target.value)}
              placeholder="Describe the corrective action taken..."
              rows={4}
            />
          </div>

          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => {
                setShowActionModal(false);
                setSelectedRisk(null);
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

