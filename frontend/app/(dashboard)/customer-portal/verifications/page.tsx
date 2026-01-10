'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { customerPortalAdminApi, CustomerLoanLink, VerifyLoanLinkDto } from '@/lib/api/customer-portal-admin';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import {
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  AlertCircle,
  User,
  CreditCard,
  Mail,
  Phone,
  FileText,
  Search,
  Shield,
} from 'lucide-react';
import { VerificationModal } from '@/components/admin/VerificationModal';

export default function CustomerPortalVerificationsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [pendingLinks, setPendingLinks] = useState<CustomerLoanLink[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedLink, setSelectedLink] = useState<CustomerLoanLink | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Check if user has admin role (handle both lowercase and proper case)
  const isAdmin = user?.roles?.some((role: string) => {
    const roleLower = role?.toLowerCase();
    return [
      'admin', 'system administrator',
      'loan officer', 'loan_officer',
      'customer service', 'customer_service'
    ].includes(roleLower);
  });

  useEffect(() => {
    if (!isAdmin) {
      toast.error('You do not have permission to access this page');
      router.push('/dashboard');
      return;
    }
    loadPendingVerifications();
  }, [isAdmin, router]);

  const loadPendingVerifications = async () => {
    if (!isAdmin) {
      return; // Don't try to load if not admin
    }
    
    try {
      setIsLoading(true);
      const data = await customerPortalAdminApi.getPendingVerifications();
      setPendingLinks(data);
    } catch (error: any) {
      // Only show error if it's not a 403 (permission denied)
      if (error?.response?.status !== 403) {
        toast.error('Failed to load pending verifications');
        console.error(error);
      } else {
        // 403 means user doesn't have permission - redirect
        toast.error('You do not have permission to access this page');
        router.push('/dashboard');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerify = async (linkId: string, action: VerifyLoanLinkDto) => {
    try {
      await customerPortalAdminApi.verifyLoanLink(linkId, action);
      toast.success(`Link ${action.action === 'approve' ? 'approved' : action.action === 'reject' ? 'rejected' : 'info requested'} successfully`);
      setIsModalOpen(false);
      setSelectedLink(null);
      loadPendingVerifications();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to process verification');
    }
  };

  const handleViewDetails = async (linkId: string) => {
    try {
      const details = await customerPortalAdminApi.getLinkDetails(linkId);
      setSelectedLink(details);
      setIsModalOpen(true);
    } catch (error: any) {
      toast.error('Failed to load link details');
    }
  };

  const filteredLinks = pendingLinks.filter((link) => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      link.loan?.loanNumber?.toLowerCase().includes(search) ||
      link.customer?.email?.toLowerCase().includes(search) ||
      link.customer?.name?.toLowerCase().includes(search) ||
      link.loan?.loanProduct?.name?.toLowerCase().includes(search)
    );
  });

  // Show access denied message if not admin
  if (!isAdmin) {
    return (
      <div className="p-6">
        <div className="flex flex-col items-center justify-center min-h-[400px]">
          <Shield className="w-16 h-16 text-red-500 mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Access Denied
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            You do not have permission to access this page.
          </p>
          <button
            onClick={() => router.push('/dashboard')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Customer Portal Loan Link Verifications
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Review and verify customer loan link requests
        </p>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search by loan number, customer email, or name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
          />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Pending Verifications</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{pendingLinks.length}</p>
            </div>
            <Clock className="w-8 h-8 text-yellow-600" />
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Filtered Results</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{filteredLinks.length}</p>
            </div>
            <FileText className="w-8 h-8 text-blue-600" />
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Average Age</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {pendingLinks.length > 0
                  ? Math.round(
                      pendingLinks.reduce((sum, link) => {
                        const age = (Date.now() - new Date(link.createdAt).getTime()) / (1000 * 60 * 60 * 24);
                        return sum + age;
                      }, 0) / pendingLinks.length
                    )
                  : 0}{' '}
                days
              </p>
            </div>
            <AlertCircle className="w-8 h-8 text-orange-600" />
          </div>
        </div>
      </div>

      {/* Pending Verifications List */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Pending Verifications</h2>
        </div>

        {isLoading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">Loading verifications...</p>
          </div>
        ) : filteredLinks.length === 0 ? (
          <div className="p-8 text-center">
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">
              {searchTerm ? 'No verifications match your search' : 'No pending verifications'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {filteredLinks.map((link) => {
              const ageInDays = Math.floor(
                (Date.now() - new Date(link.createdAt).getTime()) / (1000 * 60 * 60 * 24)
              );

              return (
                <div key={link.id} className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                          {link.loan?.loanNumber || 'Unknown Loan'}
                        </h3>
                        <span className="px-2 py-1 text-xs font-medium rounded bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                          Pending
                        </span>
                        {ageInDays > 2 && (
                          <span className="px-2 py-1 text-xs font-medium rounded bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                            {ageInDays} days old
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                        <div>
                          <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Customer</p>
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-gray-400" />
                            <span className="text-sm text-gray-900 dark:text-white">{link.customer?.name || 'N/A'}</span>
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <Mail className="w-4 h-4 text-gray-400" />
                            <span className="text-sm text-gray-600 dark:text-gray-400">{link.customer?.email || 'N/A'}</span>
                          </div>
                          {link.customer?.phoneNumber && (
                            <div className="flex items-center gap-2 mt-1">
                              <Phone className="w-4 h-4 text-gray-400" />
                              <span className="text-sm text-gray-600 dark:text-gray-400">{link.customer.phoneNumber}</span>
                            </div>
                          )}
                        </div>

                        <div>
                          <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Loan Details</p>
                          <div className="flex items-center gap-2">
                            <CreditCard className="w-4 h-4 text-gray-400" />
                            <span className="text-sm text-gray-900 dark:text-white">
                              ${link.loan?.loanAmount?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            {link.loan?.loanProduct?.name || 'N/A'}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                            Status: {link.loan?.status || 'N/A'}
                          </p>
                        </div>
                      </div>

                      {/* Verification Data */}
                      {link.verificationData && (
                        <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                          <p className="text-xs font-medium text-blue-800 dark:text-blue-200 mb-2">Verification Data Provided:</p>
                          <div className="flex flex-wrap gap-4 text-xs text-blue-700 dark:text-blue-300">
                            {link.verificationData.phoneNumber && (
                              <span>Phone: {link.verificationData.phoneNumber}</span>
                            )}
                            {link.verificationData.ssnLast4 && (
                              <span>SSN Last 4: ••••{link.verificationData.ssnLast4}</span>
                            )}
                            {link.verificationData.providedEmail && (
                              <span>Email: {link.verificationData.providedEmail}</span>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Admin Notes */}
                      {link.adminNotes && (
                        <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                          <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Admin Notes:</p>
                          <p className="text-xs text-gray-600 dark:text-gray-400">{link.adminNotes}</p>
                        </div>
                      )}

                      <p className="text-xs text-gray-500 dark:text-gray-500 mt-3">
                        Requested: {format(new Date(link.createdAt), 'MMM d, yyyy HH:mm')}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 ml-4">
                      <button
                        onClick={() => handleViewDetails(link.id)}
                        className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors flex items-center gap-2"
                      >
                        <Eye className="w-4 h-4" />
                        View Details
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Verification Modal */}
      {selectedLink && (
        <VerificationModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedLink(null);
          }}
          link={selectedLink}
          onVerify={handleVerify}
        />
      )}
    </div>
  );
}

