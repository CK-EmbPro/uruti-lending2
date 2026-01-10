'use client';

import { useState } from 'react';
import { customerPortalApi, LinkLoanDto } from '@/lib/api/customer-portal';
import toast from 'react-hot-toast';
import { X, Link2, AlertCircle, CheckCircle } from 'lucide-react';

interface LinkLoanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function LinkLoanModal({ isOpen, onClose, onSuccess }: LinkLoanModalProps) {
  const [loanNumber, setLoanNumber] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [ssnLast4, setSsnLast4] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState<'idle' | 'verifying' | 'success' | 'pending'>('idle');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setVerificationStatus('verifying');

    try {
      const linkData: LinkLoanDto = {
        loanNumber: loanNumber.trim(),
        ...(email && { email: email.trim() }),
        ...(phoneNumber && { phoneNumber: phoneNumber.trim() }),
        ...(ssnLast4 && { ssnLast4: ssnLast4.trim() }),
      };

      const result = await customerPortalApi.linkLoan(linkData);
      
      if (result.link.isVerified) {
        setVerificationStatus('success');
        toast.success('Loan linked successfully!');
        setTimeout(() => {
          onSuccess();
          handleClose();
        }, 1500);
      } else {
        setVerificationStatus('pending');
        toast.success('Loan link request submitted. It will be verified by our team.');
        setTimeout(() => {
          onSuccess();
          handleClose();
        }, 2000);
      }
    } catch (error: any) {
      setVerificationStatus('idle');
      toast.error(error.response?.data?.message || 'Failed to link loan');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setLoanNumber('');
    setEmail('');
    setPhoneNumber('');
    setSsnLast4('');
    setVerificationStatus('idle');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={handleClose} />

        <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <div className="bg-white dark:bg-gray-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white flex items-center gap-2">
                <Link2 className="w-5 h-5" />
                Link Loan to Account
              </h3>
              <button
                onClick={handleClose}
                className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {verificationStatus === 'success' ? (
              <div className="text-center py-8">
                <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Loan Linked Successfully!
                </h4>
                <p className="text-gray-600 dark:text-gray-400">
                  Your loan has been verified and linked to your account.
                </p>
              </div>
            ) : verificationStatus === 'pending' ? (
              <div className="text-center py-8">
                <AlertCircle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Verification Pending
                </h4>
                <p className="text-gray-600 dark:text-gray-400">
                  Your loan link request has been submitted. Our team will verify and approve it shortly.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="loanNumber" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Loan Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="loanNumber"
                    type="text"
                    value={loanNumber}
                    onChange={(e) => setLoanNumber(e.target.value)}
                    required
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    placeholder="LOAN-2024-001"
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Email Address (Optional)
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    placeholder="your.email@example.com"
                  />
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Provide if different from your account email
                  </p>
                </div>

                <div>
                  <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Phone Number (Optional)
                  </label>
                  <input
                    id="phoneNumber"
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    placeholder="+1 (555) 123-4567"
                  />
                </div>

                <div>
                  <label htmlFor="ssnLast4" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Last 4 Digits of SSN (Optional)
                  </label>
                  <input
                    id="ssnLast4"
                    type="text"
                    value={ssnLast4}
                    onChange={(e) => setSsnLast4(e.target.value.replace(/\D/g, '').slice(0, 4))}
                    maxLength={4}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    placeholder="1234"
                  />
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    For additional verification
                  </p>
                </div>

                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    <strong>Note:</strong> If your email matches the loan records, the link will be verified automatically. 
                    Otherwise, our team will review and verify your request.
                  </p>
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
                    disabled={isLoading}
                    className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? 'Linking...' : 'Link Loan'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

