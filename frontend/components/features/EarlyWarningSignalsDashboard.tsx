'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { Modal } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import {
  useDetectEarlyWarningSignals,
  useEarlyWarningSignals,
  useInvestigateSignal,
  useResolveSignal,
} from '@/lib/hooks/useRiskManagement';
import {
  AlertTriangle,
  Search,
  Eye,
  CheckCircle,
  Clock,
  RefreshCw,
  XCircle,
} from 'lucide-react';
import { format } from 'date-fns';
import type { SignalType, SignalSeverity, SignalStatus } from '@/lib/api/risk-management';

export function EarlyWarningSignalsDashboard() {
  const [selectedStatus, setSelectedStatus] = useState<SignalStatus | ''>('');
  const [selectedSeverity, setSelectedSeverity] = useState<SignalSeverity | ''>('');
  const [showInvestigateModal, setShowInvestigateModal] = useState(false);
  const [showResolveModal, setShowResolveModal] = useState(false);
  const [selectedSignal, setSelectedSignal] = useState<string | null>(null);
  const [investigationNotes, setInvestigationNotes] = useState('');
  const [resolutionNotes, setResolutionNotes] = useState('');

  const detectSignals = useDetectEarlyWarningSignals();
  const { data: signals, isLoading, refetch } = useEarlyWarningSignals({
    status: selectedStatus || undefined,
    severity: selectedSeverity || undefined,
  });
  const investigateSignal = useInvestigateSignal();
  const resolveSignal = useResolveSignal();

  const handleDetect = () => {
    detectSignals.mutate(
      {},
      {
        onSuccess: () => {
          refetch();
        },
      },
    );
  };

  const handleInvestigate = () => {
    if (!selectedSignal) return;

    investigateSignal.mutate(
      {
        id: selectedSignal,
        dto: {
          investigationNotes,
          requiresAction: true,
        },
      },
      {
        onSuccess: () => {
          setShowInvestigateModal(false);
          setSelectedSignal(null);
          setInvestigationNotes('');
          refetch();
        },
      },
    );
  };

  const handleResolve = () => {
    if (!selectedSignal) return;

    resolveSignal.mutate(
      {
        id: selectedSignal,
        dto: {
          resolutionNotes,
        },
      },
      {
        onSuccess: () => {
          setShowResolveModal(false);
          setSelectedSignal(null);
          setResolutionNotes('');
          refetch();
        },
      },
    );
  };

  const getSeverityColor = (severity: SignalSeverity) => {
    switch (severity) {
      case 'CRITICAL':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'HIGH':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'MEDIUM':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'LOW':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const activeSignals = signals?.filter((s) => s.status === 'ACTIVE').length || 0;
  const criticalSignals = signals?.filter((s) => s.severity === 'CRITICAL').length || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Early Warning Signals</h2>
          <p className="text-sm text-gray-600 mt-1">Monitor accounts for risk signals and payment patterns</p>
        </div>
        <div className="flex items-center gap-3">
          <Select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value as SignalStatus | '')}
            className="w-40"
          >
            <option value="">All Status</option>
            <option value="ACTIVE">Active</option>
            <option value="INVESTIGATING">Investigating</option>
            <option value="RESOLVED">Resolved</option>
            <option value="FALSE_POSITIVE">False Positive</option>
          </Select>
          <Select
            value={selectedSeverity}
            onChange={(e) => setSelectedSeverity(e.target.value as SignalSeverity | '')}
            className="w-40"
          >
            <option value="">All Severity</option>
            <option value="CRITICAL">Critical</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </Select>
          <Button onClick={handleDetect} disabled={detectSignals.isPending}>
            <RefreshCw className={`h-4 w-4 mr-2 ${detectSignals.isPending ? 'animate-spin' : ''}`} />
            Detect Signals
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <div className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Signals</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{signals?.length || 0}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-orange-600" />
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Signals</p>
                <p className="text-2xl font-bold text-orange-600 mt-1">{activeSignals}</p>
              </div>
              <Clock className="h-8 w-8 text-orange-600" />
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Critical</p>
                <p className="text-2xl font-bold text-red-600 mt-1">{criticalSignals}</p>
              </div>
              <XCircle className="h-8 w-8 text-red-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Signals Table */}
      <Card>
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Detected Signals</h3>

          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          ) : signals && signals.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Signal
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Loan ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Severity
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {signals.map((signal) => (
                    <tr key={signal.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{signal.title}</div>
                          <div className="text-sm text-gray-500">{signal.description}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{signal.loanId.substring(0, 8)}...</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge>{signal.signalType.replace(/_/g, ' ')}</Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge className={getSeverityColor(signal.severity)}>{signal.severity}</Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge>{signal.status}</Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {format(new Date(signal.signalDate), 'MMM dd, yyyy')}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center gap-2">
                          {signal.status === 'ACTIVE' && (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedSignal(signal.id);
                                  setShowInvestigateModal(true);
                                }}
                              >
                                <Eye className="h-4 w-4 mr-1" />
                                Investigate
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedSignal(signal.id);
                                  setShowResolveModal(true);
                                }}
                              >
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Resolve
                              </Button>
                            </>
                          )}
                          {signal.status === 'INVESTIGATING' && (
                            <span className="text-sm text-blue-600">Investigating...</span>
                          )}
                          {signal.status === 'RESOLVED' && (
                            <span className="text-sm text-green-600">Resolved</span>
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
              <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No early warning signals found</p>
              <p className="text-sm text-gray-500 mt-2">Click "Detect Signals" to scan for risk signals</p>
            </div>
          )}
        </div>
      </Card>

      {/* Investigate Modal */}
      <Modal
        isOpen={showInvestigateModal}
        onClose={() => {
          setShowInvestigateModal(false);
          setSelectedSignal(null);
          setInvestigationNotes('');
        }}
        title="Investigate Signal"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Investigation Notes
            </label>
            <Textarea
              value={investigationNotes}
              onChange={(e) => setInvestigationNotes(e.target.value)}
              placeholder="Document your investigation findings..."
              rows={4}
            />
          </div>

          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => {
                setShowInvestigateModal(false);
                setSelectedSignal(null);
                setInvestigationNotes('');
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleInvestigate}
              disabled={!investigationNotes || investigateSignal.isPending}
            >
              {investigateSignal.isPending ? 'Saving...' : 'Save Investigation'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Resolve Modal */}
      <Modal
        isOpen={showResolveModal}
        onClose={() => {
          setShowResolveModal(false);
          setSelectedSignal(null);
          setResolutionNotes('');
        }}
        title="Resolve Signal"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Resolution Notes</label>
            <Textarea
              value={resolutionNotes}
              onChange={(e) => setResolutionNotes(e.target.value)}
              placeholder="Document how the signal was resolved..."
              rows={4}
            />
          </div>

          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => {
                setShowResolveModal(false);
                setSelectedSignal(null);
                setResolutionNotes('');
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleResolve} disabled={!resolutionNotes || resolveSignal.isPending}>
              {resolveSignal.isPending ? 'Saving...' : 'Resolve Signal'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

