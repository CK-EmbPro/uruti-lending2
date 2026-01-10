'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { Alert } from '@/components/ui/Alert';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { usePaymentHolidays, usePaymentHolidayCount } from '@/lib/hooks/useLoanRestructure';
import {
  Calendar,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
  Plus,
  Info,
} from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

interface PaymentHolidaySectionProps {
  loanId: string;
  onRequestHoliday?: () => void;
}

export function PaymentHolidaySection({ loanId, onRequestHoliday }: PaymentHolidaySectionProps) {
  const { data: holidays, isLoading: holidaysLoading } = usePaymentHolidays(loanId);
  const { data: holidayCount, isLoading: countLoading } = usePaymentHolidayCount(loanId);

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; variant: 'success' | 'warning' | 'error' | 'info' }> = {
      ACTIVE: { label: 'Active', variant: 'warning' },
      COMPLETED: { label: 'Completed', variant: 'success' },
      CANCELLED: { label: 'Cancelled', variant: 'error' },
    };

    const statusInfo = statusMap[status] || { label: status, variant: 'info' as const };
    return <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>;
  };

  if (holidaysLoading || countLoading) {
    return (
      <Card title="Payment Holidays">
        <Skeleton className="h-32 w-full" />
      </Card>
    );
  }

  const maxHolidays = 2;
  const canRequestHoliday = (holidayCount || 0) < maxHolidays;
  const activeHoliday = holidays?.find((h) => h.status === 'ACTIVE' && new Date(h.endDate) > new Date());

  return (
    <Card title="Payment Holidays">
      <div className="space-y-4">
        {/* Holiday Count & Status */}
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">
              Holidays Used: {holidayCount || 0} / {maxHolidays}
            </span>
          </div>
          {canRequestHoliday ? (
            <Badge variant="success">Can Request</Badge>
          ) : (
            <Badge variant="error">Limit Reached</Badge>
          )}
        </div>

        {/* Active Holiday Warning */}
        {activeHoliday && (
          <Alert variant="warning" title="Active Payment Holiday">
            <div className="text-sm">
              <p>You currently have an active payment holiday until:</p>
              <p className="font-semibold mt-1">
                {format(new Date(activeHoliday.endDate), 'MMMM dd, yyyy')}
              </p>
              <p className="text-xs text-gray-600 mt-1">
                A new holiday cannot be requested until the current one ends.
              </p>
            </div>
          </Alert>
        )}

        {/* Max Holidays Reached */}
        {!canRequestHoliday && !activeHoliday && (
          <Alert variant="error" title="Maximum Holidays Reached">
            <div className="text-sm">
              <p>You have reached the maximum of {maxHolidays} payment holidays allowed per loan.</p>
              <p className="text-xs text-gray-600 mt-1">
                If you need additional assistance, please contact customer service.
              </p>
            </div>
          </Alert>
        )}

        {/* Request Button */}
        {canRequestHoliday && !activeHoliday && (
          <Button
            variant="outline"
            onClick={onRequestHoliday}
            className="w-full"
          >
            <Plus className="w-4 h-4 mr-2" />
            Request Payment Holiday
          </Button>
        )}

        {/* Holidays List */}
        {holidays && holidays.length > 0 ? (
          <div className="space-y-3">
            <div className="text-sm font-semibold text-gray-900">Payment Holiday History</div>
            {holidays.map((holiday) => (
              <div
                key={holiday.id}
                className="p-4 rounded-lg border border-gray-200 bg-white"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span className="font-medium text-sm">
                      {format(new Date(holiday.startDate), 'MMM dd')} - {format(new Date(holiday.endDate), 'MMM dd, yyyy')}
                    </span>
                  </div>
                  {getStatusBadge(holiday.status)}
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs text-gray-600 mb-2">
                  <div>
                    <span className="font-medium">Duration:</span> {holiday.durationMonths} month(s)
                  </div>
                  <div>
                    <span className="font-medium">Status:</span> {holiday.status}
                  </div>
                </div>
                {holiday.reason && (
                  <div className="text-xs text-gray-600 mt-2">
                    <span className="font-medium">Reason:</span> {holiday.reason}
                  </div>
                )}
                {holiday.completedDate && (
                  <div className="text-xs text-gray-500 mt-2">
                    Completed: {format(new Date(holiday.completedDate), 'MMM dd, yyyy')}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <Alert variant="info" title="No Payment Holidays">
            No payment holidays have been requested for this loan.
          </Alert>
        )}

        {/* Info Box */}
        <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-start gap-2">
            <Info className="w-4 h-4 text-blue-600 mt-0.5" />
            <div className="text-xs text-blue-800">
              <p className="font-semibold mb-1">Payment Holiday Policy:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Maximum of {maxHolidays} payment holidays allowed per loan</li>
                <li>Only one active holiday at a time</li>
                <li>Interest continues to accrue during holidays</li>
                <li>Holidays must be approved by an underwriter</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}

