'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCustomerPortal } from '@/contexts/CustomerPortalContext';
import { customerPortalApi } from '@/lib/api/customer-portal';
import toast from 'react-hot-toast';
import {
  User,
  Mail,
  Phone,
  Calendar,
  MapPin,
  Lock,
  Home,
  Eye,
  EyeOff,
  Loader2,
  CheckCircle,
  XCircle,
  AlertCircle,
  FileText,
  Bell,
  CreditCard,
  LogOut,
  Settings as SettingsIcon,
  Shield,
  Save,
  QrCode,
} from 'lucide-react';
import Link from 'next/link';

type Tab = 'profile' | 'email' | 'password' | 'security';

export default function CustomerPortalSettingsPage() {
  const { user, isAuthenticated, loading, logout } = useCustomerPortal();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>('profile');
  const [isLoading, setIsLoading] = useState(false);

  // Profile form state
  const [name, setName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');

  // Email form state
  const [newEmail, setNewEmail] = useState('');
  const [showEmailForm, setShowEmailForm] = useState(false);

  // Password form state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  // MFA state
  const [mfaSetup, setMfaSetup] = useState<{ secret: string; qrCodeUrl: string; backupCodes: string[] } | null>(null);
  const [mfaToken, setMfaToken] = useState('');
  const [isMfaEnabled, setIsMfaEnabled] = useState(false);
  const [disableMfaToken, setDisableMfaToken] = useState('');



  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setPhoneNumber(user.phoneNumber || '');
      setNewEmail(user.email || '');
      setIsMfaEnabled((user as any).isMfaEnabled || false);
    }
  }, [user]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await customerPortalApi.updateProfile({ name, phoneNumber });
      toast.success('Profile updated successfully');
      // Refresh user data
      window.location.reload();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await customerPortalApi.updateEmail(newEmail);
      toast.success('Email updated successfully. Please verify your new email address.');
      setShowEmailForm(false);
      window.location.reload();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update email');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match');
      setIsLoading(false);
      return;
    }

    if (newPassword.length < 8) {
      toast.error('Password must be at least 8 characters long');
      setIsLoading(false);
      return;
    }

    try {
      await customerPortalApi.changePassword({
        currentPassword,
        newPassword,
        confirmPassword,
      });
      toast.success('Password changed successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to change password');
    } finally {
      setIsLoading(false);
    }
  };



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
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Account Settings</h1>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Manage your account information and preferences</p>
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
                href="/portal/loan-applications"
                className="flex items-center gap-2 px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <CreditCard className="w-4 h-4" />
                Loan Applications
              </Link>
              <Link
                href="/portal/documents"
                className="flex items-center gap-2 px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <FileText className="w-4 h-4" />
                Documents
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

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tab Navigation */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow mb-6">
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="flex -mb-px">
              <button
                onClick={() => setActiveTab('profile')}
                className={`flex-1 px-6 py-4 text-center border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'profile'
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                <User className="w-5 h-5 mx-auto mb-1" />
                Profile
              </button>
              <button
                onClick={() => setActiveTab('email')}
                className={`flex-1 px-6 py-4 text-center border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'email'
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                <Mail className="w-5 h-5 mx-auto mb-1" />
                Email
              </button>
              <button
                onClick={() => setActiveTab('password')}
                className={`flex-1 px-6 py-4 text-center border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'password'
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                <Lock className="w-5 h-5 mx-auto mb-1" />
                Password
              </button>
              <button
                onClick={() => setActiveTab('security')}
                className={`flex-1 px-6 py-4 text-center border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'security'
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                <Shield className="w-5 h-5 mx-auto mb-1" />
                Security
              </button>
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <form onSubmit={handleUpdateProfile} className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Profile Information</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                  Update your personal information. This information will be used for account communication.
                </p>
              </div>

              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    placeholder="Enter your full name"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Phone Number
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="tel"
                    id="phoneNumber"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    placeholder="+1 (555) 123-4567"
                  />
                </div>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Optional. Used for important account notifications.
                </p>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  {isLoading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          )}

          {/* Email Tab */}
          {activeTab === 'email' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Email Address</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                  Your current email address is used for account login and important notifications.
                </p>
              </div>

              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Current Email</p>
                    <p className="text-lg text-gray-900 dark:text-white mt-1">{user?.email}</p>
                    {user?.emailVerified ? (
                      <div className="flex items-center gap-2 mt-2">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <span className="text-xs text-green-600 dark:text-green-400">Verified</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 mt-2">
                        <AlertCircle className="w-4 h-4 text-yellow-500" />
                        <span className="text-xs text-yellow-600 dark:text-yellow-400">Not verified</span>
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => setShowEmailForm(!showEmailForm)}
                    className="px-4 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                  >
                    Change Email
                  </button>
                </div>
              </div>

              {showEmailForm && (
                <form onSubmit={handleUpdateEmail} className="space-y-4 border-t border-gray-200 dark:border-gray-700 pt-6">
                  <div>
                    <label htmlFor="newEmail" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      New Email Address
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input
                        type="email"
                        id="newEmail"
                        value={newEmail}
                        onChange={(e) => setNewEmail(e.target.value)}
                        required
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                        placeholder="new.email@example.com"
                      />
                    </div>
                    <p className="mt-1 text-xs text-yellow-600 dark:text-yellow-400">
                      ⚠️ You will need to verify your new email address after changing it.
                    </p>
                  </div>

                  <div className="flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setShowEmailForm(false);
                        setNewEmail(user?.email || '');
                      }}
                      className="px-4 py-2 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isLoading || newEmail === user?.email}
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      <Save className="w-4 h-4" />
                      {isLoading ? 'Updating...' : 'Update Email'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* Password Tab */}
          {activeTab === 'password' && (
            <form onSubmit={handleChangePassword} className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Change Password</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                  Update your password to keep your account secure. Use a strong password with at least 8 characters.
                </p>
              </div>

              <div>
                <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Current Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type={showPasswords.current ? 'text' : 'password'}
                    id="currentPassword"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                    className="w-full pl-10 pr-10 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    placeholder="Enter current password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords({ ...showPasswords, current: !showPasswords.current })}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    {showPasswords.current ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div>
                <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  New Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type={showPasswords.new ? 'text' : 'password'}
                    id="newPassword"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    minLength={8}
                    className="w-full pl-10 pr-10 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    placeholder="Enter new password (min. 8 characters)"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    {showPasswords.new ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Must be at least 8 characters long
                </p>
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Confirm New Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type={showPasswords.confirm ? 'text' : 'password'}
                    id="confirmPassword"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    minLength={8}
                    className={`w-full pl-10 pr-10 py-2 border rounded-lg focus:ring-2 focus:border-transparent dark:bg-gray-700 dark:text-white ${
                      confirmPassword && newPassword !== confirmPassword
                        ? 'border-red-300 dark:border-red-600 focus:ring-red-500'
                        : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500'
                    }`}
                    placeholder="Confirm new password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    {showPasswords.confirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {confirmPassword && newPassword !== confirmPassword && (
                  <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                    Passwords do not match
                  </p>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  type="submit"
                  disabled={isLoading || !currentPassword || !newPassword || newPassword !== confirmPassword}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  {isLoading ? 'Changing...' : 'Change Password'}
                </button>
              </div>
            </form>
          )}

          {/* Security Tab */}
          {activeTab === 'security' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Two-Factor Authentication</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                  Add an extra layer of security to your account by enabling two-factor authentication (2FA).
                </p>
              </div>

              {!isMfaEnabled ? (
                <div className="space-y-6">
                  {!mfaSetup ? (
                    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
                      <div className="flex items-start gap-4">
                        <Shield className="w-8 h-8 text-gray-400 flex-shrink-0 mt-1" />
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                            Enable Two-Factor Authentication
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                            Two-factor authentication adds an extra layer of security to your account. You'll need an authenticator app like Google Authenticator or Authy.
                          </p>
                          <button
                            onClick={async () => {
                              try {
                                setIsLoading(true);
                                const setup = await customerPortalApi.setupMfa();
                                setMfaSetup(setup);
                                toast.success('MFA setup initiated. Scan the QR code with your authenticator app.');
                              } catch (error: any) {
                                toast.error(error.response?.data?.message || 'Failed to setup MFA');
                              } finally {
                                setIsLoading(false);
                              }
                            }}
                            disabled={isLoading}
                            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                          >
                            <QrCode className="w-4 h-4" />
                            {isLoading ? 'Setting up...' : 'Enable 2FA'}
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6 border border-blue-200 dark:border-blue-800">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                          Step 1: Scan QR Code
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                          Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.)
                        </p>
                        <div className="flex justify-center mb-4">
                          <img src={mfaSetup.qrCodeUrl} alt="QR Code" className="w-64 h-64 border-2 border-gray-300 dark:border-gray-600 rounded-lg" />
                        </div>
                        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 mb-4">
                          <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">Or enter this code manually:</p>
                          <code className="text-sm font-mono text-gray-900 dark:text-white break-all">{mfaSetup.secret}</code>
                        </div>
                      </div>

                      <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4 border border-yellow-200 dark:border-yellow-800">
                        <h4 className="text-sm font-semibold text-yellow-900 dark:text-yellow-200 mb-2">
                          ⚠️ Save Your Backup Codes
                        </h4>
                        <p className="text-xs text-yellow-800 dark:text-yellow-300 mb-3">
                          These codes can be used to access your account if you lose your authenticator device. Save them in a secure location.
                        </p>
                        <div className="grid grid-cols-2 gap-2 mb-3">
                          {mfaSetup.backupCodes.map((code, index) => (
                            <code key={index} className="text-xs font-mono bg-white dark:bg-gray-800 px-2 py-1 rounded">
                              {code}
                            </code>
                          ))}
                        </div>
                      </div>

                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                          Step 2: Verify Setup
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                          Enter the 6-digit code from your authenticator app to complete setup.
                        </p>
                        <div className="flex gap-3">
                          <input
                            type="text"
                            value={mfaToken}
                            onChange={(e) => setMfaToken(e.target.value.replace(/\D/g, '').slice(0, 6))}
                            placeholder="000000"
                            maxLength={6}
                            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white text-center text-2xl tracking-widest font-mono"
                          />
                          <button
                            onClick={async () => {
                              if (mfaToken.length !== 6) {
                                toast.error('Please enter a 6-digit code');
                                return;
                              }
                              try {
                                setIsLoading(true);
                                await customerPortalApi.verifyMfaSetup(mfaToken);
                                setIsMfaEnabled(true);
                                setMfaSetup(null);
                                setMfaToken('');
                                toast.success('Two-factor authentication enabled successfully!');
                                window.location.reload();
                              } catch (error: any) {
                                toast.error(error.response?.data?.message || 'Invalid code. Please try again.');
                              } finally {
                                setIsLoading(false);
                              }
                            }}
                            disabled={isLoading || mfaToken.length !== 6}
                            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {isLoading ? 'Verifying...' : 'Verify & Enable'}
                          </button>
                        </div>
                        <button
                          onClick={() => {
                            setMfaSetup(null);
                            setMfaToken('');
                          }}
                          className="mt-3 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-6 border border-green-200 dark:border-green-800">
                  <div className="flex items-start gap-4">
                    <CheckCircle className="w-8 h-8 text-green-500 flex-shrink-0 mt-1" />
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                        Two-Factor Authentication Enabled
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                        Your account is protected with two-factor authentication. You'll need to enter a code from your authenticator app when logging in.
                      </p>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Enter 6-digit code to disable 2FA
                          </label>
                          <div className="flex gap-3">
                            <input
                              type="text"
                              value={disableMfaToken}
                              onChange={(e) => setDisableMfaToken(e.target.value.replace(/\D/g, '').slice(0, 6))}
                              placeholder="000000"
                              maxLength={6}
                              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent dark:bg-gray-700 dark:text-white text-center text-2xl tracking-widest font-mono"
                            />
                            <button
                              onClick={async () => {
                                if (disableMfaToken.length !== 6) {
                                  toast.error('Please enter a 6-digit code');
                                  return;
                                }
                                if (!confirm('Are you sure you want to disable two-factor authentication? This will make your account less secure.')) {
                                  return;
                                }
                                try {
                                  setIsLoading(true);
                                  await customerPortalApi.disableMfa(disableMfaToken);
                                  setIsMfaEnabled(false);
                                  setDisableMfaToken('');
                                  toast.success('Two-factor authentication disabled');
                                  window.location.reload();
                                } catch (error: any) {
                                  toast.error(error.response?.data?.message || 'Invalid code. Please try again.');
                                } finally {
                                  setIsLoading(false);
                                }
                              }}
                              disabled={isLoading || disableMfaToken.length !== 6}
                              className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {isLoading ? 'Disabling...' : 'Disable 2FA'}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

