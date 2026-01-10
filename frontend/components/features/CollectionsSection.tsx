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
  useLoanWorkflow,
  useLoanActivities,
  useCreateCollectionActivity,
  useCreatePromiseToPay,
  useCreatePaymentArrangement,
  useLoanPaymentArrangements,
  useCreateSkipTrace,
  useCreateLegalAction,
  useCreateThirdPartyPlacement,
  useCollectionAgencies,
  useProcessChargeOff,
  useSendNotice,
} from '@/lib/hooks/useCollections';
import {
  AlertCircle,
  Phone,
  Mail,
  MessageSquare,
  FileText,
  Calendar,
  DollarSign,
  TrendingUp,
  Scale,
  Building2,
  XCircle,
  CheckCircle,
  Clock,
  UserSearch,
  Send,
} from 'lucide-react';
import { format } from 'date-fns';

interface CollectionsSectionProps {
  loanId: string;
  daysPastDue: number;
  outstandingBalance: number;
}

export function CollectionsSection({ loanId, daysPastDue, outstandingBalance }: CollectionsSectionProps) {
  const [showActivityModal, setShowActivityModal] = useState(false);
  const [showPromiseModal, setShowPromiseModal] = useState(false);
  const [showArrangementModal, setShowArrangementModal] = useState(false);
  const [showSkipTraceModal, setShowSkipTraceModal] = useState(false);
  const [showLegalActionModal, setShowLegalActionModal] = useState(false);
  const [showPlacementModal, setShowPlacementModal] = useState(false);
  const [showChargeOffModal, setShowChargeOffModal] = useState(false);

  const { data: workflow, isLoading: workflowLoading } = useLoanWorkflow(loanId);
  const { data: activities, isLoading: activitiesLoading } = useLoanActivities(loanId);
  const { data: arrangements, isLoading: arrangementsLoading } = useLoanPaymentArrangements(loanId);
  const { data: agencies } = useCollectionAgencies();

  const createActivity = useCreateCollectionActivity();
  const createPromise = useCreatePromiseToPay();
  const createArrangement = useCreatePaymentArrangement();
  const createSkipTrace = useCreateSkipTrace();
  const createLegalAction = useCreateLegalAction();
  const createPlacement = useCreateThirdPartyPlacement();
  const processChargeOff = useProcessChargeOff();
  const sendNotice = useSendNotice();

  const getCollectionStage = (dpd: number) => {
    if (dpd <= 30) return 'Early Delinquency';
    if (dpd <= 60) return 'Moderate Delinquency';
    if (dpd <= 90) return 'Serious Delinquency';
    if (dpd <= 120) return 'Severe Delinquency';
    return 'Charge-Off Eligible';
  };

  const getStageColor = (stage: string) => {
    switch (stage) {
      case 'Early Delinquency':
        return 'bg-yellow-100 text-yellow-800';
      case 'Moderate Delinquency':
        return 'bg-orange-100 text-orange-800';
      case 'Serious Delinquency':
        return 'bg-red-100 text-red-800';
      case 'Severe Delinquency':
        return 'bg-red-200 text-red-900';
      case 'Charge-Off Eligible':
        return 'bg-gray-900 text-white';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const collectionStage = getCollectionStage(daysPastDue);

  if (daysPastDue === 0) {
    return null; // Don't show collections section if not delinquent
  }

  return (
    <div className="space-y-6">
      {/* Delinquency Alert */}
      <Alert variant="error" title={`Account Delinquent - ${collectionStage}`}>
        <div className="flex items-center justify-between mt-2">
          <div>
            <p className="text-sm">
              <span className="font-semibold">{daysPastDue} days past due</span> • Outstanding Balance: ${outstandingBalance.toLocaleString()}
            </p>
          </div>
          <Badge className={getStageColor(collectionStage)}>{collectionStage}</Badge>
        </div>
      </Alert>

      {/* Collection Workflow Status */}
      {workflowLoading ? (
        <Skeleton className="h-32" />
      ) : workflow ? (
        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">Collection Workflow</h3>
              <Badge className={workflow.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                {workflow.active ? 'Active' : 'Inactive'}
              </Badge>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-gray-600">Current Stage</p>
                <p className="font-semibold">{workflow.currentStage}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Notices Sent</p>
                <p className="font-semibold">{workflow.noticeCount}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Activities</p>
                <p className="font-semibold">{workflow.activityCount}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Next Follow-up</p>
                <p className="font-semibold">
                  {workflow.nextFollowUpDate ? format(new Date(workflow.nextFollowUpDate), 'MMM d, yyyy') : 'N/A'}
                </p>
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => sendNotice.mutate({ loanId, noticeType: 'First Notice', workflowId: workflow.id })}
              >
                <Send className="w-4 h-4 mr-2" />
                Send Notice
              </Button>
            </div>
          </div>
        </Card>
      ) : null}

      {/* Quick Actions */}
      <Card>
        <div className="p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Collection Actions</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Button variant="outline" size="sm" onClick={() => setShowActivityModal(true)}>
              <Phone className="w-4 h-4 mr-2" />
              Record Activity
            </Button>
            <Button variant="outline" size="sm" onClick={() => setShowPromiseModal(true)}>
              <CheckCircle className="w-4 h-4 mr-2" />
              Promise to Pay
            </Button>
            <Button variant="outline" size="sm" onClick={() => setShowArrangementModal(true)}>
              <Calendar className="w-4 h-4 mr-2" />
              Payment Plan
            </Button>
            <Button variant="outline" size="sm" onClick={() => setShowSkipTraceModal(true)}>
              <UserSearch className="w-4 h-4 mr-2" />
              Skip Trace
            </Button>
            <Button variant="outline" size="sm" onClick={() => setShowLegalActionModal(true)}>
              <Scale className="w-4 h-4 mr-2" />
              Legal Action
            </Button>
            <Button variant="outline" size="sm" onClick={() => setShowPlacementModal(true)}>
              <Building2 className="w-4 h-4 mr-2" />
              Third-Party
            </Button>
            {daysPastDue >= 120 && (
              <Button variant="danger" size="sm" onClick={() => setShowChargeOffModal(true)}>
                <XCircle className="w-4 h-4 mr-2" />
                Charge Off
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* Recent Activities */}
      {activitiesLoading ? (
        <Skeleton className="h-48" />
      ) : activities && activities.length > 0 ? (
        <Card>
          <div className="p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Recent Collection Activities</h3>
            <div className="space-y-3">
              {activities.slice(0, 5).map((activity) => (
                <div key={activity.id} className="flex items-start justify-between p-3 border border-gray-200 rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="default">{activity.activityType}</Badge>
                      <span className="text-sm text-gray-600">{format(new Date(activity.activityDate), 'MMM d, yyyy')}</span>
                    </div>
                    {activity.conversationNotes && (
                      <p className="text-sm text-gray-700 mt-1">{activity.conversationNotes}</p>
                    )}
                    {activity.outcome && (
                      <p className="text-sm font-medium text-gray-900 mt-1">Outcome: {activity.outcome}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>
      ) : null}

      {/* Payment Arrangements */}
      {arrangementsLoading ? (
        <Skeleton className="h-48" />
      ) : arrangements && arrangements.length > 0 ? (
        <Card>
          <div className="p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Active Payment Arrangements</h3>
            <div className="space-y-3">
              {arrangements
                .filter((a) => a.status === 'Active' || a.status === 'Compliant')
                .map((arrangement) => (
                  <div key={arrangement.id} className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <Badge className={arrangement.status === 'Compliant' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}>
                        {arrangement.status}
                      </Badge>
                      <span className="text-sm text-gray-600">
                        {arrangement.paymentsMade} of {arrangement.numberOfPayments} payments
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-gray-600">Payment Amount:</span>
                        <span className="font-semibold ml-2">${arrangement.paymentAmount.toLocaleString()}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Next Payment:</span>
                        <span className="font-semibold ml-2">
                          {arrangement.nextPaymentDate ? format(new Date(arrangement.nextPaymentDate), 'MMM d, yyyy') : 'N/A'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </Card>
      ) : null}

      {/* Modals */}
      <CollectionActivityModal
        isOpen={showActivityModal}
        onClose={() => setShowActivityModal(false)}
        loanId={loanId}
        onCreate={createActivity.mutate}
      />

      <PromiseToPayModal
        isOpen={showPromiseModal}
        onClose={() => setShowPromiseModal(false)}
        loanId={loanId}
        outstandingBalance={outstandingBalance}
        onCreate={createPromise.mutate}
      />

      <PaymentArrangementModal
        isOpen={showArrangementModal}
        onClose={() => setShowArrangementModal(false)}
        loanId={loanId}
        outstandingBalance={outstandingBalance}
        onCreate={createArrangement.mutate}
      />

      <SkipTraceModal
        isOpen={showSkipTraceModal}
        onClose={() => setShowSkipTraceModal(false)}
        loanId={loanId}
        onCreate={createSkipTrace.mutate}
      />

      <LegalActionModal
        isOpen={showLegalActionModal}
        onClose={() => setShowLegalActionModal(false)}
        loanId={loanId}
        outstandingBalance={outstandingBalance}
        daysPastDue={daysPastDue}
        onCreate={createLegalAction.mutate}
      />

      <ThirdPartyPlacementModal
        isOpen={showPlacementModal}
        onClose={() => setShowPlacementModal(false)}
        loanId={loanId}
        outstandingBalance={outstandingBalance}
        agencies={agencies || []}
        onCreate={createPlacement.mutate}
      />

      <ChargeOffModal
        isOpen={showChargeOffModal}
        onClose={() => setShowChargeOffModal(false)}
        loanId={loanId}
        daysPastDue={daysPastDue}
        onProcess={processChargeOff.mutate}
      />
    </div>
  );
}

// Modal Components
function CollectionActivityModal({ isOpen, onClose, loanId, onCreate }: any) {
  const [activityType, setActivityType] = useState('Phone Call');
  const [channel, setChannel] = useState('Phone');
  const [conversationNotes, setConversationNotes] = useState('');
  const [outcome, setOutcome] = useState('');

  const handleSubmit = () => {
    onCreate({
      loanId,
      activityType,
      channel,
      activityDate: new Date().toISOString(),
      conversationNotes,
      outcome,
    });
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Record Collection Activity" size="lg">
      <div className="space-y-4">
        <Select
          label="Activity Type"
          value={activityType}
          onChange={(e) => setActivityType(e.target.value)}
          options={[
            { value: 'Phone Call', label: 'Phone Call' },
            { value: 'Email Sent', label: 'Email Sent' },
            { value: 'SMS Sent', label: 'SMS Sent' },
            { value: 'Letter Sent', label: 'Letter Sent' },
            { value: 'In Person Visit', label: 'In Person Visit' },
          ]}
        />
        <Select
          label="Channel"
          value={channel}
          onChange={(e) => setChannel(e.target.value)}
          options={[
            { value: 'Phone', label: 'Phone' },
            { value: 'Email', label: 'Email' },
            { value: 'SMS', label: 'SMS' },
            { value: 'Letter', label: 'Letter' },
            { value: 'In Person', label: 'In Person' },
          ]}
        />
        <Input
          label="Conversation Notes"
          value={conversationNotes}
          onChange={(e) => setConversationNotes(e.target.value)}
          placeholder="Enter conversation notes..."
        />
        <Input
          label="Outcome"
          value={outcome}
          onChange={(e) => setOutcome(e.target.value)}
          placeholder="Promise to Pay, Payment Arrangement, Refused, etc."
        />
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>Record Activity</Button>
        </div>
      </div>
    </Modal>
  );
}

function PromiseToPayModal({ isOpen, onClose, loanId, outstandingBalance, onCreate }: any) {
  const [promisedAmount, setPromisedAmount] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [promisedBy, setPromisedBy] = useState('');
  const [notes, setNotes] = useState('');

  const handleSubmit = () => {
    onCreate({
      loanId,
      promiseDate: new Date().toISOString(),
      promisedAmount: parseFloat(promisedAmount),
      dueDate,
      promisedBy,
      notes,
    });
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Record Promise to Pay" size="md">
      <div className="space-y-4">
        <Input
          label="Promised Amount"
          type="number"
          step="0.01"
          value={promisedAmount}
          onChange={(e) => setPromisedAmount(e.target.value)}
          placeholder={outstandingBalance.toString()}
        />
        <Input
          label="Due Date"
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          required
        />
        <Input
          label="Promised By"
          value={promisedBy}
          onChange={(e) => setPromisedBy(e.target.value)}
          placeholder="Borrower name"
        />
        <Input
          label="Notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Additional notes..."
        />
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>Record Promise</Button>
        </div>
      </div>
    </Modal>
  );
}

function PaymentArrangementModal({ isOpen, onClose, loanId, outstandingBalance, onCreate }: any) {
  const [numberOfPayments, setNumberOfPayments] = useState('');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentFrequency, setPaymentFrequency] = useState('Monthly');
  const [startDate, setStartDate] = useState('');
  const [terms, setTerms] = useState('');

  const handleSubmit = () => {
    onCreate({
      loanId,
      startDate,
      totalAmount: outstandingBalance,
      numberOfPayments: parseInt(numberOfPayments),
      paymentAmount: parseFloat(paymentAmount),
      paymentFrequency,
      terms,
    });
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create Payment Arrangement" size="lg">
      <div className="space-y-4">
        <Input
          label="Start Date"
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          required
        />
        <Input
          label="Number of Payments"
          type="number"
          value={numberOfPayments}
          onChange={(e) => setNumberOfPayments(e.target.value)}
          required
        />
        <Input
          label="Payment Amount"
          type="number"
          step="0.01"
          value={paymentAmount}
          onChange={(e) => setPaymentAmount(e.target.value)}
          required
        />
        <Select
          label="Payment Frequency"
          value={paymentFrequency}
          onChange={(e) => setPaymentFrequency(e.target.value)}
          options={[
            { value: 'Weekly', label: 'Weekly' },
            { value: 'Bi-weekly', label: 'Bi-weekly' },
            { value: 'Monthly', label: 'Monthly' },
          ]}
        />
        <Input
          label="Terms"
          value={terms}
          onChange={(e) => setTerms(e.target.value)}
          placeholder="Payment arrangement terms..."
        />
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>Create Arrangement</Button>
        </div>
      </div>
    </Modal>
  );
}

function SkipTraceModal({ isOpen, onClose, loanId, onCreate }: any) {
  const [reason, setReason] = useState('');
  const [searchMethod, setSearchMethod] = useState('Database Search');

  const handleSubmit = () => {
    onCreate({
      loanId,
      reason,
      searchMethod,
    });
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Initiate Skip Trace" size="md">
      <div className="space-y-4">
        <Input
          label="Reason"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Unreachable, Address Invalid, Phone Disconnected..."
        />
        <Select
          label="Search Method"
          value={searchMethod}
          onChange={(e) => setSearchMethod(e.target.value)}
          options={[
            { value: 'Database Search', label: 'Database Search' },
            { value: 'Third-Party Service', label: 'Third-Party Service' },
            { value: 'Social Media', label: 'Social Media' },
            { value: 'Public Records', label: 'Public Records' },
          ]}
        />
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>Initiate Skip Trace</Button>
        </div>
      </div>
    </Modal>
  );
}

function LegalActionModal({ isOpen, onClose, loanId, outstandingBalance, daysPastDue, onCreate }: any) {
  const [actionType, setActionType] = useState('Small Claims');
  const [attorneyName, setAttorneyName] = useState('');
  const [remarks, setRemarks] = useState('');

  const handleSubmit = () => {
    onCreate({
      loanId,
      actionType,
      claimAmount: outstandingBalance,
      attorneyName,
      remarks,
    });
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Initiate Legal Action" size="md">
      <div className="space-y-4">
        <Alert variant="warning" title="Legal Action Requirements">
          Account must meet criteria (typically 90+ days DPD). Current DPD: {daysPastDue} days.
        </Alert>
        <Select
          label="Action Type"
          value={actionType}
          onChange={(e) => setActionType(e.target.value)}
          options={[
            { value: 'Small Claims', label: 'Small Claims' },
            { value: 'Circuit Court', label: 'Circuit Court' },
            { value: 'Bankruptcy Filing', label: 'Bankruptcy Filing' },
            { value: 'Foreclosure', label: 'Foreclosure' },
            { value: 'Repossession', label: 'Repossession' },
            { value: 'Garnishment', label: 'Garnishment' },
          ]}
        />
        <Input
          label="Attorney Name"
          value={attorneyName}
          onChange={(e) => setAttorneyName(e.target.value)}
          placeholder="Attorney or law firm name"
        />
        <Input
          label="Remarks"
          value={remarks}
          onChange={(e) => setRemarks(e.target.value)}
          placeholder="Additional remarks..."
        />
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>Initiate Legal Action</Button>
        </div>
      </div>
    </Modal>
  );
}

function ThirdPartyPlacementModal({ isOpen, onClose, loanId, outstandingBalance, agencies, onCreate }: any) {
  const [agencyId, setAgencyId] = useState('');
  const [placementReason, setPlacementReason] = useState('');

  const handleSubmit = () => {
    onCreate({
      loanId,
      agencyId,
      placementReason,
    });
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Place with Collection Agency" size="md">
      <div className="space-y-4">
        <Select
          label="Collection Agency"
          value={agencyId}
          onChange={(e) => setAgencyId(e.target.value)}
          options={agencies.map((agency: any) => ({
            value: agency.id,
            label: `${agency.name} (${agency.agencyType})`,
          }))}
          required
        />
        <Input
          label="Placement Reason"
          value={placementReason}
          onChange={(e) => setPlacementReason(e.target.value)}
          placeholder="Reason for placement..."
        />
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!agencyId}>
            Place Account
          </Button>
        </div>
      </div>
    </Modal>
  );
}

function ChargeOffModal({ isOpen, onClose, loanId, daysPastDue, onProcess }: any) {
  const [chargeOffDate, setChargeOffDate] = useState(new Date().toISOString().split('T')[0]);

  const handleSubmit = () => {
    if (window.confirm('Are you sure you want to charge off this loan? This action cannot be undone.')) {
      onProcess({
        loanId,
        chargeOffDate,
      });
      onClose();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Process Charge-Off" size="md">
      <div className="space-y-4">
        <Alert variant="error" title="Charge-Off Warning">
          This will move the loan to charge-off status. The account must have 120+ days past due (Current: {daysPastDue} days).
        </Alert>
        <Input
          label="Charge-Off Date"
          type="date"
          value={chargeOffDate}
          onChange={(e) => setChargeOffDate(e.target.value)}
          required
        />
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleSubmit}>
            Process Charge-Off
          </Button>
        </div>
      </div>
    </Modal>
  );
}

