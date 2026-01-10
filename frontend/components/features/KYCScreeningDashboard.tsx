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
  usePerformScreening,
  useKYCScreenings,
  useInvestigateMatch,
  useFileSAR,
  useResolveScreening,
} from '@/lib/hooks/useCompliance';
import {
  Shield,
  AlertTriangle,
  Search,
  FileText,
  CheckCircle,
  XCircle,
  RefreshCw,
} from 'lucide-react';
import { format } from 'date-fns';
import type { ScreeningType, ScreeningStatus, MatchSeverity } from '@/lib/api/compliance';

export function KYCScreeningDashboard() {
  const [selectedStatus, setSelectedStatus] = useState<ScreeningStatus | ''>('');
  const [showInvestigateModal, setShowInvestigateModal] = useState(false);
  const [showSARModal, setShowSARModal] = useState(false);
  const [showResolveModal, setShowResolveModal] = useState(false);
  const [selectedScreening, setSelectedScreening] = useState<string | null>(null);
  const [investigationNotes, setInvestigationNotes] = useState('');
  const [requiresSAR, setRequiresSAR] = useState(false);
  const [sarReference, setSarReference] = useState('');
  const [sarNotes, setSarNotes] = useState('');
  const [resolutionNotes, setResolutionNotes] = useState('');

  const performScreening = usePerformScreening();
  const { data: screenings, isLoading, refetch } = useKYCScreenings({
    status: selectedStatus || undefined,
  });
  const investigateMatch = useInvestigateMatch();
  const fileSAR = useFileSAR();
  const resolveScreening = useResolveScreening();

  const handleInvestigate = () => {
    if (!selectedScreening) return;

    investigateMatch.mutate(
      {
        id: selectedScreening,
        dto: {
          investigationNotes,
          requiresSAR,
        },
      },
      {
        onSuccess: () => {
          setShowInvestigateModal(false);
          setSelectedScreening(null);
          setInvestigationNotes('');
          setRequiresSAR(false);
          refetch();
        },
      },
    );
  };

  const handleFileSAR = () => {
    if (!selectedScreening) return;

    fileSAR.mutate(
      {
        id: selectedScreening,
        dto: {
          sarReference,
          sarNotes,
        },
      },
      {
        onSuccess: () => {
          setShowSARModal(false);
          setSelectedScreening(null);
          setSarReference('');
          setSarNotes('');
          refetch();
        },
      },
    );
  };

  const handleResolve = () => {
    if (!selectedScreening) return;

    resolveScreening.mutate(
      {
        id: selectedScreening,
        dto: {
          resolutionNotes,
        },
      },
      {
        onSuccess: () => {
          setShowResolveModal(false);
          setSelectedScreening(null);
          setResolutionNotes('');
          refetch();
        },
      },
    );
  };

  const getSeverityColor = (severity?: MatchSeverity) => {
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

  const getStatusColor = (status: ScreeningStatus) => {
    switch (status) {
      case 'CLEARED':
        return 'bg-green-100 text-green-800';
      case 'FLAGGED':
        return 'bg-red-100 text-red-800';
      case 'SAR_FILED':
        return 'bg-purple-100 text-purple-800';
      case 'IN_PROGRESS':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const flaggedCount = screenings?.filter((s) => s.status === 'FLAGGED').length || 0;
  const sarFiledCount = screenings?.filter((s) => s.sarFiled).length || 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">KYC/AML Screening</h2>
          <p className="text-sm text-gray-600 mt-1">Screen applications against sanctions lists and PEP databases</p>
        </div>
        <div className="flex items-center gap-3">
          <Select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value as ScreeningStatus | '')}
            className="w-40"
          >
            <option value="">All Status</option>
            <option value="PENDING">Pending</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="FLAGGED">Flagged</option>
            <option value="CLEARED">Cleared</option>
            <option value="SAR_FILED">SAR Filed</option>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <div className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Screenings</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{screenings?.length || 0}</p>
              </div>
              <Shield className="h-8 w-8 text-blue-600" />
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Flagged</p>
                <p className="text-2xl font-bold text-red-600 mt-1">{flaggedCount}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">SAR Filed</p>
                <p className="text-2xl font-bold text-purple-600 mt-1">{sarFiledCount}</p>
              </div>
              <FileText className="h-8 w-8 text-purple-600" />
            </div>
          </div>
        </Card>
      </div>

      <Card>
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Screening Records</h3>

          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          ) : screenings && screenings.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Application
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
                      Matches
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {screenings.map((screening) => (
                    <tr key={screening.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{screening.applicationId.substring(0, 8)}...</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge>{screening.screeningType}</Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {format(new Date(screening.screeningDate), 'MMM dd, yyyy')}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge className={getStatusColor(screening.status)}>{screening.status}</Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {screening.matchFound ? (
                          <div>
                            <div className="text-sm font-medium text-red-600">{screening.matchCount} matches</div>
                            {screening.matchSeverity && (
                              <Badge className={getSeverityColor(screening.matchSeverity)} size="sm">
                                {screening.matchSeverity}
                              </Badge>
                            )}
                          </div>
                        ) : (
                          <span className="text-sm text-green-600">No matches</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center gap-2">
                          {screening.status === 'FLAGGED' && (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedScreening(screening.id);
                                  setShowInvestigateModal(true);
                                }}
                              >
                                <Search className="h-4 w-4 mr-1" />
                                Investigate
                              </Button>
                              {screening.requiresSAR && !screening.sarFiled && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedScreening(screening.id);
                                    setShowSARModal(true);
                                  }}
                                >
                                  <FileText className="h-4 w-4 mr-1" />
                                  File SAR
                                </Button>
                              )}
                            </>
                          )}
                          {screening.status === 'IN_PROGRESS' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedScreening(screening.id);
                                setShowResolveModal(true);
                              }}
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Resolve
                            </Button>
                          )}
                          {screening.status === 'CLEARED' && (
                            <span className="text-sm text-green-600">Cleared</span>
                          )}
                          {screening.sarFiled && (
                            <span className="text-sm text-purple-600">SAR Filed</span>
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
              <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No KYC screenings found</p>
            </div>
          )}
        </div>
      </Card>

      {/* Investigate Modal */}
      <Modal
        isOpen={showInvestigateModal}
        onClose={() => {
          setShowInvestigateModal(false);
          setSelectedScreening(null);
          setInvestigationNotes('');
          setRequiresSAR(false);
        }}
        title="Investigate Match"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Investigation Notes</label>
            <Textarea
              value={investigationNotes}
              onChange={(e) => setInvestigationNotes(e.target.value)}
              placeholder="Document your investigation findings..."
              rows={4}
            />
          </div>
          <div className="flex items-center">
            <input
              type="checkbox"
              id="requiresSAR"
              checked={requiresSAR}
              onChange={(e) => setRequiresSAR(e.target.checked)}
              className="mr-2"
            />
            <label htmlFor="requiresSAR" className="text-sm text-gray-700">
              Requires SAR filing
            </label>
          </div>
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => {
                setShowInvestigateModal(false);
                setSelectedScreening(null);
                setInvestigationNotes('');
                setRequiresSAR(false);
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleInvestigate} disabled={!investigationNotes || investigateMatch.isPending}>
              {investigateMatch.isPending ? 'Saving...' : 'Save Investigation'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* SAR Modal */}
      <Modal
        isOpen={showSARModal}
        onClose={() => {
          setShowSARModal(false);
          setSelectedScreening(null);
          setSarReference('');
          setSarNotes('');
        }}
        title="File Suspicious Activity Report"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">SAR Reference Number</label>
            <Input
              value={sarReference}
              onChange={(e) => setSarReference(e.target.value)}
              placeholder="Enter SAR reference number"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">SAR Notes</label>
            <Textarea
              value={sarNotes}
              onChange={(e) => setSarNotes(e.target.value)}
              placeholder="Additional notes about the SAR..."
              rows={3}
            />
          </div>
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => {
                setShowSARModal(false);
                setSelectedScreening(null);
                setSarReference('');
                setSarNotes('');
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleFileSAR} disabled={!sarReference || fileSAR.isPending}>
              {fileSAR.isPending ? 'Filing...' : 'File SAR'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Resolve Modal */}
      <Modal
        isOpen={showResolveModal}
        onClose={() => {
          setShowResolveModal(false);
          setSelectedScreening(null);
          setResolutionNotes('');
        }}
        title="Resolve Screening"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Resolution Notes</label>
            <Textarea
              value={resolutionNotes}
              onChange={(e) => setResolutionNotes(e.target.value)}
              placeholder="Document how the screening was resolved..."
              rows={4}
            />
          </div>
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => {
                setShowResolveModal(false);
                setSelectedScreening(null);
                setResolutionNotes('');
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleResolve} disabled={!resolutionNotes || resolveScreening.isPending}>
              {resolveScreening.isPending ? 'Resolving...' : 'Resolve'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

