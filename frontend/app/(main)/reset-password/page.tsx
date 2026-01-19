'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Eye, EyeOff, Building2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (password.length < 8) {
      toast.error('Password must be at least 8 characters long');
      return;
    }

    setIsLoading(true);

    try {
      // TODO: Implement API call to reset password
      // await authApi.resetPassword({ token, password });
      
      toast.success('Password reset successfully');
      setTimeout(() => {
        router.push('/login');
      }, 2000);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to reset password');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen w-full flex-col items-center justify-center bg-gray-50 p-4">
      <div className="flex w-full max-w-md flex-col items-center gap-8">
        {/* Header */}
        <header className="flex w-full items-center justify-center whitespace-nowrap py-3">
          <div className="flex items-center gap-3 text-gray-800">
            <Building2 className="h-8 w-8 text-blue-600" />
            <h2 className="text-xl font-bold tracking-tight text-gray-900">
              Uruti Lending Platform
            </h2>
          </div>
        </header>

        {/* Main Content Card */}
        <div className="w-full rounded-xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="flex flex-col gap-6">
            {/* Page Heading */}
            <div className="flex flex-col gap-2 text-center">
              <p className="text-3xl font-black text-gray-900">Set a New Password</p>
              <p className="text-gray-600">
                Your new password must be at least 8 characters long and include a number and a special character.
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              {/* New Password Field */}
              <label className="flex flex-col">
                <p className="pb-2 text-sm font-medium text-gray-700">New Password</p>
                <div className="relative flex w-full items-stretch">
                  <input
                    className="h-11 flex-1 resize-none rounded-lg border border-gray-300 bg-transparent px-3 text-gray-900 placeholder:text-gray-400 focus:border-blue-600 focus:outline-0 focus:ring-2 focus:ring-blue-500/50 pr-10"
                    placeholder="Enter your new password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </label>

              {/* Confirm Password Field */}
              <label className="flex flex-col">
                <p className="pb-2 text-sm font-medium text-gray-700">Confirm New Password</p>
                <div className="relative flex w-full items-stretch">
                  <input
                    className="h-11 flex-1 resize-none rounded-lg border border-gray-300 bg-transparent px-3 text-gray-900 placeholder:text-gray-400 focus:border-blue-600 focus:outline-0 focus:ring-2 focus:ring-blue-500/50 pr-10"
                    placeholder="Confirm your new password"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </label>

              {/* Submit Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex h-11 w-full cursor-pointer items-center justify-center overflow-hidden rounded-lg bg-blue-600 text-base font-bold text-white transition-colors hover:bg-blue-600/90 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="truncate">
                    {isLoading ? 'Resetting...' : 'Reset Password'}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Footer Link */}
        <div className="text-center">
          <Link
            href="/login"
            className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-blue-600"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Login</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

