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
  useReferralBonuses,
  useUpdateReferralBonusStatus,
} from '@/lib/hooks/useMarketing';
import {
  Gift,
  CheckCircle,
  XCircle,
  Clock,
  DollarSign,
  Edit,
  Filter,
} from 'lucide-react';
import { format } from 'date-fns';
import type { ReferralBonus } from '@/lib/api/marketing';

export function ReferralBonusManagement() {
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [selectedBonusType, setSelectedBonusType] = useState<string>('');
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedBonus, setSelectedBonus] = useState<ReferralBonus | null>(null);

  // Form states
  const [status, setStatus] = useState('Pending');
  const [creditNotes, setCreditNotes] = useState('');
  const [remarks, setRemarks] = useState('');

  const filters: any = {};
  if (selectedStatus) filters.status = selectedStatus;
  if (selectedBonusType) filters.bonusType = selectedBonusType;

  const { data: bonuses, isLoading, refetch } = useReferralBonuses(
    Object.keys(filters).length > 0 ? filters : undefined
  );
  const updateStatus = useUpdateReferralBonusStatus();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'Approved':
        return 'bg-blue-100 text-blue-800';
      case 'Credited':
        return 'bg-green-100 text-green-800';
      case 'Cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Credited':
        return <CheckCircle className="w-4 h-4" />;
      case 'Cancelled':
        return <XCircle className="w-4 h-4" />;
      case 'Pending':
        return <Clock className="w-4 h-4" />;
      default:
        return <CheckCircle className="w-4 h-4" />;
    }
  };

  const handleUpdateStatus = () => {
    if (!selectedBonus) return;

    updateStatus.mutate(
      {
        id: selectedBonus.id,
        dto: {
          status,
          creditNotes: creditNotes || undefined,
          remarks: remarks || undefined,
        },
      },
      {
        onSuccess: () => {
          setShowStatusModal(false);
          setSelectedBonus(null);
          resetForm();
          refetch();
        },
      }
    );
  };

  const resetForm = () => {
    setStatus('Pending');
    setCreditNotes('');
    setRemarks('');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Referral Bonus Management</h2>
          <p className="text-sm text-gray-600 mt-1">Manage and track referral bonuses</p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <div className="p-4">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <Select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                placeholder="Filter by status"
              >
                <option value="">All Statuses</option>
                <option value="Pending">Pending</option>
                <option value="Approved">Approved</option>
                <option value="Credited">Credited</option>
                <option value="Cancelled">Cancelled</option>
              </Select>
            </div>
            <div className="flex-1">
              <Select
                value={selectedBonusType}
                onChange={(e) => setSelectedBonusType(e.target.value)}
                placeholder="Filter by bonus type"
              >
                <option value="">All Types</option>
                <option value="Fixed Amount">Fixed Amount</option>
                <option value="Percentage">Percentage</option>
                <option value="Tiered">Tiered</option>
              </Select>
            </div>
            {(selectedStatus || selectedBonusType) && (
              <Button
                variant="outline"
                onClick={() => {
                  setSelectedStatus('');
                  setSelectedBonusType('');
                }}
              >
                <Filter className="w-4 h-4 mr-2" />
                Clear Filters
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* Bonuses List */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      ) : bonuses && bonuses.length > 0 ? (
        <div className="grid gap-4">
          {bonuses.map((bonus) => (
            <Card key={bonus.id}>
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">Bonus #{bonus.id.substring(0, 8)}</h3>
                      <Badge className={getStatusColor(bonus.status)}>
                        <span className="flex items-center gap-1">
                          {getStatusIcon(bonus.status)}
                          {bonus.status}
                        </span>
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600">Bonus Amount</p>
                        <p className="font-semibold text-lg flex items-center gap-1">
                          <DollarSign className="w-4 h-4" />
                          {bonus.bonusAmount.toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600">Bonus Type</p>
                        <p className="font-medium">{bonus.bonusType}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Referral ID</p>
                        <p className="font-medium text-xs">{bonus.referralId}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Created</p>
                        <p className="font-medium">{format(new Date(bonus.createdAt), 'MMM d, yyyy')}</p>
                      </div>
                    </div>
                    {bonus.creditedAt && (
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <div className="flex items-center gap-2 text-sm">
                          <CheckCircle className="w-4 h-4 text-green-600" />
                          <span className="text-gray-600">
                            Credited on {format(new Date(bonus.creditedAt), 'MMM d, yyyy')}
                          </span>
                          {bonus.creditedBy && (
                            <span className="text-gray-500">by {bonus.creditedBy.substring(0, 8)}</span>
                          )}
                        </div>
                      </div>
                    )}
                    {bonus.creditNotes && (
                      <div className="mt-2 text-sm text-gray-600">
                        <p className="font-medium">Credit Notes:</p>
                        <p>{bonus.creditNotes}</p>
                      </div>
                    )}
                    {bonus.remarks && (
                      <div className="mt-2 text-sm text-gray-600">
                        <p className="font-medium">Remarks:</p>
                        <p>{bonus.remarks}</p>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedBonus(bonus);
                        setStatus(bonus.status);
                        setCreditNotes(bonus.creditNotes || '');
                        setRemarks(bonus.remarks || '');
                        setShowStatusModal(true);
                      }}
                    >
                      <Edit className="w-4 h-4 mr-1" />
                      Update Status
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <div className="p-12 text-center">
            <Gift className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600">No bonuses found</p>
          </div>
        </Card>
      )}

      {/* Update Status Modal */}
      <Modal
        isOpen={showStatusModal}
        onClose={() => {
          setShowStatusModal(false);
          setSelectedBonus(null);
          resetForm();
        }}
        title="Update Bonus Status"
      >
        <div className="space-y-4">
          <Select label="Status" value={status} onChange={(e) => setStatus(e.target.value)} required>
            <option value="Pending">Pending</option>
            <option value="Approved">Approved</option>
            <option value="Credited">Credited</option>
            <option value="Cancelled">Cancelled</option>
          </Select>
          {status === 'Credited' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Credit Notes (Optional)</label>
              <Textarea
                value={creditNotes}
                onChange={(e) => setCreditNotes(e.target.value)}
                placeholder="Enter credit notes"
                rows={3}
              />
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Remarks (Optional)</label>
            <Textarea
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="Enter any remarks"
              rows={3}
            />
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setShowStatusModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateStatus} disabled={updateStatus.isPending}>
              {updateStatus.isPending ? 'Updating...' : 'Update Status'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

