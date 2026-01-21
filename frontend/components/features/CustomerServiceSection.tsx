'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { Alert } from '@/components/ui/Alert';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import {
  useCreatePaymentExtension,
  useLoanExtensions,
  useApprovePaymentExtension,
  useCreateDispute,
  useLoanDisputes,
  useResolveDispute,
  useCreateAccountUpdate,
  useLoanAccountUpdates,
  useCreateFeeWaiver,
  useLoanFeeWaivers,
  useApproveFeeWaiver,
} from '@/lib/hooks/useCustomerService';
import {
  Calendar,
  AlertCircle,
  User,
  DollarSign,
  CheckCircle,
  XCircle,
  Clock,
  FileText,
  Phone,
  Mail,
  MapPin,
} from 'lucide-react';
import { format } from 'date-fns';

interface CustomerServiceSectionProps {
  loanId: string;
}

export function CustomerServiceSection({ loanId }: CustomerServiceSectionProps) {
  const [showExtensionModal, setShowExtensionModal] = useState(false);
  const [showDisputeModal, setShowDisputeModal] = useState(false);
  const [showAccountUpdateModal, setShowAccountUpdateModal] = useState(false);
  const [showFeeWaiverModal, setShowFeeWaiverModal] = useState(false);

  const { data: extensions, isLoading: extensionsLoading } = useLoanExtensions(loanId);
  const { data: disputes, isLoading: disputesLoading } = useLoanDisputes(loanId);
  const { data: accountUpdates, isLoading: updatesLoading } = useLoanAccountUpdates(loanId);
  const { data: feeWaivers, isLoading: waiversLoading } = useLoanFeeWaivers(loanId);

  const createExtension = useCreatePaymentExtension();
  const approveExtension = useApprovePaymentExtension();
  const createDispute = useCreateDispute();
  const resolveDispute = useResolveDispute();
  const createAccountUpdate = useCreateAccountUpdate();
  const createFeeWaiver = useCreateFeeWaiver();
  const approveFeeWaiver = useApproveFeeWaiver();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Customer Service</h2>
      </div>

      {/* Quick Actions */}
      <Card>
        <div className="p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Service Requests</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Button className='flex items-center gap-1' variant="outline" size="sm" onClick={() => setShowExtensionModal(true)}>
              <Calendar className="w-4 h-4 mr-2" />
              Payment Extension
            </Button>
            <Button className='flex items-center gap-1' variant="outline" size="sm" onClick={() => setShowDisputeModal(true)}>
              <AlertCircle className="w-4 h-4 mr-2" />
              Dispute
            </Button>
            <Button className='flex items-center gap-1' variant="outline" size="sm" onClick={() => setShowAccountUpdateModal(true)}>
              <User className="w-4 h-4 mr-2" />
              Update Account
            </Button>
            <Button className='flex items-center gap-1' variant="outline" size="sm" onClick={() => setShowFeeWaiverModal(true)}>
              <DollarSign className="w-4 h-4 mr-2" />
              Fee Waiver
            </Button>
          </div>
        </div>
      </Card>

      {/* Payment Extensions */}
      {extensionsLoading ? (
        <Skeleton className="h-48" />
      ) : extensions && extensions.length > 0 ? (
        <Card>
          <div className="p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Payment Extensions</h3>
            <div className="space-y-3">
              {extensions.map((extension) => (
                <div key={extension.id} className="p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Badge
                        className={
                          extension.status === 'Approved'
                            ? 'bg-green-100 text-green-800'
                            : extension.status === 'Denied'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }
                      >
                        {extension.status}
                      </Badge>
                      <span className="text-sm text-gray-600">
                        {extension.extensionDays} days extension
                      </span>
                    </div>
                    {extension.status === 'Pending' && (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            approveExtension.mutate({ id: extension.id, remarks: 'Approved by CSR' })
                          }
                        >
                          Approve
                        </Button>
                      </div>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-gray-600">Original Due Date:</span>
                      <span className="font-semibold ml-2">
                        {format(new Date(extension.originalDueDate), 'MMM d, yyyy')}
                      </span>
                    </div>
                    {extension.newDueDate && (
                      <div>
                        <span className="text-gray-600">New Due Date:</span>
                        <span className="font-semibold ml-2">
                          {format(new Date(extension.newDueDate), 'MMM d, yyyy')}
                        </span>
                      </div>
                    )}
                  </div>
                  {extension.requestReason && (
                    <p className="text-sm text-gray-700 mt-2">{extension.requestReason}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </Card>
      ) : null}

      {/* Disputes */}
      {disputesLoading ? (
        <Skeleton className="h-48" />
      ) : disputes && disputes.length > 0 ? (
        <Card>
          <div className="p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Disputes</h3>
            <div className="space-y-3">
              {disputes.map((dispute) => (
                <div key={dispute.id} className="p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <Badge
                      className={
                        dispute.status === 'Resolved'
                          ? 'bg-green-100 text-green-800'
                          : dispute.status === 'Escalated'
                          ? 'bg-orange-100 text-orange-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }
                    >
                      {dispute.status}
                    </Badge>
                    <span className="text-sm text-gray-600">{dispute.disputeType}</span>
                  </div>
                  <p className="text-sm text-gray-700 mb-2">{dispute.description}</p>
                  {dispute.disputedAmount && (
                    <p className="text-sm font-semibold">
                      Disputed Amount: ${dispute.disputedAmount.toLocaleString()}
                    </p>
                  )}
                  {dispute.resolutions && dispute.resolutions.length > 0 && (
                    <div className="mt-2 p-2 bg-gray-50 rounded">
                      <p className="text-xs font-semibold text-gray-600">Resolution:</p>
                      <p className="text-sm text-gray-700">
                        {dispute.resolutions[0].resolutionDetails}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </Card>
      ) : null}

      {/* Fee Waivers */}
      {waiversLoading ? (
        <Skeleton className="h-48" />
      ) : feeWaivers && feeWaivers.length > 0 ? (
        <Card>
          <div className="p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Fee Waivers</h3>
            <div className="space-y-3">
              {feeWaivers.map((waiver) => (
                <div key={waiver.id} className="p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <Badge
                      className={
                        waiver.status === 'Approved' || waiver.status === 'Processed'
                          ? 'bg-green-100 text-green-800'
                          : waiver.status === 'Denied'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }
                    >
                      {waiver.status}
                    </Badge>
                    <span className="font-semibold">
                      ${waiver.feeAmount.toLocaleString()} - {waiver.feeType}
                    </span>
                  </div>
                  {waiver.requestReason && (
                    <p className="text-sm text-gray-700">{waiver.requestReason}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </Card>
      ) : null}

      {/* Modals */}
      <PaymentExtensionModal
        isOpen={showExtensionModal}
        onClose={() => setShowExtensionModal(false)}
        loanId={loanId}
        onCreate={createExtension.mutate}
      />

      <DisputeModal
        isOpen={showDisputeModal}
        onClose={() => setShowDisputeModal(false)}
        loanId={loanId}
        onCreate={createDispute.mutate}
      />

      <AccountUpdateModal
        isOpen={showAccountUpdateModal}
        onClose={() => setShowAccountUpdateModal(false)}
        loanId={loanId}
        onCreate={createAccountUpdate.mutate}
      />

      <FeeWaiverModal
        isOpen={showFeeWaiverModal}
        onClose={() => setShowFeeWaiverModal(false)}
        loanId={loanId}
        onCreate={createFeeWaiver.mutate}
      />
    </div>
  );
}

// Modal Components
function PaymentExtensionModal({ isOpen, onClose, loanId, onCreate }: any) {
  const [originalDueDate, setOriginalDueDate] = useState('');
  const [extensionDays, setExtensionDays] = useState('');
  const [extensionType, setExtensionType] = useState('One-Time Courtesy');
  const [requestReason, setRequestReason] = useState('');
  const [hardshipDetails, setHardshipDetails] = useState('');

  const handleSubmit = () => {
    onCreate({
      loanId,
      originalDueDate,
      extensionDays: parseInt(extensionDays),
      extensionType,
      requestReason,
      hardshipDetails,
    });
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Request Payment Extension" size="lg">
      <div className="space-y-4">
        <Input
          label="Original Due Date"
          type="date"
          value={originalDueDate}
          onChange={(e) => setOriginalDueDate(e.target.value)}
          required
        />
        <Input
          label="Extension Days"
          type="number"
          min="1"
          value={extensionDays}
          onChange={(e) => setExtensionDays(e.target.value)}
          required
        />
        <Select
          label="Extension Type"
          value={extensionType}
          onChange={(e) => setExtensionType(e.target.value)}
          options={[
            { value: 'One-Time Courtesy', label: 'One-Time Courtesy' },
            { value: 'Hardship-Based', label: 'Hardship-Based' },
            { value: 'Standard', label: 'Standard' },
          ]}
        />
        <Input
          label="Request Reason"
          value={requestReason}
          onChange={(e) => setRequestReason(e.target.value)}
          placeholder="Reason for extension request..."
        />
        {extensionType === 'Hardship-Based' && (
          <Input
            label="Hardship Details"
            value={hardshipDetails}
            onChange={(e) => setHardshipDetails(e.target.value)}
            placeholder="Describe the financial hardship..."
          />
        )}
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!originalDueDate || !extensionDays}>
            Submit Request
          </Button>
        </div>
      </div>
    </Modal>
  );
}

function DisputeModal({ isOpen, onClose, loanId, onCreate }: any) {
  const [disputeType, setDisputeType] = useState('Payment Dispute');
  const [description, setDescription] = useState('');
  const [disputedAmount, setDisputedAmount] = useState('');
  const [borrowerStatement, setBorrowerStatement] = useState('');

  const handleSubmit = () => {
    onCreate({
      loanId,
      disputeType,
      description,
      disputedAmount: disputedAmount ? parseFloat(disputedAmount) : undefined,
      borrowerStatement,
    });
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="File Dispute" size="lg">
      <div className="space-y-4">
        <Select
          label="Dispute Type"
          value={disputeType}
          onChange={(e) => setDisputeType(e.target.value)}
          options={[
            { value: 'Payment Dispute', label: 'Payment Dispute' },
            { value: 'Credit Reporting Dispute', label: 'Credit Reporting Dispute' },
            { value: 'Fraud Claim', label: 'Fraud Claim' },
            { value: 'Fee Dispute', label: 'Fee Dispute' },
            { value: 'Interest Dispute', label: 'Interest Dispute' },
            { value: 'Other', label: 'Other' },
          ]}
        />
        <Input
          label="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe the dispute..."
          required
        />
        <Input
          label="Disputed Amount (if applicable)"
          type="number"
          step="0.01"
          value={disputedAmount}
          onChange={(e) => setDisputedAmount(e.target.value)}
          placeholder="0.00"
        />
        <Input
          label="Your Statement"
          value={borrowerStatement}
          onChange={(e) => setBorrowerStatement(e.target.value)}
          placeholder="Your side of the story..."
        />
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!description}>
            Submit Dispute
          </Button>
        </div>
      </div>
    </Modal>
  );
}

function AccountUpdateModal({ isOpen, onClose, loanId, onCreate }: any) {
  const [updateType, setUpdateType] = useState('Address Change');
  const [newAddress, setNewAddress] = useState('');
  const [newCity, setNewCity] = useState('');
  const [newState, setNewState] = useState('');
  const [newZipCode, setNewZipCode] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [temporary, setTemporary] = useState(false);

  const handleSubmit = () => {
    onCreate({
      loanId,
      updateType,
      newAddress,
      newCity,
      newState,
      newZipCode,
      newPhone,
      newEmail,
      temporary,
    });
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Update Account Information" size="lg">
      <div className="space-y-4">
        <Select
          label="Update Type"
          value={updateType}
          onChange={(e) => setUpdateType(e.target.value)}
          options={[
            { value: 'Address Change', label: 'Address Change' },
            { value: 'Phone Change', label: 'Phone Change' },
            { value: 'Email Change', label: 'Email Change' },
            { value: 'Contact Info Change', label: 'Contact Info Change' },
            { value: 'Temporary Address', label: 'Temporary Address' },
          ]}
        />
        {(updateType === 'Address Change' || updateType === 'Contact Info Change' || updateType === 'Temporary Address') && (
          <>
            <Input
              label="New Address"
              value={newAddress}
              onChange={(e) => setNewAddress(e.target.value)}
              placeholder="Street address"
            />
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="City"
                value={newCity}
                onChange={(e) => setNewCity(e.target.value)}
              />
              <Input
                label="State"
                value={newState}
                onChange={(e) => setNewState(e.target.value)}
              />
            </div>
            <Input
              label="Zip Code"
              value={newZipCode}
              onChange={(e) => setNewZipCode(e.target.value)}
            />
            {updateType === 'Temporary Address' && (
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={temporary}
                  onChange={(e) => setTemporary(e.target.checked)}
                  className="rounded"
                />
                <label className="text-sm text-gray-700">This is a temporary address</label>
              </div>
            )}
          </>
        )}
        {(updateType === 'Phone Change' || updateType === 'Contact Info Change') && (
          <Input
            label="New Phone"
            type="tel"
            value={newPhone}
            onChange={(e) => setNewPhone(e.target.value)}
            placeholder="(555) 123-4567"
          />
        )}
        {(updateType === 'Email Change' || updateType === 'Contact Info Change') && (
          <Input
            label="New Email"
            type="email"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            placeholder="email@example.com"
          />
        )}
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>Submit Update</Button>
        </div>
      </div>
    </Modal>
  );
}

function FeeWaiverModal({ isOpen, onClose, loanId, onCreate }: any) {
  const [waiverType, setWaiverType] = useState('One-Time Courtesy');
  const [feeType, setFeeType] = useState('Late Fee');
  const [feeAmount, setFeeAmount] = useState('');
  const [requestReason, setRequestReason] = useState('');

  const handleSubmit = () => {
    onCreate({
      loanId,
      waiverType,
      feeType,
      feeAmount: parseFloat(feeAmount),
      requestReason,
    });
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Request Fee Waiver" size="md">
      <div className="space-y-4">
        <Select
          label="Waiver Type"
          value={waiverType}
          onChange={(e) => setWaiverType(e.target.value)}
          options={[
            { value: 'One-Time Courtesy', label: 'One-Time Courtesy' },
            { value: 'Systematic Waiver', label: 'Systematic Waiver' },
            { value: 'Hardship Waiver', label: 'Hardship Waiver' },
            { value: 'Policy Waiver', label: 'Policy Waiver' },
          ]}
        />
        <Select
          label="Fee Type"
          value={feeType}
          onChange={(e) => setFeeType(e.target.value)}
          options={[
            { value: 'Late Fee', label: 'Late Fee' },
            { value: 'Penalty', label: 'Penalty' },
            { value: 'Interest', label: 'Interest' },
            { value: 'Processing Fee', label: 'Processing Fee' },
            { value: 'Other', label: 'Other' },
          ]}
        />
        <Input
          label="Fee Amount"
          type="number"
          step="0.01"
          value={feeAmount}
          onChange={(e) => setFeeAmount(e.target.value)}
          placeholder="0.00"
          required
        />
        <Input
          label="Request Reason"
          value={requestReason}
          onChange={(e) => setRequestReason(e.target.value)}
          placeholder="Reason for fee waiver request..."
        />
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!feeAmount}>
            Submit Request
          </Button>
        </div>
      </div>
    </Modal>
  );
}

