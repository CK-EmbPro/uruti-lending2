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
  useCreateRetentionRecord,
  useDocumentRetentions,
  usePlaceLegalHold,
  useReleaseLegalHold,
  useArchiveDocument,
  usePurgeDocument,
} from '@/lib/hooks/useCompliance';
import {
  Archive,
  Shield,
  AlertTriangle,
  Clock,
  CheckCircle,
  Trash2,
  Plus,
  Lock,
  Unlock,
} from 'lucide-react';
import { format } from 'date-fns';
import type { RetentionCategory, RetentionStatus, HoldType } from '@/lib/api/compliance';

export function DocumentRetentionDashboard() {
  const [selectedStatus, setSelectedStatus] = useState<RetentionStatus | ''>('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showHoldModal, setShowHoldModal] = useState(false);
  const [showArchiveModal, setShowArchiveModal] = useState(false);
  const [showPurgeModal, setShowPurgeModal] = useState(false);
  const [selectedRetention, setSelectedRetention] = useState<string | null>(null);
  const [retentionCategory, setRetentionCategory] = useState<RetentionCategory>('LOAN_DOCUMENTS');
  const [retentionPeriod, setRetentionPeriod] = useState('7');
  const [documentDate, setDocumentDate] = useState('');
  const [holdType, setHoldType] = useState<HoldType>('LITIGATION');
  const [holdReason, setHoldReason] = useState('');
  const [archiveLocation, setArchiveLocation] = useState('');
  const [purgeConfirmation, setPurgeConfirmation] = useState('');

  const createRetention = useCreateRetentionRecord();
  const { data: retentions, isLoading, refetch } = useDocumentRetentions({
    status: selectedStatus || undefined,
  });
  const placeHold = usePlaceLegalHold();
  const releaseHold = useReleaseLegalHold();
  const archiveDoc = useArchiveDocument();
  const purgeDoc = usePurgeDocument();

  const handleCreate = () => {
    if (!documentDate) return;

    createRetention.mutate(
      {
        retentionCategory,
        documentDate,
        retentionPeriodYears: parseInt(retentionPeriod),
      },
      {
        onSuccess: () => {
          setShowCreateModal(false);
          setRetentionCategory('LOAN_DOCUMENTS');
          setRetentionPeriod('7');
          setDocumentDate('');
          refetch();
        },
      },
    );
  };

  const handlePlaceHold = () => {
    if (!selectedRetention) return;

    placeHold.mutate(
      {
        id: selectedRetention,
        dto: {
          holdType,
          holdReason,
        },
      },
      {
        onSuccess: () => {
          setShowHoldModal(false);
          setSelectedRetention(null);
          setHoldReason('');
          refetch();
        },
      },
    );
  };

  const handleReleaseHold = (id: string) => {
    releaseHold.mutate(
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

  const handleArchive = () => {
    if (!selectedRetention) return;

    archiveDoc.mutate(
      {
        id: selectedRetention,
        dto: {
          archiveLocation,
        },
      },
      {
        onSuccess: () => {
          setShowArchiveModal(false);
          setSelectedRetention(null);
          setArchiveLocation('');
          refetch();
        },
      },
    );
  };

  const handlePurge = () => {
    if (!selectedRetention) return;

    purgeDoc.mutate(
      {
        id: selectedRetention,
        dto: {
          purgeConfirmation,
        },
      },
      {
        onSuccess: () => {
          setShowPurgeModal(false);
          setSelectedRetention(null);
          setPurgeConfirmation('');
          refetch();
        },
      },
    );
  };

  const getStatusColor = (status: RetentionStatus) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-100 text-green-800';
      case 'ARCHIVED':
        return 'bg-blue-100 text-blue-800';
      case 'PENDING_PURGE':
        return 'bg-yellow-100 text-yellow-800';
      case 'PURGED':
        return 'bg-gray-100 text-gray-800';
      case 'LEGAL_HOLD':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const activeCount = retentions?.filter((r) => r.status === 'ACTIVE').length || 0;
  const onHoldCount = retentions?.filter((r) => r.onLegalHold).length || 0;
  const pendingPurgeCount = retentions?.filter((r) => r.status === 'PENDING_PURGE').length || 0;

  const now = new Date();
  const expiringSoon = retentions?.filter((r) => {
    const expiry = new Date(r.retentionExpiryDate);
    const daysUntilExpiry = Math.floor((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return daysUntilExpiry <= 30 && daysUntilExpiry > 0 && r.status === 'ACTIVE';
  }).length || 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Document Retention Management</h2>
          <p className="text-sm text-gray-600 mt-1">Manage document retention periods and legal holds</p>
        </div>
        <div className="flex items-center gap-3">
          <Select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value as RetentionStatus | '')}
            className="w-40"
          >
            <option value="">All Status</option>
            <option value="ACTIVE">Active</option>
            <option value="ARCHIVED">Archived</option>
            <option value="PENDING_PURGE">Pending Purge</option>
            <option value="LEGAL_HOLD">Legal Hold</option>
            <option value="PURGED">Purged</option>
          </Select>
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Record
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                <p className="text-sm text-gray-600">On Legal Hold</p>
                <p className="text-2xl font-bold text-red-600 mt-1">{onHoldCount}</p>
              </div>
              <Lock className="h-8 w-8 text-red-600" />
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending Purge</p>
                <p className="text-2xl font-bold text-yellow-600 mt-1">{pendingPurgeCount}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-600" />
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Expiring Soon</p>
                <p className="text-2xl font-bold text-orange-600 mt-1">{expiringSoon}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-orange-600" />
            </div>
          </div>
        </Card>
      </div>

      <Card>
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Retention Records</h3>

          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          ) : retentions && retentions.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Document Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Retention Period
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Expiry Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Legal Hold
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {retentions.map((retention) => {
                    const expiryDate = new Date(retention.retentionExpiryDate);
                    const isExpired = expiryDate < now;
                    const daysUntilExpiry = Math.floor((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

                    return (
                      <tr key={retention.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge>{retention.retentionCategory.replace(/_/g, ' ')}</Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {format(new Date(retention.documentDate), 'MMM dd, yyyy')}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{retention.retentionPeriodYears} years</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className={`text-sm font-medium ${isExpired ? 'text-red-600' : daysUntilExpiry <= 30 ? 'text-orange-600' : 'text-gray-900'}`}>
                              {format(expiryDate, 'MMM dd, yyyy')}
                            </div>
                            {isExpired && <div className="text-xs text-red-600">Expired</div>}
                            {!isExpired && daysUntilExpiry <= 30 && (
                              <div className="text-xs text-orange-600">{daysUntilExpiry} days left</div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge className={getStatusColor(retention.status)}>{retention.status}</Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {retention.onLegalHold ? (
                            <div className="flex items-center gap-2 text-red-600">
                              <Lock className="h-4 w-4" />
                              <span className="text-sm">On Hold</span>
                            </div>
                          ) : (
                            <span className="text-sm text-gray-400">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center gap-2">
                            {!retention.onLegalHold && retention.status === 'ACTIVE' && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedRetention(retention.id);
                                  setShowHoldModal(true);
                                }}
                              >
                                <Lock className="h-4 w-4 mr-1" />
                                Place Hold
                              </Button>
                            )}
                            {retention.onLegalHold && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleReleaseHold(retention.id)}
                              >
                                <Unlock className="h-4 w-4 mr-1" />
                                Release
                              </Button>
                            )}
                            {retention.status === 'ACTIVE' && !retention.archived && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedRetention(retention.id);
                                  setShowArchiveModal(true);
                                }}
                              >
                                <Archive className="h-4 w-4 mr-1" />
                                Archive
                              </Button>
                            )}
                            {retention.status === 'PENDING_PURGE' && !retention.onLegalHold && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedRetention(retention.id);
                                  setShowPurgeModal(true);
                                }}
                              >
                                <Trash2 className="h-4 w-4 mr-1" />
                                Purge
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <Archive className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No retention records found</p>
            </div>
          )}
        </div>
      </Card>

      {/* Create Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          setRetentionCategory('LOAN_DOCUMENTS');
          setRetentionPeriod('7');
          setDocumentDate('');
        }}
        title="Create Retention Record"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Retention Category</label>
            <Select
              value={retentionCategory}
              onChange={(e) => setRetentionCategory(e.target.value as RetentionCategory)}
            >
              <option value="LOAN_DOCUMENTS">Loan Documents</option>
              <option value="KYC_DOCUMENTS">KYC Documents</option>
              <option value="FINANCIAL_STATEMENTS">Financial Statements</option>
              <option value="LEGAL_DOCUMENTS">Legal Documents</option>
              <option value="COMMUNICATION">Communication</option>
              <option value="AUDIT_RECORDS">Audit Records</option>
              <option value="COMPLIANCE_RECORDS">Compliance Records</option>
              <option value="OTHER">Other</option>
            </Select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Document Date</label>
            <Input
              type="date"
              value={documentDate}
              onChange={(e) => setDocumentDate(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Retention Period (Years)</label>
            <Input
              type="number"
              value={retentionPeriod}
              onChange={(e) => setRetentionPeriod(e.target.value)}
              placeholder="7"
            />
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setShowCreateModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={!documentDate || createRetention.isPending}>
              {createRetention.isPending ? 'Creating...' : 'Create'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Place Hold Modal */}
      <Modal
        isOpen={showHoldModal}
        onClose={() => {
          setShowHoldModal(false);
          setSelectedRetention(null);
          setHoldReason('');
        }}
        title="Place Legal Hold"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Hold Type</label>
            <Select value={holdType} onChange={(e) => setHoldType(e.target.value as HoldType)}>
              <option value="LITIGATION">Litigation</option>
              <option value="REGULATORY_EXAMINATION">Regulatory Examination</option>
              <option value="INVESTIGATION">Investigation</option>
              <option value="CUSTOM">Custom</option>
            </Select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Hold Reason</label>
            <Textarea
              value={holdReason}
              onChange={(e) => setHoldReason(e.target.value)}
              placeholder="Explain why this document is on legal hold..."
              rows={4}
            />
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setShowHoldModal(false)}>
              Cancel
            </Button>
            <Button onClick={handlePlaceHold} disabled={!holdReason || placeHold.isPending}>
              {placeHold.isPending ? 'Placing...' : 'Place Hold'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Archive Modal */}
      <Modal
        isOpen={showArchiveModal}
        onClose={() => {
          setShowArchiveModal(false);
          setSelectedRetention(null);
          setArchiveLocation('');
        }}
        title="Archive Document"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Archive Location</label>
            <Input
              value={archiveLocation}
              onChange={(e) => setArchiveLocation(e.target.value)}
              placeholder="e.g., Archive-2024, S3-bucket-name, etc."
            />
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setShowArchiveModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleArchive} disabled={!archiveLocation || archiveDoc.isPending}>
              {archiveDoc.isPending ? 'Archiving...' : 'Archive'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Purge Modal */}
      <Modal
        isOpen={showPurgeModal}
        onClose={() => {
          setShowPurgeModal(false);
          setSelectedRetention(null);
          setPurgeConfirmation('');
        }}
        title="Purge Document"
      >
        <div className="space-y-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-medium text-red-900 mb-1">Warning: Irreversible Action</h4>
                <p className="text-sm text-red-700">
                  Purging a document is permanent and cannot be undone. Please confirm by typing "PURGE" below.
                </p>
              </div>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Confirmation</label>
            <Input
              value={purgeConfirmation}
              onChange={(e) => setPurgeConfirmation(e.target.value)}
              placeholder="Type PURGE to confirm"
            />
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setShowPurgeModal(false)}>
              Cancel
            </Button>
            <Button
              onClick={handlePurge}
              disabled={purgeConfirmation !== 'PURGE' || purgeDoc.isPending}
              variant="danger"
            >
              {purgeDoc.isPending ? 'Purging...' : 'Purge Document'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

