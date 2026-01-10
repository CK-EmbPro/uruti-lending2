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
  useCreateFeeSchedule,
  useUpdateFeeSchedule,
  useApplyFeeSchedule,
  useFeeSchedules,
} from '@/lib/hooks/useAdministration';
import {
  Receipt,
  Plus,
  Edit,
  CheckCircle,
  DollarSign,
  Calendar,
  Bell,
} from 'lucide-react';
import { format } from 'date-fns';
import { FeeType, type CreateFeeScheduleDto } from '@/lib/api/administration';

export function FeeScheduleDashboard() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [selectedFeeId, setSelectedFeeId] = useState<string | null>(null);
  const [feeCode, setFeeCode] = useState('');
  const [feeName, setFeeName] = useState('');
  const [feeType, setFeeType] = useState<FeeType>(FeeType.LATE_FEE);
  const [companyId, setCompanyId] = useState('');
  const [fixedAmount, setFixedAmount] = useState('');
  const [percentageAmount, setPercentageAmount] = useState('');
  const [effectiveDate, setEffectiveDate] = useState('');
  const [grandfatherExistingAccounts, setGrandfatherExistingAccounts] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');

  const createFee = useCreateFeeSchedule();
  const applyFee = useApplyFeeSchedule();
  const { data: fees, isLoading, refetch } = useFeeSchedules();

  const handleCreate = () => {
    const dto: CreateFeeScheduleDto = {
      feeCode,
      feeName,
      feeType,
      companyId,
      fixedAmount: fixedAmount ? parseFloat(fixedAmount) : undefined,
      percentageAmount: percentageAmount ? parseFloat(percentageAmount) : undefined,
      effectiveDate,
      grandfatherExistingAccounts,
    };

    createFee.mutate(dto, {
      onSuccess: () => {
        setShowCreateModal(false);
        resetForm();
        refetch();
      },
    });
  };

  const handleApply = () => {
    if (!selectedFeeId) return;

    applyFee.mutate(
      {
        id: selectedFeeId,
        dto: {
          notificationMessage: notificationMessage || undefined,
          sendNotification: true,
        },
      },
      {
        onSuccess: () => {
          setShowApplyModal(false);
          setSelectedFeeId(null);
          setNotificationMessage('');
          refetch();
        },
      },
    );
  };

  const resetForm = () => {
    setFeeCode('');
    setFeeName('');
    setFeeType(FeeType.LATE_FEE);
    setCompanyId('');
    setFixedAmount('');
    setPercentageAmount('');
    setEffectiveDate('');
    setGrandfatherExistingAccounts(false);
  };

  const activeCount = fees?.filter((f) => f.isActive).length || 0;
  const pendingCount = fees?.filter((f) => {
    const effective = new Date(f.effectiveDate);
    return effective > new Date() && !f.notificationSent;
  }).length || 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Fee Schedule Management</h2>
          <p className="text-sm text-gray-600 mt-1">Manage fee schedules with effective dates and customer notifications</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Fee Schedule
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <div className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Fees</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{fees?.length || 0}</p>
              </div>
              <Receipt className="h-8 w-8 text-blue-600" />
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
                <p className="text-sm text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-yellow-600 mt-1">{pendingCount}</p>
              </div>
              <Calendar className="h-8 w-8 text-yellow-600" />
            </div>
          </div>
        </Card>
      </div>

      <Card>
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Fee Schedules</h3>

          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          ) : fees && fees.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Fee
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Effective Date
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
                  {fees.map((fee) => {
                    const effective = new Date(fee.effectiveDate);
                    const isPending = effective > new Date();

                    return (
                      <tr key={fee.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{fee.feeName}</div>
                            <div className="text-sm text-gray-500">{fee.feeCode}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge>{fee.feeType}</Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {fee.fixedAmount ? `$${fee.fixedAmount.toFixed(2)}` : fee.percentageAmount ? `${fee.percentageAmount}%` : 'N/A'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {format(effective, 'MMM dd, yyyy')}
                          </div>
                          {isPending && (
                            <div className="text-xs text-yellow-600">Pending</div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {fee.isActive ? (
                            <Badge className="bg-green-100 text-green-800">Active</Badge>
                          ) : (
                            <Badge className="bg-gray-100 text-gray-800">Inactive</Badge>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          {isPending && !fee.notificationSent && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedFeeId(fee.id);
                                setShowApplyModal(true);
                              }}
                            >
                              <Bell className="h-4 w-4 mr-1" />
                              Apply
                            </Button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <Receipt className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No fee schedules found</p>
            </div>
          )}
        </div>
      </Card>

      {/* Create Fee Schedule Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          resetForm();
        }}
        title="Create Fee Schedule"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Fee Code</label>
            <Input
              value={feeCode}
              onChange={(e) => setFeeCode(e.target.value)}
              placeholder="LATE-FEE-001"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Fee Name</label>
            <Input
              value={feeName}
              onChange={(e) => setFeeName(e.target.value)}
              placeholder="Late Payment Fee"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Fee Type</label>
            <Select
              value={feeType}
              onChange={(e) => setFeeType(e.target.value as FeeType)}
            >
              <option value={FeeType.LATE_FEE}>Late Fee</option>
              <option value={FeeType.APPLICATION_FEE}>Application Fee</option>
              <option value={FeeType.PROCESSING_FEE}>Processing Fee</option>
              <option value={FeeType.PREPAYMENT_PENALTY}>Prepayment Penalty</option>
              <option value={FeeType.NSF_FEE}>NSF Fee</option>
              <option value={FeeType.OTHER}>Other</option>
            </Select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Company ID</label>
            <Input
              value={companyId}
              onChange={(e) => setCompanyId(e.target.value)}
              placeholder="company-123"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Fixed Amount</label>
              <Input
                type="number"
                step="0.01"
                value={fixedAmount}
                onChange={(e) => setFixedAmount(e.target.value)}
                placeholder="50.00"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Percentage (%)</label>
              <Input
                type="number"
                step="0.01"
                value={percentageAmount}
                onChange={(e) => setPercentageAmount(e.target.value)}
                placeholder="2.5"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Effective Date</label>
            <Input
              type="date"
              value={effectiveDate}
              onChange={(e) => setEffectiveDate(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="grandfather"
              checked={grandfatherExistingAccounts}
              onChange={(e) => setGrandfatherExistingAccounts(e.target.checked)}
              className="rounded border-gray-300"
            />
            <label htmlFor="grandfather" className="text-sm text-gray-700">
              Grandfather existing accounts
            </label>
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setShowCreateModal(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              disabled={!feeCode || !feeName || !companyId || !effectiveDate || (!fixedAmount && !percentageAmount) || createFee.isPending}
            >
              {createFee.isPending ? 'Creating...' : 'Create Fee Schedule'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Apply Fee Schedule Modal */}
      <Modal
        isOpen={showApplyModal}
        onClose={() => {
          setShowApplyModal(false);
          setSelectedFeeId(null);
          setNotificationMessage('');
        }}
        title="Apply Fee Schedule"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Notification Message</label>
            <Textarea
              value={notificationMessage}
              onChange={(e) => setNotificationMessage(e.target.value)}
              placeholder="Enter notification message for customers..."
              rows={4}
            />
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setShowApplyModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleApply} disabled={applyFee.isPending}>
              {applyFee.isPending ? 'Applying...' : 'Apply Fee Schedule'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

