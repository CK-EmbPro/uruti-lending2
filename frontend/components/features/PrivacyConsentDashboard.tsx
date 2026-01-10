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
  useCreateConsent,
  usePrivacyConsents,
  useWithdrawConsent,
  useCreatePrivacyRequest,
  usePrivacyRequests,
  useProcessPrivacyRequest,
  useCompletePrivacyRequest,
  useRejectPrivacyRequest,
} from '@/lib/hooks/useCompliance';
import {
  Lock,
  Shield,
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  Plus,
  Eye,
  Download,
  Trash2,
} from 'lucide-react';
import { format } from 'date-fns';
import type { ConsentType, ConsentStatus, RequestType, RequestStatus } from '@/lib/api/compliance';

export function PrivacyConsentDashboard() {
  const [activeView, setActiveView] = useState<'consents' | 'requests'>('consents');
  const [selectedStatus, setSelectedStatus] = useState<ConsentStatus | ''>('');
  const [showConsentModal, setShowConsentModal] = useState(false);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [showProcessModal, setShowProcessModal] = useState(false);
  const [selectedConsent, setSelectedConsent] = useState<string | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<string | null>(null);
  const [consentType, setConsentType] = useState<ConsentType>('MARKETING');
  const [consentStatus, setConsentStatus] = useState<ConsentStatus>('GRANTED');
  const [requestType, setRequestType] = useState<RequestType>('ACCESS');
  const [requestDescription, setRequestDescription] = useState('');
  const [withdrawalReason, setWithdrawalReason] = useState('');
  const [processingNotes, setProcessingNotes] = useState('');
  const [responseData, setResponseData] = useState('');

  const createConsent = useCreateConsent();
  const { data: consents, isLoading: consentsLoading, refetch: refetchConsents } = usePrivacyConsents({
    status: selectedStatus || undefined,
  });
  const withdrawConsent = useWithdrawConsent();
  const createRequest = useCreatePrivacyRequest();
  const { data: requests, isLoading: requestsLoading, refetch: refetchRequests } = usePrivacyRequests();
  const processRequest = useProcessPrivacyRequest();
  const completeRequest = useCompletePrivacyRequest();
  const rejectRequest = useRejectPrivacyRequest();

  const handleCreateConsent = () => {
    createConsent.mutate(
      {
        consentType,
        status: consentStatus,
      },
      {
        onSuccess: () => {
          setShowConsentModal(false);
          setConsentType('MARKETING');
          setConsentStatus('GRANTED');
          refetchConsents();
        },
      },
    );
  };

  const handleWithdraw = () => {
    if (!selectedConsent) return;

    withdrawConsent.mutate(
      {
        id: selectedConsent,
        dto: {
          withdrawalReason,
        },
      },
      {
        onSuccess: () => {
          setSelectedConsent(null);
          setWithdrawalReason('');
          refetchConsents();
        },
      },
    );
  };

  const handleCreateRequest = () => {
    createRequest.mutate(
      {
        customerId: 'customer-123', // TODO: Get from context
        requestType,
        description: requestDescription,
      },
      {
        onSuccess: () => {
          setShowRequestModal(false);
          setRequestType('ACCESS');
          setRequestDescription('');
          refetchRequests();
        },
      },
    );
  };

  const handleProcess = () => {
    if (!selectedRequest) return;

    processRequest.mutate(
      {
        id: selectedRequest,
        dto: {
          processingNotes,
          responseData,
        },
      },
      {
        onSuccess: () => {
          setShowProcessModal(false);
          setSelectedRequest(null);
          setProcessingNotes('');
          setResponseData('');
          refetchRequests();
        },
      },
    );
  };

  const handleComplete = (id: string) => {
    completeRequest.mutate(
      {
        id,
        dto: {},
      },
      {
        onSuccess: () => {
          refetchRequests();
        },
      },
    );
  };

  const handleReject = (id: string) => {
    const reason = prompt('Enter rejection reason:');
    if (reason) {
      rejectRequest.mutate(
        {
          id,
          dto: {
            rejectionReason: reason,
          },
        },
        {
          onSuccess: () => {
            refetchRequests();
          },
        },
      );
    }
  };

  const getStatusColor = (status: ConsentStatus | RequestStatus) => {
    switch (status) {
      case 'GRANTED':
      case 'COMPLETED':
        return 'bg-green-100 text-green-800';
      case 'DENIED':
      case 'REJECTED':
        return 'bg-red-100 text-red-800';
      case 'WITHDRAWN':
        return 'bg-orange-100 text-orange-800';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'IN_PROGRESS':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const grantedCount = consents?.filter((c) => c.status === 'GRANTED').length || 0;
  const pendingRequests = requests?.filter((r) => r.status === 'PENDING').length || 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Privacy & Consent Management</h2>
          <p className="text-sm text-gray-600 mt-1">Manage privacy consents and handle GDPR/CCPA requests</p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant={activeView === 'consents' ? 'default' : 'outline'}
            onClick={() => setActiveView('consents')}
          >
            Consents
          </Button>
          <Button
            variant={activeView === 'requests' ? 'default' : 'outline'}
            onClick={() => setActiveView('requests')}
          >
            Requests
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <div className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Consents</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{consents?.length || 0}</p>
              </div>
              <Lock className="h-8 w-8 text-blue-600" />
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Granted</p>
                <p className="text-2xl font-bold text-green-600 mt-1">{grantedCount}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending Requests</p>
                <p className="text-2xl font-bold text-yellow-600 mt-1">{pendingRequests}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-600" />
            </div>
          </div>
        </Card>
      </div>

      {activeView === 'consents' && (
        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Privacy Consents</h3>
              <div className="flex items-center gap-3">
                <Select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value as ConsentStatus | '')}
                  className="w-40"
                >
                  <option value="">All Status</option>
                  <option value="GRANTED">Granted</option>
                  <option value="DENIED">Denied</option>
                  <option value="WITHDRAWN">Withdrawn</option>
                  <option value="PENDING">Pending</option>
                </Select>
                <Button onClick={() => setShowConsentModal(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Consent
                </Button>
              </div>
            </div>

            {consentsLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : consents && consents.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
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
                        Explicit
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {consents.map((consent) => (
                      <tr key={consent.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge>{consent.consentType.replace(/_/g, ' ')}</Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {format(new Date(consent.consentDate), 'MMM dd, yyyy')}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge className={getStatusColor(consent.status)}>{consent.status}</Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {consent.explicitConsent ? (
                            <CheckCircle className="h-5 w-5 text-green-600" />
                          ) : (
                            <XCircle className="h-5 w-5 text-gray-400" />
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          {consent.status === 'GRANTED' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedConsent(consent.id);
                                setWithdrawalReason('');
                                // Show withdraw modal
                                const reason = prompt('Enter withdrawal reason:');
                                if (reason) {
                                  setWithdrawalReason(reason);
                                  handleWithdraw();
                                }
                              }}
                            >
                              <XCircle className="h-4 w-4 mr-1" />
                              Withdraw
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12">
                <Lock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No privacy consents found</p>
              </div>
            )}
          </div>
        </Card>
      )}

      {activeView === 'requests' && (
        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Privacy Requests</h3>
              <Button onClick={() => setShowRequestModal(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Request
              </Button>
            </div>

            {requestsLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-20 w-full" />
                ))}
              </div>
            ) : requests && requests.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
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
                        Description
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {requests.map((request) => (
                      <tr key={request.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge>{request.requestType.replace(/_/g, ' ')}</Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {format(new Date(request.requestDate), 'MMM dd, yyyy')}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge className={getStatusColor(request.status)}>{request.status}</Badge>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">{request.description}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center gap-2">
                            {request.status === 'PENDING' && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedRequest(request.id);
                                  setShowProcessModal(true);
                                }}
                              >
                                <Eye className="h-4 w-4 mr-1" />
                                Process
                              </Button>
                            )}
                            {request.status === 'IN_PROGRESS' && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleComplete(request.id)}
                              >
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Complete
                              </Button>
                            )}
                            {request.status === 'PENDING' && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleReject(request.id)}
                              >
                                <XCircle className="h-4 w-4 mr-1" />
                                Reject
                              </Button>
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
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No privacy requests found</p>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Create Consent Modal */}
      <Modal
        isOpen={showConsentModal}
        onClose={() => {
          setShowConsentModal(false);
          setConsentType('MARKETING');
          setConsentStatus('GRANTED');
        }}
        title="Create Privacy Consent"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Consent Type</label>
            <Select value={consentType} onChange={(e) => setConsentType(e.target.value as ConsentType)}>
              <option value="MARKETING">Marketing</option>
              <option value="DATA_SHARING">Data Sharing</option>
              <option value="CREDIT_BUREAU">Credit Bureau</option>
              <option value="THIRD_PARTY">Third Party</option>
              <option value="ANALYTICS">Analytics</option>
              <option value="COMMUNICATION">Communication</option>
            </Select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <Select value={consentStatus} onChange={(e) => setConsentStatus(e.target.value as ConsentStatus)}>
              <option value="GRANTED">Granted</option>
              <option value="DENIED">Denied</option>
              <option value="PENDING">Pending</option>
            </Select>
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setShowConsentModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateConsent} disabled={createConsent.isPending}>
              {createConsent.isPending ? 'Creating...' : 'Create'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Create Request Modal */}
      <Modal
        isOpen={showRequestModal}
        onClose={() => {
          setShowRequestModal(false);
          setRequestType('ACCESS');
          setRequestDescription('');
        }}
        title="Create Privacy Request"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Request Type</label>
            <Select value={requestType} onChange={(e) => setRequestType(e.target.value as RequestType)}>
              <option value="ACCESS">Access</option>
              <option value="DELETION">Deletion</option>
              <option value="RECTIFICATION">Rectification</option>
              <option value="PORTABILITY">Portability</option>
              <option value="RESTRICTION">Restriction</option>
              <option value="OBJECTION">Objection</option>
            </Select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
            <Textarea
              value={requestDescription}
              onChange={(e) => setRequestDescription(e.target.value)}
              placeholder="Describe the privacy request..."
              rows={4}
            />
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setShowRequestModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateRequest} disabled={!requestDescription || createRequest.isPending}>
              {createRequest.isPending ? 'Creating...' : 'Create Request'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Process Request Modal */}
      <Modal
        isOpen={showProcessModal}
        onClose={() => {
          setShowProcessModal(false);
          setSelectedRequest(null);
          setProcessingNotes('');
          setResponseData('');
        }}
        title="Process Privacy Request"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Processing Notes</label>
            <Textarea
              value={processingNotes}
              onChange={(e) => setProcessingNotes(e.target.value)}
              placeholder="Document processing steps..."
              rows={3}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Response Data (for Access/Portability)</label>
            <Textarea
              value={responseData}
              onChange={(e) => setResponseData(e.target.value)}
              placeholder="Data to be provided..."
              rows={4}
            />
          </div>
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => {
                setShowProcessModal(false);
                setSelectedRequest(null);
                setProcessingNotes('');
                setResponseData('');
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleProcess} disabled={!processingNotes || processRequest.isPending}>
              {processRequest.isPending ? 'Processing...' : 'Process Request'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

