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
  useCreateSignatureRequest,
  useSignDocument,
  useNotarizeDocument,
} from '@/lib/hooks/useLoanBooking';
import {
  FileText,
  Download,
  CheckCircle2,
  Clock,
  XCircle,
  Send,
  PenTool,
  FileCheck,
  Loader2,
  Eye,
  AlertCircle,
} from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

interface DocumentManagementSectionProps {
  loanId: string;
}

export function DocumentManagementSection({ loanId }: DocumentManagementSectionProps) {
  const [showSignatureModal, setShowSignatureModal] = useState(false);
  const [showNotarizeModal, setShowNotarizeModal] = useState(false);
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(null);
  const [signatureData, setSignatureData] = useState('');
  const [notaryName, setNotaryName] = useState('');
  const [notaryLicense, setNotaryLicense] = useState('');
  const [signerName, setSignerName] = useState('');
  const [signerEmail, setSignerEmail] = useState('');

  const { data: booking, isLoading } = useLoanBookingForLoan(loanId);
  const createSignatureRequest = useCreateSignatureRequest();
  const signDocument = useSignDocument();
  const notarizeDocument = useNotarizeDocument();

  // Mock documents - in production, these would come from a separate API call
  const documents: any[] = [];

  const handleCreateSignatureRequest = async (documentId: string) => {
    if (!signerName.trim()) {
      toast.error('Please enter signer name');
      return;
    }

    try {
      await createSignatureRequest.mutateAsync({
        documentId,
        data: {
          documentId,
          signatureType: 'E-Signature',
          signerId: 'current-user-id', // Would come from auth context
          signerName,
          signerEmail: signerEmail || undefined,
        },
      });
      setShowSignatureModal(false);
      setSignerName('');
      setSignerEmail('');
      setSelectedDocumentId(null);
    } catch (error) {
      // Error handled by hook
    }
  };

  const handleSignDocument = async (signatureId: string) => {
    if (!signatureData.trim()) {
      toast.error('Please provide signature data');
      return;
    }

    try {
      await signDocument.mutateAsync({
        signatureId,
        data: {
          signatureData,
          ipAddress: '0.0.0.0', // Would get from request
          userAgent: navigator.userAgent,
        },
      });
      setSignatureData('');
    } catch (error) {
      // Error handled by hook
    }
  };

  const handleNotarizeDocument = async (signatureId: string) => {
    if (!notaryName.trim() || !notaryLicense.trim()) {
      toast.error('Please enter notary information');
      return;
    }

    try {
      await notarizeDocument.mutateAsync({
        signatureId,
        data: {
          notaryName,
          notaryLicenseNumber: notaryLicense,
        },
      });
      setShowNotarizeModal(false);
      setNotaryName('');
      setNotaryLicense('');
      setSelectedDocumentId(null);
    } catch (error) {
      // Error handled by hook
    }
  };

  const getDocumentStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; variant: 'success' | 'warning' | 'error' | 'info' }> = {
      Draft: { label: 'Draft', variant: 'info' },
      Generated: { label: 'Generated', variant: 'info' },
      'Pending Signature': { label: 'Pending Signature', variant: 'warning' },
      Signed: { label: 'Signed', variant: 'success' },
      Notarized: { label: 'Notarized', variant: 'success' },
      Completed: { label: 'Completed', variant: 'success' },
      Expired: { label: 'Expired', variant: 'error' },
    };

    const statusInfo = statusMap[status] || { label: status, variant: 'info' as const };
    return <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>;
  };

  const getDocumentIcon = (status: string) => {
    switch (status) {
      case 'Signed':
      case 'Notarized':
      case 'Completed':
        return <CheckCircle2 className="w-5 h-5 text-green-600" />;
      case 'Pending Signature':
        return <Clock className="w-5 h-5 text-yellow-600" />;
      case 'Expired':
        return <XCircle className="w-5 h-5 text-red-600" />;
      default:
        return <FileText className="w-5 h-5 text-gray-600" />;
    }
  };

  if (isLoading) {
    return (
      <Card title="Document Management">
        <Skeleton className="h-32 w-full" />
      </Card>
    );
  }

  if (!booking) {
    return (
      <Card title="Document Management">
        <Alert variant="info" title="No Booking Found">
          Create a booking first to manage loan documents.
        </Alert>
      </Card>
    );
  }

  if (documents.length === 0) {
    return (
      <Card title="Document Management">
        <Alert variant="info" title="No Documents">
          Generate documents from the booking workflow to manage them here.
        </Alert>
      </Card>
    );
  }

  return (
    <Card title="Document Management">
      <div className="space-y-4">
        {/* Documents List */}
        {documents.map((document: any) => (
          <div
            key={document.id}
            className="p-4 rounded-lg border border-gray-200 bg-white hover:border-primary/50 transition-colors"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-start gap-3 flex-1">
                {getDocumentIcon(document.status)}
                <div className="flex-1">
                  <div className="font-semibold text-gray-900 mb-1">{document.documentName}</div>
                  <div className="text-sm text-gray-600 mb-2">{document.documentType}</div>
                  <div className="flex items-center gap-2">
                    {getDocumentStatusBadge(document.status)}
                    {document.generatedDate && (
                      <span className="text-xs text-gray-500">
                        Generated: {format(new Date(document.generatedDate), 'MMM dd, yyyy')}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              {document.fileUrl && (
                <Button size="sm" variant="outline">
                  <a href={document.fileUrl} target="_blank" rel="noopener noreferrer">
                    <Download className="w-4 h-4 mr-1" />
                    Download
                  </a>
                </Button>
              )}
            </div>

            {/* Document Actions */}
            <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-gray-100">
              {document.status === 'Generated' && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setSelectedDocumentId(document.id);
                    setShowSignatureModal(true);
                  }}
                >
                  <Send className="w-3 h-3 mr-1" />
                  Request Signature
                </Button>
              )}
              {document.status === 'Pending Signature' && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    // In production, this would open a signature pad
                    toast('Signature pad would open here', { icon: 'ℹ️' });
                  }}
                >
                  <PenTool className="w-3 h-3 mr-1" />
                  Sign Document
                </Button>
              )}
              {document.status === 'Signed' && booking.requiresNotarization && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setSelectedDocumentId(document.id);
                    setShowNotarizeModal(true);
                  }}
                >
                  <FileCheck className="w-3 h-3 mr-1" />
                  Notarize
                </Button>
              )}
              {document.fileUrl && (
                <Button size="sm" variant="outline">
                  <a href={document.fileUrl} target="_blank" rel="noopener noreferrer">
                    <Eye className="w-3 h-3 mr-1" />
                    View
                  </a>
                </Button>
              )}
            </div>

            {/* Signatures List */}
            {document.signatures && document.signatures.length > 0 && (
              <div className="mt-3 pt-3 border-t border-gray-100">
                <div className="text-xs font-semibold text-gray-700 mb-2">Signatures</div>
                <div className="space-y-2">
                  {document.signatures.map((signature: any) => (
                    <div
                      key={signature.id}
                      className="flex items-center justify-between p-2 rounded bg-gray-50"
                    >
                      <div className="flex items-center gap-2">
                        {signature.status === 'Signed' ? (
                          <CheckCircle2 className="w-4 h-4 text-green-600" />
                        ) : (
                          <Clock className="w-4 h-4 text-yellow-600" />
                        )}
                        <div>
                          <div className="text-xs font-medium">{signature.signerName}</div>
                          <div className="text-xs text-gray-500">{signature.signatureType}</div>
                        </div>
                      </div>
                      <Badge
                        variant={
                          signature.status === 'Signed' ? 'success' : 'warning'
                        }
                      >
                        {signature.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Expiry Warning */}
            {document.expiryDate &&
              new Date(document.expiryDate) < new Date() &&
              document.status !== 'Signed' && (
                <Alert variant="warning" className="mt-3">
                  This document has expired. Please regenerate it.
                </Alert>
              )}
          </div>
        ))}

        {/* Request Signature Modal */}
        <Modal
          isOpen={showSignatureModal}
          onClose={() => {
            setShowSignatureModal(false);
            setSignerName('');
            setSignerEmail('');
            setSelectedDocumentId(null);
          }}
          title="Request Signature"
          size="md"
          footer={
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  setShowSignatureModal(false);
                  setSignerName('');
                  setSignerEmail('');
                  setSelectedDocumentId(null);
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  if (selectedDocumentId) {
                    handleCreateSignatureRequest(selectedDocumentId);
                  }
                }}
                disabled={!signerName.trim() || createSignatureRequest.isPending}
              >
                {createSignatureRequest.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Send Request
                  </>
                )}
              </Button>
            </div>
          }
        >
          <div className="space-y-4">
            <Alert variant="info">
              Send a signature request to the borrower. They will receive an email with a link to
              sign the document.
            </Alert>

            <Input
              label="Signer Name"
              value={signerName}
              onChange={(e) => setSignerName(e.target.value)}
              placeholder="Enter signer's full name"
              required
            />

            <Input
              label="Signer Email"
              type="email"
              value={signerEmail}
              onChange={(e) => setSignerEmail(e.target.value)}
              placeholder="signer@example.com"
            />
          </div>
        </Modal>

        {/* Notarize Document Modal */}
        <Modal
          isOpen={showNotarizeModal}
          onClose={() => {
            setShowNotarizeModal(false);
            setNotaryName('');
            setNotaryLicense('');
            setSelectedDocumentId(null);
          }}
          title="Notarize Document"
          size="md"
          footer={
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  setShowNotarizeModal(false);
                  setNotaryName('');
                  setNotaryLicense('');
                  setSelectedDocumentId(null);
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  if (selectedDocumentId) {
                    // In production, would get signature ID from document
                    handleNotarizeDocument('signature-id');
                  }
                }}
                disabled={
                  !notaryName.trim() ||
                  !notaryLicense.trim() ||
                  notarizeDocument.isPending
                }
              >
                {notarizeDocument.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Notarizing...
                  </>
                ) : (
                  <>
                    <FileCheck className="w-4 h-4 mr-2" />
                    Notarize Document
                  </>
                )}
              </Button>
            </div>
          }
        >
          <div className="space-y-4">
            <Alert variant="info">
              Record notarization details for this document. Ensure the notary has properly
              verified the signer's identity.
            </Alert>

            <Input
              label="Notary Name"
              value={notaryName}
              onChange={(e) => setNotaryName(e.target.value)}
              placeholder="Enter notary's full name"
              required
            />

            <Input
              label="Notary License Number"
              value={notaryLicense}
              onChange={(e) => setNotaryLicense(e.target.value)}
              placeholder="Enter license number"
              required
            />
          </div>
        </Modal>
      </div>
    </Card>
  );
}

