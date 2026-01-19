'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import toast from 'react-hot-toast';
import Link from 'next/link';

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { register } = useAuth();
  const router = useRouter();

  const calculatePasswordStrength = (pwd: string) => {
    if (pwd.length === 0) return 0;
    if (pwd.length < 6) return 1;
    if (pwd.length < 8) return 2;
    if (pwd.length >= 8 && /[A-Z]/.test(pwd) && /[0-9]/.test(pwd) && /[!@#$%^&*]/.test(pwd)) return 4;
    if (pwd.length >= 8 && /[A-Z]/.test(pwd) && /[0-9]/.test(pwd)) return 3;
    return 2;
  };

  const passwordStrength = calculatePasswordStrength(password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!agreedToTerms) {
      toast.error('Please agree to the Terms of Service and Privacy Policy');
      return;
    }

    setIsLoading(true);

    try {
      await register(email, password, name);
      toast.success('Account created successfully');
      router.push('/dashboard');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen w-full flex-col items-center justify-center p-4 font-display bg-background-light dark:bg-background-dark text-text-light dark:text-text-dark">
      <div className="flex flex-col items-center justify-center w-full max-w-md">
        <div className="mb-6">
          <h2 className="text-3xl font-bold text-primary dark:text-white">Uruti</h2>
        </div>
        <div className="w-full rounded-xl bg-white dark:bg-slate-800 p-8 shadow-md">
          <h1 className="text-center text-2xl font-bold text-text-light dark:text-text-dark pb-6">
            Create Your Uruti Account
          </h1>
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <label className="flex flex-col">
              <p className="pb-2 text-sm font-medium text-subtext-light dark:text-subtext-dark">Full Name</p>
              <input
                className="form-input h-12 w-full flex-1 resize-none overflow-hidden rounded-lg border border-border-light dark:border-border-dark bg-background-light dark:bg-slate-700 p-3 text-sm placeholder:text-subtext-light/70 focus:outline-none dark:text-white"
                placeholder="Enter your full name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                autoComplete="name"
              />
            </label>
            <label className="flex flex-col">
              <p className="pb-2 text-sm font-medium text-subtext-light dark:text-subtext-dark">Email Address</p>
              <input
                className="form-input h-12 w-full flex-1 resize-none overflow-hidden rounded-lg border border-border-light dark:border-border-dark bg-background-light dark:bg-slate-700 p-3 text-sm placeholder:text-subtext-light/70 focus:outline-none dark:text-white"
                placeholder="you@example.com"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </label>
            <label className="flex flex-col">
              <p className="pb-2 text-sm font-medium text-subtext-light dark:text-subtext-dark">Password</p>
              <div className="relative flex w-full flex-1 items-center">
                <input
                  className="form-input h-12 w-full flex-1 resize-none overflow-hidden rounded-lg border border-border-light dark:border-border-dark bg-background-light dark:bg-slate-700 p-3 pr-10 text-sm placeholder:text-subtext-light/70 focus:outline-none dark:text-white"
                  placeholder="Enter a strong password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-subtext-light dark:text-subtext-dark"
                >
                  <span className="material-symbols-outlined text-xl">
                    {showPassword ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
            </label>
            <div className="flex flex-col gap-2">
              <div className="password-strength-meter flex h-1.5 w-full gap-1 rounded-full bg-slate-200 dark:bg-slate-600">
                <div className={`rounded-full ${passwordStrength >= 1 ? 'bg-red-500' : 'w-0'}`} style={{ width: passwordStrength >= 1 ? '25%' : '0%' }}></div>
                <div className={`rounded-full ${passwordStrength >= 2 ? 'bg-yellow-500' : 'w-0'}`} style={{ width: passwordStrength >= 2 ? '25%' : '0%' }}></div>
                <div className={`rounded-full ${passwordStrength >= 3 ? 'bg-green-500' : 'w-0'}`} style={{ width: passwordStrength >= 3 ? '25%' : '0%' }}></div>
                <div className={`rounded-full ${passwordStrength >= 4 ? 'bg-green-500' : 'w-0'}`} style={{ width: passwordStrength >= 4 ? '25%' : '0%' }}></div>
              </div>
              <p className="text-xs text-subtext-light dark:text-subtext-dark">
                Use 8 or more characters with a mix of letters, numbers & symbols.
              </p>
            </div>
            <div className="pt-2">
              <label className="flex items-center gap-x-3">
                <input
                  className="h-4 w-4 rounded border-border-light text-primary focus:ring-primary/50 focus:ring-offset-0 focus:ring-2 bg-background-light dark:bg-slate-700 dark:border-slate-500"
                  type="checkbox"
                  checked={agreedToTerms}
                  onChange={(e) => setAgreedToTerms(e.target.checked)}
                  required
                />
                <p className="text-sm font-normal text-subtext-light dark:text-subtext-dark">
                  I agree to the{' '}
                  <Link href="/terms" className="font-medium text-primary hover:underline">
                    Terms of Service
                  </Link>{' '}
                  and{' '}
                  <Link href="/privacy" className="font-medium text-primary hover:underline">
                    Privacy Policy
                  </Link>
                  .
                </p>
              </label>
            </div>
            <button
              type="submit"
              disabled={isLoading || !agreedToTerms}
              className="mt-4 flex h-12 w-full items-center justify-center rounded-lg bg-primary px-6 text-base font-semibold text-white shadow-sm transition-colors hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-primary/50 dark:focus:ring-offset-slate-800"
            >
              {isLoading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>
          <div className="relative my-6 flex items-center">
            <div className="flex-grow border-t border-border-light dark:border-border-dark"></div>
            <span className="mx-4 flex-shrink text-sm text-subtext-light dark:text-subtext-dark">OR</span>
            <div className="flex-grow border-t border-border-light dark:border-border-dark"></div>
          </div>
          <div className="flex flex-col gap-4">
            <button
              type="button"
              className="flex h-12 w-full items-center justify-center gap-3 rounded-lg border border-border-light bg-white px-6 text-base font-semibold text-text-light shadow-sm transition-colors hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-400/50 focus:ring-offset-2 dark:border-border-dark dark:bg-slate-700 dark:text-text-dark dark:hover:bg-slate-600 dark:focus:ring-offset-slate-800"
            >
              <svg className="h-5 w-5" fill="none" height="24" viewBox="0 0 24 24" width="24" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25C22.56 11.45 22.49 10.68 22.36 9.92H12V14.45H18.02C17.73 15.93 16.92 17.15 15.65 18V20.81H19.5C21.49 19.04 22.56 15.92 22.56 12.25Z" fill="#4285F4"></path>
                <path d="M12 23C14.97 23 17.45 22.01 19.5 20.25L15.65 17.44C14.65 18.1 13.43 18.5 12 18.5C9.32 18.5 7.03 16.69 6.13 14.25H2.19V17.1C4.18 20.73 7.8 23 12 23Z" fill="#34A853"></path>
                <path d="M6.13 13.75C5.93 13.19 5.82 12.6 5.82 12C5.82 11.4 5.93 10.81 6.13 10.25V7.4H2.19C1.47 8.88 1 10.39 1 12C1 13.61 1.47 15.12 2.19 16.6L6.13 13.75Z" fill="#FBBC05"></path>
                <path d="M12 5.5C13.58 5.5 15.03 6.09 16.15 7.15L19.58 3.72C17.45 1.73 14.97 0.5 12 0.5C7.8 0.5 4.18 2.77 2.19 6.4L6.13 9.25C7.03 6.81 9.32 5.5 12 5.5Z" fill="#EA4335"></path>
              </svg>
              <span>Sign up with Google</span>
            </button>
            <button
              type="button"
              className="flex h-12 w-full items-center justify-center gap-3 rounded-lg border border-border-light bg-[#1877F2] px-6 text-base font-semibold text-white shadow-sm transition-colors hover:bg-[#1877F2]/90 focus:outline-none focus:ring-2 focus:ring-[#1877F2]/50 focus:ring-offset-2 dark:focus:ring-offset-slate-800"
            >
              <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z"></path>
              </svg>
              <span>Sign up with Facebook</span>
            </button>
          </div>
        </div>
        <div className="mt-6 text-center">
          <p className="text-sm text-subtext-light dark:text-subtext-dark">
            Already have an account?{' '}
            <Link href="/login" className="font-semibold text-primary hover:underline">
              Log in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
