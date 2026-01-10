'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { Alert } from '@/components/ui/Alert';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import {
  useActiveRateLock,
  useRateLocksForLoan,
  useRequestRateLock,
  useApproveRateLock,
  useExtendRateLock,
  useExerciseFloatDown,
  useCancelRateLock,
  useFloatDownEligibility,
} from '@/lib/hooks/useLoanBooking';
import {
  Lock,
  Clock,
  TrendingDown,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2,
  Plus,
  Calendar,
  Percent,
  RefreshCw,
} from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

interface RateLockSectionProps {
  loanId: string;
  currentRate?: number;
}

export function RateLockSection({ loanId, currentRate }: RateLockSectionProps) {
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [showExtendModal, setShowExtendModal] = useState(false);
  const [showFloatDownModal, setShowFloatDownModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [selectedRateLockId, setSelectedRateLockId] = useState<string | null>(null);

  const { data: activeRateLock, isLoading: isLoadingActive } = useActiveRateLock(loanId);
  const { data: allRateLocks, isLoading: isLoadingAll } = useRateLocksForLoan(loanId);
  const { data: floatDownEligibility } = useFloatDownEligibility(
    selectedRateLockId || ''
  );

  const requestRateLock = useRequestRateLock();
  const approveRateLock = useApproveRateLock();
  const extendRateLock = useExtendRateLock();
  const exerciseFloatDown = useExerciseFloatDown();
  const cancelRateLock = useCancelRateLock();

  // Form states
  const [lockedRate, setLockedRate] = useState('');
  const [lockPeriodDays, setLockPeriodDays] = useState('30');
  const [lockType, setLockType] = useState<'Standard' | 'Float-Down' | 'Automatic Extension'>('Standard');
  const [floatDownEligible, setFloatDownEligible] = useState(false);
  const [autoExtend, setAutoExtend] = useState(false);
  const [extendDays, setExtendDays] = useState('');
  const [newRate, setNewRate] = useState('');
  const [cancellationReason, setCancellationReason] = useState('');

  const handleRequestRateLock = async () => {
    if (!lockedRate || parseFloat(lockedRate) <= 0) {
      toast.error('Please enter a valid interest rate');
      return;
    }

    try {
      await requestRateLock.mutateAsync({
        loanId,
        lockedRate: parseFloat(lockedRate),
        lockPeriodDays: parseInt(lockPeriodDays),
        lockType,
        floatDownEligible,
        autoExtend,
      });
      setShowRequestModal(false);
      setLockedRate('');
      setLockPeriodDays('30');
      setLockType('Standard');
      setFloatDownEligible(false);
      setAutoExtend(false);
    } catch (error) {
      // Error handled by hook
    }
  };

  const handleApproveRateLock = async (rateLockId: string) => {
    try {
      await approveRateLock.mutateAsync({ rateLockId, data: {} });
    } catch (error) {
      // Error handled by hook
    }
  };

  const handleExtendRateLock = async () => {
    if (!selectedRateLockId || !extendDays || parseInt(extendDays) <= 0) {
      toast.error('Please enter valid extension days');
      return;
    }

    try {
      await extendRateLock.mutateAsync({
        rateLockId: selectedRateLockId,
        data: { additionalDays: parseInt(extendDays) },
      });
      setShowExtendModal(false);
      setExtendDays('');
      setSelectedRateLockId(null);
    } catch (error) {
      // Error handled by hook
    }
  };

  const handleExerciseFloatDown = async () => {
    if (!selectedRateLockId || !newRate || parseFloat(newRate) <= 0) {
      toast.error('Please enter a valid new rate');
      return;
    }

    try {
      await exerciseFloatDown.mutateAsync({
        rateLockId: selectedRateLockId,
        data: { newRate: parseFloat(newRate) },
      });
      setShowFloatDownModal(false);
      setNewRate('');
      setSelectedRateLockId(null);
    } catch (error) {
      // Error handled by hook
    }
  };

  const handleCancelRateLock = async () => {
    if (!selectedRateLockId || !cancellationReason.trim()) {
      toast.error('Please enter a cancellation reason');
      return;
    }

    try {
      await cancelRateLock.mutateAsync({
        rateLockId: selectedRateLockId,
        data: { cancellationReason },
      });
      setShowCancelModal(false);
      setCancellationReason('');
      setSelectedRateLockId(null);
    } catch (error) {
      // Error handled by hook
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; variant: 'success' | 'warning' | 'error' | 'info' }> = {
      Pending: { label: 'Pending', variant: 'warning' },
      Active: { label: 'Active', variant: 'success' },
      Extended: { label: 'Extended', variant: 'info' },
      Expired: { label: 'Expired', variant: 'error' },
      Cancelled: { label: 'Cancelled', variant: 'error' },
    };

    const statusInfo = statusMap[status] || { label: status, variant: 'info' as const };
    return <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>;
  };

  if (isLoadingActive || isLoadingAll) {
    return (
      <Card title="Rate Lock Management">
        <Skeleton className="h-32 w-full" />
      </Card>
    );
  }

  const hasActiveRateLock = activeRateLock && activeRateLock.status === 'Active';
  const canRequestNew = !hasActiveRateLock;

  return (
    <Card title="Rate Lock Management">
      <div className="space-y-6">
        {/* Active Rate Lock */}
        {activeRateLock ? (
          <div className="p-4 rounded-lg border-2 border-primary/20 bg-primary/5">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <Lock className="w-6 h-6 text-primary" />
                <div>
                  <div className="font-semibold text-gray-900">Active Rate Lock</div>
                  <div className="text-sm text-gray-600">
                    {getStatusBadge(activeRateLock.status)}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-primary">
                  {activeRateLock.lockedRate}%
                </div>
                <div className="text-xs text-gray-500">Locked Rate</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <div className="text-xs text-gray-500 mb-1">Lock Date</div>
                <div className="text-sm font-medium">
                  {format(new Date(activeRateLock.lockDate), 'MMM dd, yyyy')}
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-500 mb-1">Expiry Date</div>
                <div className="text-sm font-medium">
                  {format(
                    new Date(activeRateLock.extendedExpiryDate || activeRateLock.expiryDate),
                    'MMM dd, yyyy'
                  )}
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-500 mb-1">Lock Period</div>
                <div className="text-sm font-medium">{activeRateLock.lockPeriodDays} days</div>
              </div>
              <div>
                <div className="text-xs text-gray-500 mb-1">Lock Type</div>
                <div className="text-sm font-medium">{activeRateLock.lockType}</div>
              </div>
            </div>

            {activeRateLock.currentRate && (
              <div className="mb-4 p-3 rounded-lg bg-white border border-gray-200">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Current Market Rate</span>
                  <span className="text-lg font-semibold">{activeRateLock.currentRate}%</span>
                </div>
                {activeRateLock.currentRate < activeRateLock.lockedRate && (
                  <div className="mt-2 text-xs text-green-600 flex items-center gap-1">
                    <TrendingDown className="w-3 h-3" />
                    Rate has dropped by{' '}
                    {(activeRateLock.lockedRate - activeRateLock.currentRate).toFixed(2)}%
                  </div>
                )}
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-wrap gap-2">
              {activeRateLock.status === 'Pending' && (
                <Button
                  size="sm"
                  onClick={() => handleApproveRateLock(activeRateLock.id)}
                  disabled={approveRateLock.isPending}
                >
                  {approveRateLock.isPending ? (
                    <>
                      <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                      Approving...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-3 h-3 mr-1" />
                      Approve
                    </>
                  )}
                </Button>
              )}
              {activeRateLock.status === 'Active' && (
                <>
                  {activeRateLock.floatDownEligible && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedRateLockId(activeRateLock.id);
                        setShowFloatDownModal(true);
                      }}
                    >
                      <TrendingDown className="w-3 h-3 mr-1" />
                      Float-Down
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setSelectedRateLockId(activeRateLock.id);
                      setShowExtendModal(true);
                    }}
                  >
                    <Calendar className="w-3 h-3 mr-1" />
                    Extend
                  </Button>
                </>
              )}
              {activeRateLock.status !== 'Cancelled' && activeRateLock.status !== 'Expired' && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setSelectedRateLockId(activeRateLock.id);
                    setShowCancelModal(true);
                  }}
                >
                  <XCircle className="w-3 h-3 mr-1" />
                  Cancel
                </Button>
              )}
            </div>
          </div>
        ) : (
          <Alert variant="info" title="No Active Rate Lock">
            There is no active rate lock for this loan. You can request a new rate lock to protect
            against rate fluctuations.
          </Alert>
        )}

        {/* Request New Rate Lock */}
        {canRequestNew && (
          <Button
            onClick={() => setShowRequestModal(true)}
            variant="outline"
            className="w-full"
          >
            <Plus className="w-4 h-4 mr-2" />
            Request Rate Lock
          </Button>
        )}

        {/* Rate Lock History */}
        {allRateLocks && allRateLocks.length > 0 && (
          <div className="space-y-3 pt-4 border-t border-gray-200">
            <div className="text-sm font-semibold text-gray-900">Rate Lock History</div>
            {allRateLocks.map((rateLock) => (
              <div
                key={rateLock.id}
                className="p-3 rounded-lg border border-gray-200 bg-white"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Percent className="w-4 h-4 text-gray-400" />
                    <span className="font-medium text-sm">{rateLock.lockedRate}%</span>
                  </div>
                  {getStatusBadge(rateLock.status)}
                </div>
                <div className="text-xs text-gray-500">
                  {format(new Date(rateLock.lockDate), 'MMM dd, yyyy')} -{' '}
                  {format(new Date(rateLock.expiryDate), 'MMM dd, yyyy')}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Request Rate Lock Modal */}
        <Modal
          isOpen={showRequestModal}
          onClose={() => {
            setShowRequestModal(false);
            setLockedRate('');
            setLockPeriodDays('30');
            setLockType('Standard');
            setFloatDownEligible(false);
            setAutoExtend(false);
          }}
          title="Request Rate Lock"
          size="md"
          footer={
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  setShowRequestModal(false);
                  setLockedRate('');
                  setLockPeriodDays('30');
                  setLockType('Standard');
                  setFloatDownEligible(false);
                  setAutoExtend(false);
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleRequestRateLock}
                disabled={
                  !lockedRate ||
                  parseFloat(lockedRate) <= 0 ||
                  !lockPeriodDays ||
                  parseInt(lockPeriodDays) <= 0 ||
                  requestRateLock.isPending
                }
              >
                {requestRateLock.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Requesting...
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4 mr-2" />
                    Request Rate Lock
                  </>
                )}
              </Button>
            </div>
          }
        >
          <div className="space-y-4">
            <Alert variant="info">
              Lock the current interest rate for a specified period to protect against rate
              fluctuations.
            </Alert>

            <Input
              label="Interest Rate (%)"
              type="number"
              step="0.01"
              value={lockedRate}
              onChange={(e) => setLockedRate(e.target.value)}
              placeholder={currentRate?.toString() || '0.00'}
              required
            />

            <Input
              label="Lock Period (Days)"
              type="number"
              value={lockPeriodDays}
              onChange={(e) => setLockPeriodDays(e.target.value)}
              placeholder="30"
              required
            />

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Lock Type
              </label>
              <select
                value={lockType}
                onChange={(e) =>
                  setLockType(
                    e.target.value as 'Standard' | 'Float-Down' | 'Automatic Extension'
                  )
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="Standard">Standard</option>
                <option value="Float-Down">Float-Down</option>
                <option value="Automatic Extension">Automatic Extension</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={floatDownEligible}
                  onChange={(e) => setFloatDownEligible(e.target.checked)}
                  className="w-4 h-4"
                />
                <span className="text-sm text-gray-700">Enable Float-Down Option</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={autoExtend}
                  onChange={(e) => setAutoExtend(e.target.checked)}
                  className="w-4 h-4"
                />
                <span className="text-sm text-gray-700">Auto-Extend on Expiry</span>
              </label>
            </div>
          </div>
        </Modal>

        {/* Extend Rate Lock Modal */}
        <Modal
          isOpen={showExtendModal}
          onClose={() => {
            setShowExtendModal(false);
            setExtendDays('');
            setSelectedRateLockId(null);
          }}
          title="Extend Rate Lock"
          size="md"
          footer={
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  setShowExtendModal(false);
                  setExtendDays('');
                  setSelectedRateLockId(null);
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleExtendRateLock}
                disabled={
                  !extendDays ||
                  parseInt(extendDays) <= 0 ||
                  extendRateLock.isPending
                }
              >
                {extendRateLock.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Extending...
                  </>
                ) : (
                  <>
                    <Calendar className="w-4 h-4 mr-2" />
                    Extend Rate Lock
                  </>
                )}
              </Button>
            </div>
          }
        >
          <div className="space-y-4">
            <Alert variant="info">
              Extend the rate lock period by additional days. This will update the expiry date
              accordingly.
            </Alert>

            <Input
              label="Additional Days"
              type="number"
              value={extendDays}
              onChange={(e) => setExtendDays(e.target.value)}
              placeholder="30"
              required
            />
          </div>
        </Modal>

        {/* Float-Down Modal */}
        <Modal
          isOpen={showFloatDownModal}
          onClose={() => {
            setShowFloatDownModal(false);
            setNewRate('');
            setSelectedRateLockId(null);
          }}
          title="Exercise Float-Down"
          size="md"
          footer={
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  setShowFloatDownModal(false);
                  setNewRate('');
                  setSelectedRateLockId(null);
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleExerciseFloatDown}
                disabled={
                  !newRate ||
                  parseFloat(newRate) <= 0 ||
                  exerciseFloatDown.isPending
                }
              >
                {exerciseFloatDown.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <TrendingDown className="w-4 h-4 mr-2" />
                    Exercise Float-Down
                  </>
                )}
              </Button>
            </div>
          }
        >
          <div className="space-y-4">
            <Alert variant="info">
              Exercise the float-down option to lock in a lower rate if market rates have
              decreased.
            </Alert>

            {activeRateLock && (
              <div className="p-3 rounded-lg bg-gray-50">
                <div className="text-sm text-gray-600 mb-1">Current Locked Rate</div>
                <div className="text-2xl font-bold text-primary">{activeRateLock.lockedRate}%</div>
              </div>
            )}

            <Input
              label="New Rate (%)"
              type="number"
              step="0.01"
              value={newRate}
              onChange={(e) => setNewRate(e.target.value)}
              placeholder="0.00"
              required
            />

            {activeRateLock && newRate && parseFloat(newRate) < activeRateLock.lockedRate && (
              <div className="p-3 rounded-lg bg-green-50 border border-green-200">
                <div className="text-sm text-green-700">
                  You will save{' '}
                  {(activeRateLock.lockedRate - parseFloat(newRate)).toFixed(2)}% by exercising
                  float-down
                </div>
              </div>
            )}
          </div>
        </Modal>

        {/* Cancel Rate Lock Modal */}
        <Modal
          isOpen={showCancelModal}
          onClose={() => {
            setShowCancelModal(false);
            setCancellationReason('');
            setSelectedRateLockId(null);
          }}
          title="Cancel Rate Lock"
          size="md"
          footer={
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  setShowCancelModal(false);
                  setCancellationReason('');
                  setSelectedRateLockId(null);
                }}
              >
                Close
              </Button>
              <Button
                variant="danger"
                onClick={handleCancelRateLock}
                disabled={!cancellationReason.trim() || cancelRateLock.isPending}
              >
                {cancelRateLock.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Cancelling...
                  </>
                ) : (
                  <>
                    <XCircle className="w-4 h-4 mr-2" />
                    Cancel Rate Lock
                  </>
                )}
              </Button>
            </div>
          }
        >
          <div className="space-y-4">
            <Alert variant="warning">
              This action cannot be undone. The rate lock will be cancelled and the loan will
              revert to current market rates.
            </Alert>

            <Input
              label="Cancellation Reason"
              value={cancellationReason}
              onChange={(e) => setCancellationReason(e.target.value)}
              placeholder="Enter reason for cancellation"
              required
            />
          </div>
        </Modal>
      </div>
    </Card>
  );
}

