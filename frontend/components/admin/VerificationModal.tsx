'use client';

import { useState } from 'react';
import { CustomerLoanLink, VerifyLoanLinkDto } from '@/lib/api/customer-portal-admin';
import { format } from 'date-fns';
import { X, CheckCircle, XCircle, MessageSquare, User, CreditCard, Mail, Phone, FileText, AlertCircle } from 'lucide-react';

interface VerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  link: CustomerLoanLink;
  onVerify: (linkId: string, action: VerifyLoanLinkDto) => Promise<void>;
}

export function VerificationModal({ isOpen, onClose, link, onVerify }: VerificationModalProps) {
  const [action, setAction] = useState<'approve' | 'reject' | 'request_info'>('approve');
  const [comments, setComments] = useState('');
  const [verificationMethod, setVerificationMethod] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await onVerify(link.id, {
        action,
        comments: comments.trim() || undefined,
        verificationMethod: verificationMethod.trim() || undefined,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setAction('approve');
    setComments('');
    setVerificationMethod('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={handleClose} />

        <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
          <div className="bg-white dark:bg-gray-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Loan Link Verification Details
              </h3>
              <button
                onClick={handleClose}
                className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {/* Customer Information */}
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Customer Information
                </h4>
                <div className="space-y-2 text-sm">
                  <div>
                    <p className="text-gray-600 dark:text-gray-400">Name</p>
                    <p className="text-gray-900 dark:text-white font-medium">{link.customer?.name || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-gray-600 dark:text-gray-400">Email</p>
                    <p className="text-gray-900 dark:text-white font-medium">{link.customer?.email || 'N/A'}</p>
                  </div>
                  {link.customer?.phoneNumber && (
                    <div>
                      <p className="text-gray-600 dark:text-gray-400">Phone</p>
                      <p className="text-gray-900 dark:text-white font-medium">{link.customer.phoneNumber}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-gray-600 dark:text-gray-400">Portal Account Created</p>
                    <p className="text-gray-900 dark:text-white font-medium">
                      {format(new Date(link.customer?.createdAt || link.createdAt), 'MMM d, yyyy')}
                    </p>
                  </div>
                </div>
              </div>

              {/* Loan Information */}
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                  <CreditCard className="w-4 h-4" />
                  Loan Information
                </h4>
                <div className="space-y-2 text-sm">
                  <div>
                    <p className="text-gray-600 dark:text-gray-400">Loan Number</p>
                    <p className="text-gray-900 dark:text-white font-medium">{link.loan?.loanNumber || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-gray-600 dark:text-gray-400">Loan Amount</p>
                    <p className="text-gray-900 dark:text-white font-medium">
                      ${link.loan?.loanAmount?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600 dark:text-gray-400">Product</p>
                    <p className="text-gray-900 dark:text-white font-medium">{link.loan?.loanProduct?.name || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-gray-600 dark:text-gray-400">Status</p>
                    <p className="text-gray-900 dark:text-white font-medium">{link.loan?.status || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-gray-600 dark:text-gray-400">Loan Applicant ID</p>
                    <p className="text-gray-900 dark:text-white font-medium text-xs break-all">{link.loan?.applicantId || 'N/A'}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Verification Data */}
            {link.verificationData && (
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
                <h4 className="font-semibold text-blue-900 dark:text-blue-200 mb-3 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  Verification Data Provided
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  {link.verificationData.phoneNumber && (
                    <div>
                      <p className="text-blue-700 dark:text-blue-300 font-medium">Phone Number</p>
                      <p className="text-blue-900 dark:text-blue-100">{link.verificationData.phoneNumber}</p>
                    </div>
                  )}
                  {link.verificationData.ssnLast4 && (
                    <div>
                      <p className="text-blue-700 dark:text-blue-300 font-medium">SSN Last 4</p>
                      <p className="text-blue-900 dark:text-blue-100">••••{link.verificationData.ssnLast4}</p>
                    </div>
                  )}
                  {link.verificationData.providedEmail && (
                    <div>
                      <p className="text-blue-700 dark:text-blue-300 font-medium">Provided Email</p>
                      <p className="text-blue-900 dark:text-blue-100">{link.verificationData.providedEmail}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Email Match Check */}
            <div className={`rounded-lg p-4 mb-6 ${
              link.customer?.email === link.loan?.applicantId
                ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
                : 'bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800'
            }`}>
              <div className="flex items-center gap-2 mb-2">
                {link.customer?.email === link.loan?.applicantId ? (
                  <CheckCircle className="w-5 h-5 text-green-600" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-yellow-600" />
                )}
                <h4 className="font-semibold text-gray-900 dark:text-white">Email Verification Status</h4>
              </div>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                {link.customer?.email === link.loan?.applicantId
                  ? '✅ Customer email matches loan applicant ID - High confidence verification'
                  : '⚠️ Customer email does not match loan applicant ID - Manual verification required'}
              </p>
            </div>

            {/* Admin Notes */}
            {link.adminNotes && (
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-6">
                <h4 className="font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                  <MessageSquare className="w-4 h-4" />
                  Previous Admin Notes
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">{link.adminNotes}</p>
              </div>
            )}

            {/* Verification Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Verification Action
                </label>
                <div className="grid grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => setAction('approve')}
                    className={`px-4 py-3 rounded-lg border-2 transition-colors flex items-center justify-center gap-2 ${
                      action === 'approve'
                        ? 'border-green-500 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300'
                        : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    <CheckCircle className="w-5 h-5" />
                    Approve
                  </button>
                  <button
                    type="button"
                    onClick={() => setAction('reject')}
                    className={`px-4 py-3 rounded-lg border-2 transition-colors flex items-center justify-center gap-2 ${
                      action === 'reject'
                        ? 'border-red-500 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300'
                        : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    <XCircle className="w-5 h-5" />
                    Reject
                  </button>
                  <button
                    type="button"
                    onClick={() => setAction('request_info')}
                    className={`px-4 py-3 rounded-lg border-2 transition-colors flex items-center justify-center gap-2 ${
                      action === 'request_info'
                        ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300'
                        : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    <MessageSquare className="w-5 h-5" />
                    Request Info
                  </button>
                </div>
              </div>

              <div>
                <label htmlFor="verificationMethod" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Verification Method (Optional)
                </label>
                <select
                  id="verificationMethod"
                  value={verificationMethod}
                  onChange={(e) => setVerificationMethod(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                >
                  <option value="">Select method...</option>
                  <option value="PHONE_VERIFICATION">Phone Verification</option>
                  <option value="SSN_VERIFICATION">SSN Verification</option>
                  <option value="DOCUMENT_VERIFICATION">Document Verification</option>
                  <option value="MANUAL_ADMIN_VERIFICATION">Manual Admin Review</option>
                  <option value="EMAIL_VERIFICATION">Email Verification</option>
                </select>
              </div>

              <div>
                <label htmlFor="comments" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Comments / Notes {action === 'reject' && <span className="text-red-500">*</span>}
                </label>
                <textarea
                  id="comments"
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  required={action === 'reject'}
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  placeholder={
                    action === 'approve'
                      ? 'Add notes about the verification method used...'
                      : action === 'reject'
                      ? 'Explain why this link is being rejected...'
                      : 'Specify what additional information is needed...'
                  }
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={handleClose}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || (action === 'reject' && !comments.trim())}
                  className={`flex-1 px-4 py-2 rounded-lg text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${
                    action === 'approve'
                      ? 'bg-green-600 hover:bg-green-700'
                      : action === 'reject'
                      ? 'bg-red-600 hover:bg-red-700'
                      : 'bg-yellow-600 hover:bg-yellow-700'
                  }`}
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Processing...
                    </>
                  ) : (
                    <>
                      {action === 'approve' && <CheckCircle className="w-4 h-4" />}
                      {action === 'reject' && <XCircle className="w-4 h-4" />}
                      {action === 'request_info' && <MessageSquare className="w-4 h-4" />}
                      {action === 'approve' ? 'Approve Link' : action === 'reject' ? 'Reject Link' : 'Request Information'}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

