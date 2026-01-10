'use client';

import { useState } from 'react';
import { useLoanApplicationDocuments, useRequiredDocumentsCheck, useCreateLoanApplicationDocument, useVerifyDocument, useRejectDocument, useCheckExpiredDocuments } from '@/lib/hooks/useLoanApplicationDocument';
import { useActiveDocumentTypes } from '@/lib/hooks/useDocumentType';
import { usePerformWorkflowAction } from '@/lib/hooks/useLoanApplication';
import { useAuth } from '@/contexts/AuthContext';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { DocumentStatus } from '@/lib/api/loan-application-documents';
import {
  Shield,
  Upload,
  CheckCircle2,
  XCircle,
  Clock2,
  AlertCircle,
  FileText,
  File,
  Image,
  Download,
  ExternalLink,
  Calendar,
  X,
  CheckCircle,
  AlertTriangle,
} from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

interface KYCSectionProps {
  applicationId: string;
  applicationStatus: string;
  onKYCComplete?: () => void;
}

export function KYCSection({ applicationId, applicationStatus, onKYCComplete }: KYCSectionProps) {
  const { user } = useAuth();
  const { data: documents = [], isLoading: isLoadingDocuments } = useLoanApplicationDocuments(applicationId);
  const { data: documentTypes = [], isLoading: isLoadingTypes } = useActiveDocumentTypes();
  const { data: requiredCheck, isLoading: isLoadingCheck } = useRequiredDocumentsCheck(applicationId);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showVerifyModal, setShowVerifyModal] = useState<string | null>(null);
  const [showRejectModal, setShowRejectModal] = useState<string | null>(null);
  const [selectedDocumentType, setSelectedDocumentType] = useState<string>('');

  const createDocument = useCreateLoanApplicationDocument();
  const verifyDocument = useVerifyDocument();
  const rejectDocument = useRejectDocument();
  const checkExpired = useCheckExpiredDocuments();
  const performWorkflowAction = usePerformWorkflowAction();

  const isKYCPending = applicationStatus === 'KYC Pending' || applicationStatus === 'KYC PENDING';
  const isKYCComplete = applicationStatus === 'KYC Complete' || applicationStatus === 'KYC COMPLETE';
  const canCompleteKYC = isKYCPending && requiredCheck?.allRequiredUploaded;

  const getStatusBadge = (status: DocumentStatus) => {
    switch (status) {
      case DocumentStatus.VERIFIED:
        return (
          <Badge variant="success" size="sm" className="flex items-center gap-1 w-fit">
            <CheckCircle2 className="w-3 h-3" />
            Verified
          </Badge>
        );
      case DocumentStatus.REJECTED:
        return (
          <Badge variant="error" size="sm" className="flex items-center gap-1 w-fit">
            <XCircle className="w-3 h-3" />
            Rejected
          </Badge>
        );
      case DocumentStatus.EXPIRED:
        return (
          <Badge variant="error" size="sm" className="flex items-center gap-1 w-fit">
            <AlertCircle className="w-3 h-3" />
            Expired
          </Badge>
        );
      default:
        return (
          <Badge variant="warning" size="sm" className="flex items-center gap-1 w-fit">
            <Clock2 className="w-3 h-3" />
            Pending
          </Badge>
        );
    }
  };

  const getFileIcon = (fileType?: string) => {
    if (!fileType) return <File className="w-5 h-5" />;
    if (fileType.startsWith('image/')) return <Image className="w-5 h-5" />;
    if (fileType.includes('pdf')) return <FileText className="w-5 h-5" />;
    return <File className="w-5 h-5" />;
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'Unknown size';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleCheckExpired = () => {
    checkExpired.mutate(applicationId);
  };

  return (
    <div className="space-y-6">
      {/* KYC Status Card */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className={`p-6 border-b border-gray-200 ${
          isKYCComplete 
            ? 'bg-gradient-to-r from-secondary/10 via-secondary/5 to-white' 
            : isKYCPending
            ? 'bg-gradient-to-r from-yellow-50 to-white'
            : 'bg-gradient-to-r from-primary/10 via-primary/5 to-white'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-lg shadow-sm ${
                isKYCComplete 
                  ? 'bg-secondary/20' 
                  : isKYCPending
                  ? 'bg-yellow-100'
                  : 'bg-primary/20'
              }`}>
                <Shield className={`w-6 h-6 ${
                  isKYCComplete 
                    ? 'text-secondary' 
                    : isKYCPending
                    ? 'text-yellow-600'
                    : 'text-primary'
                }`} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">KYC Verification</h3>
                <p className="text-sm text-gray-600 mt-1">
                  {isKYCComplete 
                    ? 'KYC verification completed successfully' 
                    : isKYCPending
                    ? 'KYC verification is pending'
                    : 'KYC verification not started'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {isKYCPending && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCheckExpired}
                  disabled={checkExpired.isPending}
                  className="border-gray-300"
                >
                  <AlertCircle className="w-4 h-4 mr-2" />
                  Check Expired
                </Button>
              )}
              {isKYCPending && (
                <Button
                  onClick={() => setShowUploadModal(true)}
                  className="bg-primary hover:bg-primary/90 text-white"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Document
                </Button>
              )}
              {canCompleteKYC && user?.roles?.includes('Loan Appraiser') && (
                <Button
                  onClick={() => {
                    if (window.confirm('Are you sure you want to complete KYC verification? This will move the application to KYC Complete status.')) {
                      performWorkflowAction.mutate(
                        {
                          id: applicationId,
                          action: 'Complete KYC',
                          comments: 'All required documents verified and KYC completed',
                        },
                        {
                          onSuccess: () => {
                            onKYCComplete?.();
                          },
                        }
                      );
                    }
                  }}
                  disabled={performWorkflowAction.isPending}
                  className="bg-secondary hover:bg-secondary/90 text-white"
                >
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  {performWorkflowAction.isPending ? 'Completing...' : 'Complete KYC'}
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Required Documents Checklist */}
        {!isLoadingCheck && requiredCheck && (
          <div className="p-6 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-semibold text-gray-900">Required Documents Checklist</h4>
              {requiredCheck.allRequiredUploaded ? (
                <Badge variant="success" size="sm" className="flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" />
                  All Required Documents Verified
                </Badge>
              ) : (
                <Badge variant="warning" size="sm" className="flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  Documents Pending
                </Badge>
              )}
            </div>
            <div className="space-y-2">
              {requiredCheck.missingDocuments.length > 0 && (
                <div className="flex items-start gap-2 text-sm">
                  <XCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-red-700">Missing Documents:</p>
                    <p className="text-red-600">{requiredCheck.missingDocuments.join(', ')}</p>
                  </div>
                </div>
              )}
              {requiredCheck.pendingVerification.length > 0 && (
                <div className="flex items-start gap-2 text-sm">
                  <Clock2 className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-yellow-700">Pending Verification:</p>
                    <p className="text-yellow-600">{requiredCheck.pendingVerification.join(', ')}</p>
                  </div>
                </div>
              )}
              {requiredCheck.allRequiredUploaded && (
                <div className="flex items-start gap-2 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <p className="text-green-700 font-medium">All required documents are uploaded and verified</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Documents List */}
        <div className="p-6">
          {isLoadingDocuments ? (
            <div className="text-center py-8 text-gray-500">Loading documents...</div>
          ) : documents.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600 mb-4">No documents uploaded yet</p>
              {isKYCPending && (
                <Button onClick={() => setShowUploadModal(true)}>
                  <Upload className="w-4 h-4 mr-2" />
                  Upload First Document
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-start gap-4 p-4 rounded-lg border border-gray-200 hover:border-primary/50 hover:bg-primary/5 transition-all"
                >
                  <div className={`p-2 rounded-lg flex-shrink-0 ${
                    doc.status === DocumentStatus.VERIFIED 
                      ? 'bg-secondary/10 text-secondary'
                      : doc.status === DocumentStatus.REJECTED || doc.status === DocumentStatus.EXPIRED
                      ? 'bg-red-100 text-red-600'
                      : 'bg-primary/10 text-primary'
                  }`}>
                    {getFileIcon(doc.fileType)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-gray-900 mb-1">{doc.documentName}</h4>
                        <div className="flex items-center gap-4 flex-wrap text-sm text-gray-600">
                          <span className="flex items-center gap-1">
                            <FileText className="w-4 h-4" />
                            {doc.documentType}
                          </span>
                          {doc.documentNumber && (
                            <span>Number: {doc.documentNumber}</span>
                          )}
                          {doc.fileSize && (
                            <span>{formatFileSize(doc.fileSize)}</span>
                          )}
                          {doc.expiryDate && (
                            <span className={`flex items-center gap-1 ${
                              new Date(doc.expiryDate) < new Date() ? 'text-red-600 font-medium' : ''
                            }`}>
                              <Calendar className="w-4 h-4" />
                              Expires: {format(new Date(doc.expiryDate), 'MMM d, yyyy')}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {getStatusBadge(doc.status)}
                      </div>
                    </div>
                    {doc.remarks && (
                      <p className="text-sm text-gray-600 mt-2 italic">"{doc.remarks}"</p>
                    )}
                    {doc.rejectionReason && (
                      <p className="text-sm text-red-600 mt-2">
                        <strong>Rejection Reason:</strong> {doc.rejectionReason}
                      </p>
                    )}
                    {doc.verificationDate && (
                      <p className="text-xs text-gray-500 mt-2">
                        Verified on {format(new Date(doc.verificationDate), 'MMM d, yyyy')}
                      </p>
                    )}
                    <div className="flex items-center gap-2 mt-3">
                      {doc.fileUrl && (
                        <>
                          <a
                            href={doc.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-primary hover:bg-primary/10 rounded-lg transition-colors"
                          >
                            <ExternalLink className="w-4 h-4" />
                            View
                          </a>
                          <a
                            href={doc.fileUrl}
                            download
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                          >
                            <Download className="w-4 h-4" />
                            Download
                          </a>
                        </>
                      )}
                      {isKYCPending && doc.status === DocumentStatus.PENDING && user?.roles?.includes('Loan Appraiser') && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShowVerifyModal(doc.id)}
                            className="border-green-300 text-green-700 hover:bg-green-50"
                          >
                            <CheckCircle2 className="w-4 h-4 mr-1" />
                            Verify
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShowRejectModal(doc.id)}
                            className="border-red-300 text-red-700 hover:bg-red-50"
                          >
                            <XCircle className="w-4 h-4 mr-1" />
                            Reject
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Upload Document Modal */}
      <DocumentUploadModal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        applicationId={applicationId}
        documentTypes={documentTypes}
        selectedType={selectedDocumentType}
        onSelectType={setSelectedDocumentType}
        onCreate={createDocument}
      />

      {/* Verify Document Modal */}
      {showVerifyModal && (
        <DocumentVerifyModal
          isOpen={!!showVerifyModal}
          onClose={() => setShowVerifyModal(null)}
          documentId={showVerifyModal}
          onVerify={verifyDocument}
          verifiedBy={user?.id || ''}
        />
      )}

      {/* Reject Document Modal */}
      {showRejectModal && (
        <DocumentRejectModal
          isOpen={!!showRejectModal}
          onClose={() => setShowRejectModal(null)}
          documentId={showRejectModal}
          onReject={rejectDocument}
          verifiedBy={user?.id || ''}
        />
      )}
    </div>
  );
}

// Document Upload Modal Component
interface DocumentUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  applicationId: string;
  documentTypes: any[];
  selectedType: string;
  onSelectType: (type: string) => void;
  onCreate: any;
}

function DocumentUploadModal({
  isOpen,
  onClose,
  applicationId,
  documentTypes,
  selectedType,
  onSelectType,
  onCreate,
}: DocumentUploadModalProps) {
  const [documentName, setDocumentName] = useState('');
  const [documentNumber, setDocumentNumber] = useState('');
  const [fileUrl, setFileUrl] = useState('');
  const [issueDate, setIssueDate] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [file, setFile] = useState<File | null>(null);

  const selectedDocType = documentTypes.find((dt) => dt.code === selectedType);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setDocumentName(selectedFile.name);
      
      // Validate file type
      if (selectedDocType?.allowedFileTypes) {
        const allowedTypes = selectedDocType.allowedFileTypes.split(',').map((t: string) => t.trim());
        if (!allowedTypes.includes(selectedFile.type)) {
          toast.error(`File type not allowed. Allowed types: ${selectedDocType.allowedFileTypes}`);
          return;
        }
      }

      // Validate file size
      if (selectedDocType?.maxFileSize && selectedFile.size > selectedDocType.maxFileSize) {
        toast.error(`File size exceeds maximum allowed size of ${(selectedDocType.maxFileSize / (1024 * 1024)).toFixed(1)} MB`);
        return;
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedType) {
      toast.error('Please select a document type');
      return;
    }

    if (!documentName) {
      toast.error('Please enter document name');
      return;
    }

    // For now, we'll use fileUrl. In production, you'd upload the file first
    if (!fileUrl && !file) {
      toast.error('Please provide a file URL or upload a file');
      return;
    }

    const createDto = {
      loanApplicationId: applicationId,
      documentType: selectedType,
      documentName,
      documentNumber: documentNumber || undefined,
      fileUrl: fileUrl || undefined,
      fileType: file?.type || undefined,
      fileSize: file?.size || undefined,
      issueDate: issueDate || undefined,
      expiryDate: expiryDate || undefined,
      isRequired: selectedDocType?.isRequired || false,
    };

    onCreate.mutate(createDto, {
      onSuccess: () => {
        setDocumentName('');
        setDocumentNumber('');
        setFileUrl('');
        setIssueDate('');
        setExpiryDate('');
        setFile(null);
        onSelectType('');
        onClose();
      },
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Upload Document" size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Document Type <span className="text-red-500">*</span>
          </label>
          <select
            value={selectedType}
            onChange={(e) => onSelectType(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
            required
          >
            <option value="">Select document type</option>
            {documentTypes.map((dt) => (
              <option key={dt.id} value={dt.code}>
                {dt.name} {dt.isRequired && '(Required)'}
              </option>
            ))}
          </select>
          {selectedDocType && (
            <p className="text-xs text-gray-500 mt-1">
              {selectedDocType.description}
              {selectedDocType.allowedFileTypes && (
                <> • Allowed: {selectedDocType.allowedFileTypes}</>
              )}
              {selectedDocType.maxFileSize && (
                <> • Max size: {(selectedDocType.maxFileSize / (1024 * 1024)).toFixed(1)} MB</>
              )}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Document Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={documentName}
            onChange={(e) => setDocumentName(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
            required
            placeholder="e.g., PAN Card, Aadhaar Card"
          />
        </div>

        {selectedDocType && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Document Number
            </label>
            <input
              type="text"
              value={documentNumber}
              onChange={(e) => setDocumentNumber(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
              placeholder="e.g., PAN number, Aadhaar number"
            />
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            File URL <span className="text-gray-500">(or upload file below)</span>
          </label>
          <input
            type="url"
            value={fileUrl}
            onChange={(e) => setFileUrl(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
            placeholder="https://example.com/document.pdf"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Upload File
          </label>
          <input
            type="file"
            onChange={handleFileChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
            accept={selectedDocType?.allowedFileTypes || '*'}
          />
          {file && (
            <p className="text-xs text-gray-500 mt-1">
              Selected: {file.name} ({(file.size / 1024).toFixed(1)} KB)
            </p>
          )}
        </div>

        {selectedDocType?.hasExpiry && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Issue Date
              </label>
              <input
                type="date"
                value={issueDate}
                onChange={(e) => setIssueDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Expiry Date
              </label>
              <input
                type="date"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
              />
            </div>
          </>
        )}

        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={onCreate.isPending}>
            {onCreate.isPending ? 'Uploading...' : 'Upload Document'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

// Document Verify Modal Component
interface DocumentVerifyModalProps {
  isOpen: boolean;
  onClose: () => void;
  documentId: string;
  onVerify: any;
  verifiedBy: string;
}

function DocumentVerifyModal({
  isOpen,
  onClose,
  documentId,
  onVerify,
  verifiedBy,
}: DocumentVerifyModalProps) {
  const [remarks, setRemarks] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onVerify.mutate(
      {
        id: documentId,
        verifyDto: {
          verifiedBy,
          remarks: remarks || undefined,
        },
      },
      {
        onSuccess: () => {
          setRemarks('');
          onClose();
        },
      }
    );
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Verify Document" size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Verification Remarks
          </label>
          <textarea
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
            rows={4}
            placeholder="Add any remarks about the verification..."
          />
        </div>
        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={onVerify.isPending} className="bg-secondary hover:bg-secondary/90 text-white">
            {onVerify.isPending ? 'Verifying...' : 'Verify Document'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

// Document Reject Modal Component
interface DocumentRejectModalProps {
  isOpen: boolean;
  onClose: () => void;
  documentId: string;
  onReject: any;
  verifiedBy: string;
}

function DocumentRejectModal({
  isOpen,
  onClose,
  documentId,
  onReject,
  verifiedBy,
}: DocumentRejectModalProps) {
  const [rejectionReason, setRejectionReason] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!rejectionReason.trim()) {
      toast.error('Please provide a rejection reason');
      return;
    }

    onReject.mutate(
      {
        id: documentId,
        rejectDto: {
          verifiedBy,
          rejectionReason,
        },
      },
      {
        onSuccess: () => {
          setRejectionReason('');
          onClose();
        },
      }
    );
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Reject Document" size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Rejection Reason <span className="text-red-500">*</span>
          </label>
          <textarea
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
            rows={4}
            placeholder="Please provide a reason for rejecting this document..."
            required
          />
        </div>
        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={onReject.isPending} variant="danger">
            {onReject.isPending ? 'Rejecting...' : 'Reject Document'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

