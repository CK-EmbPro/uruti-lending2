'use client';

import { PortalMultiStepLoanApplicationForm } from '@/components/portal/PortalMultiStepLoanApplicationForm';
import {
  ArrowLeft,
  Info,
  Bell,
  CreditCard,
  Home,
  LogOut,
  Settings,
  HelpCircle,
  FileText,
} from 'lucide-react';
import Link from 'next/link';
import { useCustomerPortal } from '@/contexts/CustomerPortalContext';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

export default function NewPortalLoanApplicationPage() {
  const { user, logout } = useCustomerPortal();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push('/portal/login');
    toast.success('Logged out successfully');
  };

  const handleSupportClick = () => {
    toast("Support: support@uruti.com | Phone: 1-800-URUTI", {
      icon: "ℹ️",
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-12">
      <header className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <Link
                href="/portal/loan-applications"
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                title="Back to applications"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">New Loan Application</h1>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Apply for funding from our partner institutions</p>
              </div>
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
                onClick={handleSupportClick}
                className="flex items-center gap-2 px-4 py-2 text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
              >
                <HelpCircle className="w-4 h-4" />
                Support
              </button>
              <div className="w-px h-6 bg-gray-200 dark:bg-gray-700 mx-1"></div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20 rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <PortalMultiStepLoanApplicationForm />
      </main>
    </div>
  );
}
