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
  useReferrals,
  useCreateReferral,
  useUpdateReferralStatus,
  useCreditReferralBonus,
  useReferralBonusesByReferral,
} from '@/lib/hooks/useMarketing';
import {
  UserPlus,
  Gift,
  CheckCircle,
  XCircle,
  Clock,
  DollarSign,
  Eye,
  Edit,
  TrendingUp,
} from 'lucide-react';
import { format } from 'date-fns';
import type { Referral, ReferralBonus } from '@/lib/api/marketing';

export function ReferralManagement() {
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showBonusModal, setShowBonusModal] = useState(false);
  const [showBonusesModal, setShowBonusesModal] = useState(false);
  const [selectedReferral, setSelectedReferral] = useState<Referral | null>(null);

  // Form states
  const [referrerId, setReferrerId] = useState('');
  const [referredCustomerId, setReferredCustomerId] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [remarks, setRemarks] = useState('');
  const [status, setStatus] = useState('Pending');
  const [applicationId, setApplicationId] = useState('');
  const [loanId, setLoanId] = useState('');
  const [bonusAmount, setBonusAmount] = useState('');
  const [bonusType, setBonusType] = useState('Fixed Amount');
  const [creditNotes, setCreditNotes] = useState('');

  const { data: referrals, isLoading, refetch } = useReferrals(
    selectedStatus ? { status: selectedStatus } : undefined
  );
  const createReferral = useCreateReferral();
  const updateStatus = useUpdateReferralStatus();
  const creditBonus = useCreditReferralBonus();
  const { data: bonuses } = useReferralBonusesByReferral(selectedReferral?.id || '', {});

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'Applied':
        return 'bg-blue-100 text-blue-800';
      case 'Approved':
        return 'bg-green-100 text-green-800';
      case 'Disbursed':
        return 'bg-purple-100 text-purple-800';
      case 'Completed':
        return 'bg-green-200 text-green-900';
      case 'Cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleCreate = () => {
    createReferral.mutate(
      {
        referrerId,
        referredCustomerId,
        referralCode: referralCode || undefined,
        remarks: remarks || undefined,
      },
      {
        onSuccess: () => {
          setShowCreateModal(false);
          resetCreateForm();
          refetch();
        },
      }
    );
  };

  const handleUpdateStatus = () => {
    if (!selectedReferral) return;

    updateStatus.mutate(
      {
        id: selectedReferral.id,
        dto: {
          status,
          applicationId: applicationId || undefined,
          loanId: loanId || undefined,
          remarks: remarks || undefined,
        },
      },
      {
        onSuccess: () => {
          setShowStatusModal(false);
          setSelectedReferral(null);
          resetStatusForm();
          refetch();
        },
      }
    );
  };

  const handleCreditBonus = () => {
    if (!selectedReferral) return;

    creditBonus.mutate(
      {
        referralId: selectedReferral.id,
        dto: {
          bonusAmount: parseFloat(bonusAmount),
          bonusType,
          creditNotes: creditNotes || undefined,
          remarks: remarks || undefined,
        },
      },
      {
        onSuccess: () => {
          setShowBonusModal(false);
          setSelectedReferral(null);
          resetBonusForm();
          refetch();
        },
      }
    );
  };

  const resetCreateForm = () => {
    setReferrerId('');
    setReferredCustomerId('');
    setReferralCode('');
    setRemarks('');
  };

  const resetStatusForm = () => {
    setStatus('Pending');
    setApplicationId('');
    setLoanId('');
    setRemarks('');
  };

  const resetBonusForm = () => {
    setBonusAmount('');
    setBonusType('Fixed Amount');
    setCreditNotes('');
    setRemarks('');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Referral Management</h2>
          <p className="text-sm text-gray-600 mt-1">Manage customer referrals and bonuses</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <UserPlus className="w-4 h-4 mr-2" />
          Create Referral
        </Button>
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
                <option value="Applied">Applied</option>
                <option value="Approved">Approved</option>
                <option value="Disbursed">Disbursed</option>
                <option value="Completed">Completed</option>
                <option value="Cancelled">Cancelled</option>
              </Select>
            </div>
          </div>
        </div>
      </Card>

      {/* Referrals List */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      ) : referrals && referrals.length > 0 ? (
        <div className="grid gap-4">
          {referrals.map((referral) => (
            <Card key={referral.id}>
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">Referral Code: {referral.referralCode}</h3>
                      <Badge className={getStatusColor(referral.status)}>{referral.status}</Badge>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600">Referrer ID</p>
                        <p className="font-medium">{referral.referrerId}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Referred Customer</p>
                        <p className="font-medium">{referral.referredCustomerId}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Referral Date</p>
                        <p className="font-medium">{format(new Date(referral.referralDate), 'MMM d, yyyy')}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Bonus Amount</p>
                        <p className="font-medium flex items-center gap-1">
                          <DollarSign className="w-4 h-4" />
                          {referral.bonusAmount.toLocaleString()}
                        </p>
                      </div>
                    </div>
                    {referral.loanId && (
                      <div className="mt-2 text-sm">
                        <p className="text-gray-600">
                          Loan ID: <span className="font-medium">{referral.loanId}</span>
                        </p>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedReferral(referral);
                        setShowBonusesModal(true);
                      }}
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      Bonuses
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedReferral(referral);
                        setStatus(referral.status);
                        setApplicationId(referral.applicationId || '');
                        setLoanId(referral.loanId || '');
                        setShowStatusModal(true);
                      }}
                    >
                      <Edit className="w-4 h-4 mr-1" />
                      Update
                    </Button>
                    {!referral.bonusCredited && referral.status === 'Completed' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedReferral(referral);
                          setShowBonusModal(true);
                        }}
                      >
                        <Gift className="w-4 h-4 mr-1" />
                        Credit Bonus
                      </Button>
                    )}
                  </div>
                </div>
                {referral.bonusCredited && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="flex items-center gap-2 text-sm text-green-700">
                      <CheckCircle className="w-4 h-4" />
                      <span>Bonus credited on {referral.bonusCreditedAt ? format(new Date(referral.bonusCreditedAt), 'MMM d, yyyy') : 'N/A'}</span>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <div className="p-12 text-center">
            <UserPlus className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600">No referrals found</p>
          </div>
        </Card>
      )}

      {/* Create Referral Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          resetCreateForm();
        }}
        title="Create Referral"
      >
        <div className="space-y-4">
          <Input
            label="Referrer ID"
            value={referrerId}
            onChange={(e) => setReferrerId(e.target.value)}
            placeholder="Enter referrer customer ID"
            required
          />
          <Input
            label="Referred Customer ID"
            value={referredCustomerId}
            onChange={(e) => setReferredCustomerId(e.target.value)}
            placeholder="Enter referred customer ID"
            required
          />
          <Input
            label="Referral Code (Optional)"
            value={referralCode}
            onChange={(e) => setReferralCode(e.target.value)}
            placeholder="Auto-generated if not provided"
          />
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
            <Button variant="outline" onClick={() => setShowCreateModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={!referrerId || !referredCustomerId || createReferral.isPending}>
              {createReferral.isPending ? 'Creating...' : 'Create Referral'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Update Status Modal */}
      <Modal
        isOpen={showStatusModal}
        onClose={() => {
          setShowStatusModal(false);
          setSelectedReferral(null);
          resetStatusForm();
        }}
        title="Update Referral Status"
      >
        <div className="space-y-4">
          <Select label="Status" value={status} onChange={(e) => setStatus(e.target.value)} required>
            <option value="Pending">Pending</option>
            <option value="Applied">Applied</option>
            <option value="Approved">Approved</option>
            <option value="Disbursed">Disbursed</option>
            <option value="Completed">Completed</option>
            <option value="Cancelled">Cancelled</option>
          </Select>
          <Input
            label="Application ID (Optional)"
            value={applicationId}
            onChange={(e) => setApplicationId(e.target.value)}
            placeholder="Enter application ID"
          />
          <Input
            label="Loan ID (Optional)"
            value={loanId}
            onChange={(e) => setLoanId(e.target.value)}
            placeholder="Enter loan ID"
          />
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

      {/* Credit Bonus Modal */}
      <Modal
        isOpen={showBonusModal}
        onClose={() => {
          setShowBonusModal(false);
          setSelectedReferral(null);
          resetBonusForm();
        }}
        title="Credit Referral Bonus"
      >
        <div className="space-y-4">
          <Input
            label="Bonus Amount"
            type="number"
            value={bonusAmount}
            onChange={(e) => setBonusAmount(e.target.value)}
            placeholder="Enter bonus amount"
            required
          />
          <Select label="Bonus Type" value={bonusType} onChange={(e) => setBonusType(e.target.value)} required>
            <option value="Fixed Amount">Fixed Amount</option>
            <option value="Percentage">Percentage</option>
            <option value="Tiered">Tiered</option>
          </Select>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Credit Notes (Optional)</label>
            <Textarea
              value={creditNotes}
              onChange={(e) => setCreditNotes(e.target.value)}
              placeholder="Enter credit notes"
              rows={3}
            />
          </div>
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
            <Button variant="outline" onClick={() => setShowBonusModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreditBonus} disabled={!bonusAmount || creditBonus.isPending}>
              {creditBonus.isPending ? 'Crediting...' : 'Credit Bonus'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* View Bonuses Modal */}
      <Modal
        isOpen={showBonusesModal}
        onClose={() => {
          setShowBonusesModal(false);
          setSelectedReferral(null);
        }}
        title={`Bonuses for ${selectedReferral?.referralCode}`}
      >
        <div className="space-y-4">
          {bonuses && bonuses.length > 0 ? (
            <div className="space-y-3">
              {bonuses.map((bonus) => (
                <Card key={bonus.id}>
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <Badge className={getStatusColor(bonus.status)}>{bonus.status}</Badge>
                      <span className="font-semibold text-lg">
                        ${bonus.bonusAmount.toLocaleString()}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600 space-y-1">
                      <p>Type: {bonus.bonusType}</p>
                      {bonus.creditedAt && (
                        <p>Credited: {format(new Date(bonus.creditedAt), 'MMM d, yyyy')}</p>
                      )}
                      {bonus.creditNotes && <p>Notes: {bonus.creditNotes}</p>}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-600 py-8">No bonuses found</p>
          )}
          <div className="flex justify-end pt-4">
            <Button variant="outline" onClick={() => setShowBonusesModal(false)}>
              Close
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

