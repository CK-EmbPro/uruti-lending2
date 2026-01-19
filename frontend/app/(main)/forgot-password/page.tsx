'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // TODO: Implement API call to send reset link
      // await authApi.forgotPassword({ email });
      
      toast.success('Password reset link sent to your email');
      // In a real app, you might redirect to a confirmation page
      setTimeout(() => {
        router.push('/login');
      }, 2000);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to send reset link');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen w-full font-display">
      {/* Left Panel - Blue Background (2/3 width) */}
      <div className="hidden lg:flex relative w-2/3 bg-primary items-center justify-center p-12 overflow-hidden">
        {/* Background Image with Overlay */}
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-30"
          style={{
            backgroundImage: "url('https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1200')"
          }}
        >
          <div className="absolute inset-0 bg-primary/80"></div>
        </div>
        
        {/* Content */}
        <div className="relative z-10 flex flex-col text-white max-w-2xl">
          <h1 className="text-5xl font-bold mb-4 leading-tight">
            Reset Your Password
          </h1>
          
          {/* Divider */}
          <div className="w-16 h-0.5 bg-white mb-8"></div>
          
          {/* Promotional Text */}
          <p className="text-4xl font-light leading-tight mb-12">
            Secure Access to Your Account, Restored in Minutes
          </p>
          
          {/* Security Message */}
          <div className="flex items-center gap-2 text-white/90">
            <span className="material-symbols-outlined text-xl">security</span>
            <span className="text-sm">
              Your account security is our top priority
            </span>
          </div>
        </div>
      </div>

      {/* Right Panel - White Background (1/3 width) */}
      <div className="flex flex-1 lg:w-1/3 bg-white items-center justify-center p-8 lg:p-12 relative overflow-hidden">
        {/* Background Image with Overlay */}
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-5"
          style={{
            backgroundImage: "url('https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1200')"
          }}
        ></div>
        
        {/* Form Container */}
        <div className="relative z-10 w-full max-w-md">
          <form onSubmit={handleSubmit} className="flex flex-col gap-8">
            {/* Header */}
            <div className="flex flex-col gap-2 mb-4">
              <h2 className="text-3xl font-bold text-gray-900 leading-tight">
                Forgot Password?
              </h2>
              <p className="text-sm text-gray-600 leading-normal">
                Enter your registered email address and we'll send you a link to reset your password.
              </p>
            </div>

            {/* Email Field */}
            <div className="flex flex-col">
              <label className="text-sm text-gray-500 mb-2">Email Address</label>
              <input
                className="bg-transparent border-0 border-b-2 border-teal-500 focus:outline-none focus:border-teal-600 pb-2 text-gray-800 text-base"
                placeholder="you@example.com"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-primary text-white py-4 px-6 font-semibold text-base uppercase tracking-wide hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary/50 active:bg-primary/95 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? 'Sending...' : 'SEND RESET LINK'}
            </button>

            {/* Terms and Conditions */}
            <p className="text-xs text-gray-500 text-center">
              Remember your password?{' '}
              <Link href="/login" className="text-primary underline hover:text-primary/80">
                Sign In
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
