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
  useCheckSLABreaches,
  useEscalateSLA,
  useSLATrackings,
} from '@/lib/hooks/useWorkflowException';
import {
  AlertCircle,
  Clock,
  CheckCircle,
  XCircle,
  RefreshCw,
  ArrowUp,
} from 'lucide-react';
import { format } from 'date-fns';
import {
  SLAStatus,
  type SLATracking,
  type EscalateSLADto,
} from '@/lib/api/workflow-exception';

export function SLATrackingDashboard() {
  const [selectedStatus, setSelectedStatus] = useState<SLAStatus | ''>('');
  const [showEscalateModal, setShowEscalateModal] = useState(false);
  const [selectedSLA, setSelectedSLA] = useState<SLATracking | null>(null);
  const [escalatedTo, setEscalatedTo] = useState('');
  const [escalationReason, setEscalationReason] = useState('');

  const checkBreaches = useCheckSLABreaches();
  const escalateSLA = useEscalateSLA();
  const { data: slaTrackings, isLoading, refetch } = useSLATrackings({
    status: selectedStatus || undefined,
  });

  const slaArray = Array.isArray(slaTrackings) ? slaTrackings : [];

  const handleEscalate = () => {
    if (!selectedSLA) return;

    const dto: EscalateSLADto = {
      escalatedTo,
      escalationReason,
    };

    escalateSLA.mutate(
      { id: selectedSLA.id, dto },
      {
        onSuccess: () => {
          setShowEscalateModal(false);
          setSelectedSLA(null);
          setEscalatedTo('');
          setEscalationReason('');
        },
      },
    );
  };

  const getStatusColor = (status: SLAStatus) => {
    switch (status) {
      case SLAStatus.BREACHED:
        return 'bg-red-100 text-red-800';
      case SLAStatus.AT_RISK:
        return 'bg-yellow-100 text-yellow-800';
      case SLAStatus.COMPLETED:
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  const onTrackCount = slaArray.filter((sla) => sla.status === SLAStatus.ON_TRACK).length;
  const atRiskCount = slaArray.filter((sla) => sla.status === SLAStatus.AT_RISK).length;
  const breachedCount = slaArray.filter((sla) => sla.breached).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">SLA Tracking</h2>
          <p className="text-sm text-gray-600 mt-1">Monitor SLA compliance and breach alerts</p>
        </div>
        <div className="flex items-center gap-3">
          <Select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value as SLAStatus | '')}
            className="w-40"
          >
            <option value="">All Status</option>
            {Object.values(SLAStatus).map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </Select>
          <Button
            variant="outline"
            onClick={() => {
              checkBreaches.mutate(undefined, {
                onSuccess: () => {
                  refetch();
                },
              });
            }}
            disabled={checkBreaches.isPending}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${checkBreaches.isPending ? 'animate-spin' : ''}`} />
            Check Breaches
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <div className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">On Track</p>
                <p className="text-2xl font-bold text-blue-600 mt-1">{onTrackCount}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-blue-600" />
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">At Risk</p>
                <p className="text-2xl font-bold text-yellow-600 mt-1">{atRiskCount}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-600" />
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Breached</p>
                <p className="text-2xl font-bold text-red-600 mt-1">{breachedCount}</p>
              </div>
              <AlertCircle className="h-8 w-8 text-red-600" />
            </div>
          </div>
        </Card>
      </div>

      <Card>
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">SLA Trackings</h3>

          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          ) : slaArray.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Task
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      SLA Hours
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Due Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Assigned To
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Breach Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {slaArray.map((sla) => (
                    <tr key={sla.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">{sla.taskTitle}</div>
                        <div className="text-sm text-gray-500">Task ID: {sla.taskId.substring(0, 8)}...</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge className={getStatusColor(sla.status)}>{sla.status}</Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{sla.slaHours} hours</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {format(new Date(sla.slaDueDate), 'MMM dd, yyyy HH:mm')}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{sla.assignedToName || 'Unassigned'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {sla.breached ? (
                          <div className="flex items-center gap-2">
                            <XCircle className="h-5 w-5 text-red-600" />
                            <span className="text-sm text-red-600">
                              Breached {sla.breachMinutes ? `(${sla.breachMinutes} min)` : ''}
                            </span>
                          </div>
                        ) : (
                          <CheckCircle className="h-5 w-5 text-green-600" />
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        {sla.breached && !sla.escalatedTo && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedSLA(sla);
                              setShowEscalateModal(true);
                            }}
                          >
                            <ArrowUp className="h-4 w-4 mr-1" />
                            Escalate
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No SLA trackings found</p>
            </div>
          )}
        </div>
      </Card>

      {/* Escalate SLA Modal */}
      <Modal
        isOpen={showEscalateModal}
        onClose={() => {
          setShowEscalateModal(false);
          setSelectedSLA(null);
          setEscalatedTo('');
          setEscalationReason('');
        }}
        title="Escalate SLA"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Escalate To (User ID) *</label>
            <Input
              value={escalatedTo}
              onChange={(e) => setEscalatedTo(e.target.value)}
              placeholder="Supervisor/Manager User ID"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Escalation Reason *</label>
            <Textarea
              value={escalationReason}
              onChange={(e) => setEscalationReason(e.target.value)}
              placeholder="Reason for escalation"
              rows={4}
            />
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setShowEscalateModal(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleEscalate}
              disabled={!escalatedTo || !escalationReason || escalateSLA.isPending}
            >
              {escalateSLA.isPending ? 'Escalating...' : 'Escalate SLA'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

