'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useCustomerPortal } from '@/contexts/CustomerPortalContext';
import { customerPortalApi } from '@/lib/api/customer-portal';
import Link from 'next/link';
import { format } from 'date-fns';
import {
  ArrowLeft,
  Building2,
  FileText,
  DollarSign,
  Calendar,
  User,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  TrendingUp,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Edit,
  Eye,
  Home,
  Settings,
  Bell,
  LogOut,
} from 'lucide-react';
import { Skeleton } from '@/components/ui/Skeleton';
import { Button } from '@/components/ui/Button';
import toast from 'react-hot-toast';

const statusConfig: Record<string, { color: string; icon: any; label: string }> = {
  DRAFT: { color: 'bg-gray-100 text-gray-800', icon: Clock, label: 'Draft' },
  SUBMITTED: { color: 'bg-blue-100 text-blue-800', icon: Clock, label: 'Submitted' },
  UNDER_REVIEW: { color: 'bg-yellow-100 text-yellow-800', icon: AlertCircle, label: 'Under Review' },
  APPROVED: { color: 'bg-green-100 text-green-800', icon: CheckCircle, label: 'Approved' },
  REJECTED: { color: 'bg-red-100 text-red-800', icon: XCircle, label: 'Rejected' },
  CANCELLED: { color: 'bg-gray-100 text-gray-800', icon: XCircle, label: 'Cancelled' },
};

export default function LoanApplicationDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { user, logout } = useCustomerPortal();
  const [application, setApplication] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadApplication();
  }, [params.id]);

  const loadApplication = async () => {
    try {
      setIsLoading(true);
      const applications = await customerPortalApi.getMyApplications();
      const app = applications.find((a: any) => a.id === params.id);
      
      if (!app) {
        toast.error('Application not found');
        router.push('/portal/loan-applications');
        return;
      }
      
      setApplication(app);
    } catch (error: any) {
      toast.error('Failed to load application');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    router.push('/portal/login');
    toast.success('Logged out successfully');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <header className="bg-white dark:bg-gray-800 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <Skeleton className="h-8 w-64" />
          </div>
        </header>
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="space-y-6">
            <Skeleton className="h-32 w-full rounded-lg" />
            <Skeleton className="h-64 w-full rounded-lg" />
            <Skeleton className="h-64 w-full rounded-lg" />
          </div>
        </main>
      </div>
    );
  }

  if (!application) {
    return null;
  }

  const status = statusConfig[application.status] || statusConfig.SUBMITTED;
  const StatusIcon = status.icon;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header with Navigation */}
      <header className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Application Details</h1>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{application.applicationNumber}</p>
            </div>
            <div className="flex items-center gap-2">
              <Link
                href="/portal/dashboard"
                className="flex items-center gap-2 px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <Home className="w-4 h-4" />
                Dashboard
              </Link>
              <Link
                href="/portal/notifications"
                className="flex items-center gap-2 px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <Bell className="w-4 h-4" />
                Notifications
              </Link>
              <Link
                href="/portal/documents"
                className="flex items-center gap-2 px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <FileText className="w-4 h-4" />
                Documents
              </Link>
              <Link
                href="/portal/settings"
                className="flex items-center gap-2 px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <Settings className="w-4 h-4" />
                Settings
              </Link>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <div className="mb-6">
          <Link
            href="/portal/loan-applications"
            className="flex items-center gap-2 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Applications
          </Link>
        </div>

        {/* Status Header */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                {application.applicationNumber}
              </h2>
              <div className="flex items-center gap-4">
                <span className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium ${status.color}`}>
                  <StatusIcon className="w-4 h-4" />
                  {status.label}
                </span>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Applied on {format(new Date(application.createdAt), 'MMMM d, yyyy')}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {application.status === 'DRAFT' && (
                <Link href={`/portal/loan-applications/new?id=${application.id}`}>
                  <Button variant="primary" className="flex items-center gap-2">
                    <Edit className="w-4 h-4" />
                    Continue Editing
                  </Button>
                </Link>
              )}
              {application.loanId && (
                <Link href={`/portal/loans/${application.loanId}`}>
                  <Button variant="outline" className="flex items-center gap-2">
                    <Eye className="w-4 h-4" />
                    View Loan
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Loan Details */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Loan Details
            </h3>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Building2 className="w-5 h-5 text-gray-400 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Institution</p>
                  <p className="text-base text-gray-900 dark:text-white">{application.company?.name || 'N/A'}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <FileText className="w-5 h-5 text-gray-400 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Loan Product</p>
                  <p className="text-base text-gray-900 dark:text-white">{application.loanProduct?.productName || 'N/A'}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <DollarSign className="w-5 h-5 text-gray-400 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Requested Amount</p>
                  <p className="text-base font-semibold text-gray-900 dark:text-white">
                    {application.requestedAmount?.toLocaleString()} FRW
                  </p>
                </div>
              </div>
              {application.approvedAmount && (
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Approved Amount</p>
                    <p className="text-base font-semibold text-green-600">
                      {application.approvedAmount?.toLocaleString()} FRW
                    </p>
                  </div>
                </div>
              )}
              {application.loanTerm && (
                <div className="flex items-start gap-3">
                  <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Loan Term</p>
                    <p className="text-base text-gray-900 dark:text-white">{application.loanTerm} months</p>
                  </div>
                </div>
              )}
              {application.loanPurpose && (
                <div className="flex items-start gap-3">
                  <FileText className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Purpose</p>
                    <p className="text-base text-gray-900 dark:text-white">{application.loanPurpose}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Personal Information */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <User className="w-5 h-5" />
              Personal Information
            </h3>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <User className="w-5 h-5 text-gray-400 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Full Name</p>
                  <p className="text-base text-gray-900 dark:text-white">{application.fullName || 'N/A'}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Mail className="w-5 h-5 text-gray-400 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Email</p>
                  <p className="text-base text-gray-900 dark:text-white">{application.email || 'N/A'}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Phone className="w-5 h-5 text-gray-400 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Phone</p>
                  <p className="text-base text-gray-900 dark:text-white">{application.phoneNumber || 'N/A'}</p>
                </div>
              </div>
              {application.dateOfBirth && (
                <div className="flex items-start gap-3">
                  <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Date of Birth</p>
                    <p className="text-base text-gray-900 dark:text-white">
                      {format(new Date(application.dateOfBirth), 'MMMM d, yyyy')}
                    </p>
                  </div>
                </div>
              )}
              {application.address && (
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Address</p>
                    <p className="text-base text-gray-900 dark:text-white">{application.address}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Financial Information */}
          {(application.annualIncome || application.employmentStatus) && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 lg:col-span-2">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Financial Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {application.annualIncome && (
                  <div className="flex items-start gap-3">
                    <DollarSign className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Annual Income</p>
                      <p className="text-base font-semibold text-gray-900 dark:text-white">
                        {parseFloat(application.annualIncome).toLocaleString()} FRW
                      </p>
                    </div>
                  </div>
                )}
                {application.employmentStatus && (
                  <div className="flex items-start gap-3">
                    <Briefcase className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Employment Status</p>
                      <p className="text-base text-gray-900 dark:text-white">{application.employmentStatus}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Rejection Reason */}
        {application.status === 'REJECTED' && application.rejectionReason && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 mt-6">
            <div className="flex items-start gap-3">
              <XCircle className="w-5 h-5 text-red-600 mt-0.5" />
              <div className="flex-1">
                <h4 className="text-sm font-semibold text-red-800 dark:text-red-200 mb-1">Rejection Reason</h4>
                <p className="text-sm text-red-700 dark:text-red-300">{application.rejectionReason}</p>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
