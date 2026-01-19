'use client';

import { useRouter } from 'next/navigation';
import { usePortalLoanApplications } from '@/lib/hooks/usePortalLoanApplication';
import { useCustomerPortal } from '@/contexts/CustomerPortalContext';
import {
  FileText,
  Plus,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Eye,
  Building2,
  Home,
  Settings,
  Bell,
  LogOut,
  CreditCard,
  HelpCircle,
} from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import { Skeleton } from '@/components/ui/Skeleton';
import { Button } from '@/components/ui/Button';
import toast from 'react-hot-toast';

const statusMap: Record<string, { color: string; icon: any; label: string }> = {
  DRAFT: { color: 'bg-gray-100 text-gray-800', icon: Clock, label: 'Draft' },
  SUBMITTED: { color: 'bg-blue-100 text-blue-800', icon: Clock, label: 'Submitted' },
  UNDER_REVIEW: { color: 'bg-yellow-100 text-yellow-800', icon: AlertCircle, label: 'Under Review' },
  APPROVED: { color: 'bg-green-100 text-green-800', icon: CheckCircle, label: 'Approved' },
  REJECTED: { color: 'bg-red-100 text-red-800', icon: XCircle, label: 'Rejected' },
  CANCELLED: { color: 'bg-gray-100 text-gray-800', icon: XCircle, label: 'Cancelled' },
};

export default function PortalLoanApplicationsPage() {
  const router = useRouter();
  const { user, logout } = useCustomerPortal();
  const { data: applications, isLoading } = usePortalLoanApplications();

  const handleLogout = () => {
    logout();
    router.push('/portal/login');
    toast.success('Logged out successfully');
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header with Navigation */}
      <header className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Loan Applications</h1>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Track and manage your applications</p>
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
                onClick={() => {
                  toast("Support: support@uruti.com | Phone: 1-800-URUTI", {
                    icon: "ℹ️",
                  });
                }}
                className="flex items-center gap-2 px-4 py-2 text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
              >
                <HelpCircle className="w-4 h-4" />
                Support
              </button>
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
        {/* New Application Button */}
        <div className="mb-6 flex justify-end">
          <Link href="/portal/loan-applications/new">
            <Button className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              New Application
            </Button>
          </Link>
        </div>

        {/* Applications List */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          {isLoading ? (
            <div className="p-8 space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-24 w-full rounded-lg" />
              ))}
            </div>
          ) : !applications || applications.length === 0 ? (
            <div className="p-12 text-center">
              <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">No applications found</h3>
              <p className="text-gray-600 dark:text-gray-400 mt-2 max-w-sm mx-auto">
                You haven't submitted any loan applications yet. Start a new application to get funding.
              </p>
              <Link href="/portal/loan-applications/new" className="mt-6 inline-block">
                <Button variant="primary">Apply Now</Button>
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {applications.map((app: any) => {
                const statusKey = (app.status || 'SUBMITTED').toUpperCase();
                const statusInfo = statusMap[statusKey] || statusMap.SUBMITTED;
                const StatusIcon = statusInfo.icon;

                return (
                  <div
                    key={app.id}
                    className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center justify-between"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                          {app.applicationNumber}
                        </h3>
                        <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${statusInfo.color}`}>
                          <StatusIcon className="w-3.5 h-3.5" />
                          {statusInfo.label}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-y-2 gap-x-6 text-sm text-gray-600 dark:text-gray-400">
                        <div className="flex items-center gap-2">
                          <Building2 className="w-4 h-4" />
                          <span>Institution: {app.company?.name || 'Loading...'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4" />
                          <span>Product: {app.loanProduct?.productName || 'Loan Product'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          <span>Applied on: {format(new Date(app.createdAt), 'MMM d, yyyy')}</span>
                        </div>
                      </div>

                      <div className="mt-3 flex items-center gap-4">
                        <span className="text-base font-semibold text-gray-900 dark:text-white">
                          Amount: {app.requestedAmount?.toLocaleString()} FRW
                        </span>
                        {app.approvedAmount && app.status === 'APPROVED' && (
                          <span className="text-sm font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded border border-green-100">
                            Approved: {app.approvedAmount?.toLocaleString()} FRW
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 ml-4">
                      {app.status === 'DRAFT' ? (
                        <Link href={`/portal/loan-applications/new?id=${app.id}`}>
                          <Button variant="outline" size="sm">Continue</Button>
                        </Link>
                      ) : (
                        <Link href={`/portal/loan-applications/${app.id}`}>
                          <Button variant="outline" size="sm" className="flex items-center gap-2">
                            <Eye className="w-4 h-4" />
                            View
                          </Button>
                        </Link>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
