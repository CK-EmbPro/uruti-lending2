'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import toast from 'react-hot-toast';
import Link from 'next/link';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { login, isAuthenticated, loading } = useAuth();
  const router = useRouter();
  
  // DEBUG: Check if we should disable redirects (set in localStorage)
  const disableRedirects = typeof window !== 'undefined' && localStorage.getItem('DISABLE_REDIRECTS') === 'true';

  // Redirect authenticated users away from login page
  useEffect(() => {
    console.log('[LoginPage] Auth state check:', {
      loading,
      isAuthenticated,
      willRedirect: !loading && isAuthenticated && !disableRedirects,
      disableRedirects,
    });
    
    // Skip redirect if disabled for debugging
    if (disableRedirects) {
      console.log('[LoginPage] Redirects disabled for debugging');
      return;
    }
    
    // Add a small delay and check to prevent redirect loops
    if (!loading && isAuthenticated) {
      const redirectTimer = setTimeout(() => {
        console.log('[LoginPage] User already authenticated, redirecting to dashboard...');
        router.replace('/dashboard');
      }, 1000); // 1 second delay to allow console logs to be visible
      
      return () => clearTimeout(redirectTimer);
    }
  }, [isAuthenticated, loading, router, disableRedirects]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    console.log('[LoginPage] Form submitted, attempting login...', { email });

    try {
      console.log('[LoginPage] Calling login function...');
      await login(email, password);
      console.log('[LoginPage] Login successful, waiting for auth state to update...');
      
      // Wait a bit for auth state to propagate before redirecting
      await new Promise(resolve => setTimeout(resolve, 500));
      
      toast.success('Login successful');
      
      // Small delay before redirect to ensure state is set
      setTimeout(() => {
        console.log('[LoginPage] Redirecting to dashboard...');
        router.replace('/dashboard');
      }, 200);
    } catch (error: any) {
      console.error('[LoginPage] Login error:', {
        message: error?.message,
        response: error?.response?.data,
        status: error?.response?.status,
        code: error?.code,
      });
      
      // Provide more specific error messages
      let errorMessage = 'Login failed';
      if (error?.response?.status === 401) {
        errorMessage = error?.response?.data?.message || 'Invalid email or password';
      } else if (error?.response?.status === 400) {
        errorMessage = error?.response?.data?.message || 'Invalid input. Please check your email format.';
      } else if (error?.code === 'ECONNABORTED' || error?.message?.includes('timeout')) {
        errorMessage = 'Request timed out. Please check your connection and try again.';
      } else if (!error?.response && error?.request) {
        errorMessage = 'Network error. Please check if the backend server is running.';
      } else if (error?.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error?.message) {
        errorMessage = error.message;
      }
      
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
      console.log('[LoginPage] Login process completed');
    }
  };

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background-light dark:bg-background-dark">
        <div className="text-lg text-text-light dark:text-text-dark">Loading...</div>
      </div>
    );
  }

  // Don't render login form if already authenticated (will redirect)
  if (isAuthenticated) {
    return null;
  }

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
            Sign In to the Simple, Fast and Reliable Lending solutions
          </h1>
          
          {/* Divider */}
          <div className="w-16 h-0.5 bg-white mb-8"></div>
          
          {/* Promotional Text */}
          <p className="text-4xl font-light leading-tight mb-12">
            Empowering Your Financial Journey with Trust, Speed, and Transparency
          </p>
          
          {/* Security Message */}
          <div className="flex items-center gap-2 text-white/90">
            <span className="material-symbols-outlined text-xl">lock</span>
            <span className="text-sm">
              You are logging in to a safe and secure platform
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
            {/* Email Field */}
            <div className="flex flex-col">
              <label className="text-sm text-gray-500 mb-2">Email</label>
              <input
                className="bg-transparent border-0 border-b-2 border-teal-500 focus:outline-none focus:border-teal-600 pb-2 text-gray-800 text-base"
                placeholder="Enter your email address"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>

            {/* Password Field */}
            <div className="flex flex-col gap-2">
              <label className="text-sm text-gray-500 mb-2">Password</label>
              <div className="flex items-center border-b-2 border-teal-500 focus-within:border-teal-600">
                <input
                  className="flex-1 bg-transparent border-0 focus:outline-none pb-2 text-gray-800 text-base pr-2"
                  placeholder="Enter your password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-gray-400 hover:text-gray-600 transition-colors p-1"
                >
                  <span className="material-symbols-outlined text-xl">
                    {showPassword ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
              
              <Link
                href="/forgot-password"
                className="text-sm text-primary underline self-end hover:text-primary/80"
              >
                Reset Password?
              </Link>
            </div>

            {/* Sign In Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-primary text-white py-4 px-6 font-semibold text-base uppercase tracking-wide hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary/50 active:bg-primary/95 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? 'Signing In...' : 'SIGN IN'}
            </button>

            {/* Terms and Conditions */}
            <p className="text-xs text-gray-500 text-center">
              By signing in you agree to our{' '}
              <Link href="/terms" className="text-primary underline hover:text-primary/80">
                Terms and Conditions.
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
