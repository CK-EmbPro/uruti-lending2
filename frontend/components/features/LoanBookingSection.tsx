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
  useLoanBookingForLoan,
  useCreateBooking,
  useGenerateDocuments,
  useCompleteBooking,
  useCancelBooking,
} from '@/lib/hooks/useLoanBooking';
import {
  FileText,
  CheckCircle2,
  Clock,
  XCircle,
  FileCheck,
  UserCheck,
  Building2,
  Loader2,
  AlertCircle,
  Download,
  Send,
} from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

interface LoanBookingSectionProps {
  loanId: string;
  applicationId?: string;
}

export function LoanBookingSection({ loanId, applicationId }: LoanBookingSectionProps) {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancellationReason, setCancellationReason] = useState('');

  const { data: booking, isLoading } = useLoanBookingForLoan(loanId);
  const createBooking = useCreateBooking();
  const generateDocuments = useGenerateDocuments();
  const completeBooking = useCompleteBooking();
  const cancelBooking = useCancelBooking();

  const handleCreateBooking = async () => {
    if (!applicationId) {
      toast.error('Application ID is required');
      return;
    }

    try {
      await createBooking.mutateAsync({
        loanId,
        applicationId,
        requiresNotarization: false,
      });
      setShowCreateModal(false);
    } catch (error) {
      // Error handled by hook
    }
  };

  const handleGenerateDocuments = async () => {
    if (!booking?.id) return;
    try {
      await generateDocuments.mutateAsync(booking.id);
    } catch (error) {
      // Error handled by hook
    }
  };

  const handleCompleteBooking = async () => {
    if (!booking?.id) return;
    try {
      await completeBooking.mutateAsync(booking.id);
    } catch (error) {
      // Error handled by hook
    }
  };

  const handleCancelBooking = async () => {
    if (!booking?.id) return;
    try {
      await cancelBooking.mutateAsync({
        bookingId: booking.id,
        data: { cancellationReason },
      });
      setShowCancelModal(false);
      setCancellationReason('');
    } catch (error) {
      // Error handled by hook
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; variant: 'success' | 'warning' | 'error' | 'info' }> = {
      Pending: { label: 'Pending', variant: 'warning' },
      'Documents Generated': { label: 'Documents Generated', variant: 'info' },
      'Pending Signatures': { label: 'Pending Signatures', variant: 'warning' },
      'Signatures Complete': { label: 'Signatures Complete', variant: 'info' },
      Booked: { label: 'Booked', variant: 'success' },
      Cancelled: { label: 'Cancelled', variant: 'error' },
    };

    const statusInfo = statusMap[status] || { label: status, variant: 'info' as const };
    return <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Booked':
        return <CheckCircle2 className="w-5 h-5 text-green-600" />;
      case 'Signatures Complete':
        return <FileCheck className="w-5 h-5 text-blue-600" />;
      case 'Pending Signatures':
      case 'Documents Generated':
        return <Clock className="w-5 h-5 text-yellow-600" />;
      case 'Cancelled':
        return <XCircle className="w-5 h-5 text-red-600" />;
      default:
        return <Clock className="w-5 h-5 text-gray-600" />;
    }
  };

  if (isLoading) {
    return (
      <Card title="Loan Booking">
        <Skeleton className="h-32 w-full" />
      </Card>
    );
  }

  if (!booking) {
    return (
      <Card title="Loan Booking">
        <div className="space-y-4">
          <Alert variant="info" title="No Booking Found">
            This loan has not been booked yet. Create a booking to start the document generation and signature process.
          </Alert>
          {applicationId && (
            <Button
              onClick={() => setShowCreateModal(true)}
              className="w-full"
            >
              <FileText className="w-4 h-4 mr-2" />
              Create Booking
            </Button>
          )}
        </div>

        <Modal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          title="Create Loan Booking"
          size="md"
          footer={
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowCreateModal(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleCreateBooking}
                disabled={createBooking.isPending}
              >
                {createBooking.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <FileText className="w-4 h-4 mr-2" />
                    Create Booking
                  </>
                )}
              </Button>
            </div>
          }
        >
          <div className="space-y-4">
            <Alert variant="info">
              This will create a booking record and allow you to generate loan documents for signature.
            </Alert>
            <div className="space-y-2">
              <p className="text-sm text-gray-600">
                <strong>Loan ID:</strong> {loanId}
              </p>
              <p className="text-sm text-gray-600">
                <strong>Application ID:</strong> {applicationId}
              </p>
            </div>
          </div>
        </Modal>
      </Card>
    );
  }

  const canGenerateDocuments = booking.status === 'Pending' || booking.status === 'Documents Generated';
  const canComplete = booking.status === 'Signatures Complete';
  const canCancel = booking.status !== 'Booked' && booking.status !== 'Cancelled';

  return (
    <Card title="Loan Booking">
      <div className="space-y-6">
        {/* Status Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {getStatusIcon(booking.status)}
            <div>
              <div className="font-semibold text-gray-900">Booking Status</div>
              <div className="text-sm text-gray-600">
                {getStatusBadge(booking.status)}
              </div>
            </div>
          </div>
          {booking.accountNumber && (
            <div className="text-right">
              <div className="text-xs text-gray-500">Account Number</div>
              <div className="font-mono text-sm font-semibold">{booking.accountNumber}</div>
            </div>
          )}
        </div>

        {/* Booking Details */}
        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200">
          <div>
            <div className="text-xs text-gray-500 mb-1">Booked By</div>
            <div className="text-sm font-medium">{booking.bookedBy || 'N/A'}</div>
          </div>
          <div>
            <div className="text-xs text-gray-500 mb-1">Booked Date</div>
            <div className="text-sm font-medium">
              {booking.bookedDate ? format(new Date(booking.bookedDate), 'MMM dd, yyyy') : 'N/A'}
            </div>
          </div>
          {booking.requiresNotarization && (
            <div className="col-span-2">
              <Badge variant="warning">Notarization Required</Badge>
            </div>
          )}
          {booking.accountCreated && (
            <div className="col-span-2">
              <div className="flex items-center gap-2 text-sm text-green-600">
                <CheckCircle2 className="w-4 h-4" />
                <span>Account Created</span>
              </div>
            </div>
          )}
        </div>

        {/* Workflow Steps */}
        <div className="space-y-3 pt-4 border-t border-gray-200">
          <div className="text-sm font-semibold text-gray-900 mb-3">Booking Workflow</div>
          
          {/* Step 1: Booking Created */}
          <div className="flex items-start gap-3">
            <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
              booking.status !== 'Pending' ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'
            }`}>
              {booking.status !== 'Pending' ? (
                <CheckCircle2 className="w-5 h-5" />
              ) : (
                <div className="w-2 h-2 rounded-full bg-current" />
              )}
            </div>
            <div className="flex-1">
              <div className="font-medium text-sm">Booking Created</div>
              <div className="text-xs text-gray-500">
                {format(new Date(booking.createdAt), 'MMM dd, yyyy HH:mm')}
              </div>
            </div>
          </div>

          {/* Step 2: Documents Generated */}
          <div className="flex items-start gap-3">
            <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
              ['Documents Generated', 'Pending Signatures', 'Signatures Complete', 'Booked'].includes(booking.status)
                ? 'bg-green-100 text-green-600'
                : 'bg-gray-100 text-gray-400'
            }`}>
              {['Documents Generated', 'Pending Signatures', 'Signatures Complete', 'Booked'].includes(booking.status) ? (
                <CheckCircle2 className="w-5 h-5" />
              ) : (
                <div className="w-2 h-2 rounded-full bg-current" />
              )}
            </div>
            <div className="flex-1">
              <div className="font-medium text-sm">Documents Generated</div>
              {canGenerateDocuments && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleGenerateDocuments}
                  disabled={generateDocuments.isPending}
                  className="mt-2"
                >
                  {generateDocuments.isPending ? (
                    <>
                      <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <FileText className="w-3 h-3 mr-1" />
                      Generate Documents
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>

          {/* Step 3: Signatures */}
          <div className="flex items-start gap-3">
            <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
              ['Signatures Complete', 'Booked'].includes(booking.status)
                ? 'bg-green-100 text-green-600'
                : ['Pending Signatures', 'Documents Generated'].includes(booking.status)
                ? 'bg-yellow-100 text-yellow-600'
                : 'bg-gray-100 text-gray-400'
            }`}>
              {['Signatures Complete', 'Booked'].includes(booking.status) ? (
                <CheckCircle2 className="w-5 h-5" />
              ) : ['Pending Signatures', 'Documents Generated'].includes(booking.status) ? (
                <Clock className="w-5 h-5" />
              ) : (
                <div className="w-2 h-2 rounded-full bg-current" />
              )}
            </div>
            <div className="flex-1">
              <div className="font-medium text-sm">Document Signatures</div>
              <div className="text-xs text-gray-500">
                {booking.status === 'Pending Signatures' || booking.status === 'Documents Generated'
                  ? 'Waiting for signatures'
                  : booking.status === 'Signatures Complete' || booking.status === 'Booked'
                  ? 'All signatures complete'
                  : 'Not started'}
              </div>
            </div>
          </div>

          {/* Step 4: Booking Complete */}
          <div className="flex items-start gap-3">
            <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
              booking.status === 'Booked'
                ? 'bg-green-100 text-green-600'
                : booking.status === 'Signatures Complete'
                ? 'bg-yellow-100 text-yellow-600'
                : 'bg-gray-100 text-gray-400'
            }`}>
              {booking.status === 'Booked' ? (
                <CheckCircle2 className="w-5 h-5" />
              ) : booking.status === 'Signatures Complete' ? (
                <Clock className="w-5 h-5" />
              ) : (
                <div className="w-2 h-2 rounded-full bg-current" />
              )}
            </div>
            <div className="flex-1">
              <div className="font-medium text-sm">Booking Complete</div>
              {canComplete && (
                <Button
                  size="sm"
                  onClick={handleCompleteBooking}
                  disabled={completeBooking.isPending}
                  className="mt-2"
                >
                  {completeBooking.isPending ? (
                    <>
                      <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                      Completing...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-3 h-3 mr-1" />
                      Complete Booking
                    </>
                  )}
                </Button>
              )}
              {booking.status === 'Booked' && booking.bookedDate && (
                <div className="text-xs text-gray-500 mt-1">
                  Completed on {format(new Date(booking.bookedDate), 'MMM dd, yyyy')}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-4 border-t border-gray-200">
          {canCancel && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowCancelModal(true)}
              className="flex-1"
            >
              <XCircle className="w-4 h-4 mr-2" />
              Cancel Booking
            </Button>
          )}
        </div>

        {/* Remarks */}
        {booking.bookingRemarks && (
          <div className="pt-4 border-t border-gray-200">
            <div className="text-xs text-gray-500 mb-1">Remarks</div>
            <div className="text-sm text-gray-700">{booking.bookingRemarks}</div>
          </div>
        )}

        {/* Cancellation Modal */}
        <Modal
          isOpen={showCancelModal}
          onClose={() => {
            setShowCancelModal(false);
            setCancellationReason('');
          }}
          title="Cancel Booking"
          size="md"
          footer={
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  setShowCancelModal(false);
                  setCancellationReason('');
                }}
              >
                Close
              </Button>
              <Button
                variant="danger"
                onClick={handleCancelBooking}
                disabled={!cancellationReason.trim() || cancelBooking.isPending}
              >
                {cancelBooking.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Cancelling...
                  </>
                ) : (
                  <>
                    <XCircle className="w-4 h-4 mr-2" />
                    Cancel Booking
                  </>
                )}
              </Button>
            </div>
          }
        >
          <div className="space-y-4">
            <Alert variant="warning">
              This action cannot be undone. The booking will be cancelled and all associated documents will be marked as cancelled.
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

