'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Sidebar } from '@/components/layout/Sidebar';
import { GlobalSearch } from '@/components/features/GlobalSearch';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();
  
  // DEBUG: Check if we should disable redirects (set in localStorage)
  const disableRedirects = typeof window !== 'undefined' && localStorage.getItem('DISABLE_REDIRECTS') === 'true';

  useEffect(() => {
    // Check if user just logged in (prevent immediate redirect)
    const justLoggedIn = typeof window !== 'undefined' && sessionStorage.getItem('just_logged_in') === 'true';
    
    console.log('[DashboardLayout] Auth check:', {
      loading,
      isAuthenticated,
      willRedirect: !loading && !isAuthenticated && !disableRedirects && !justLoggedIn,
      disableRedirects,
      justLoggedIn,
      timestamp: new Date().toISOString(),
    });
    
    // Skip redirect if disabled for debugging
    if (disableRedirects) {
      console.log('[DashboardLayout] Redirects disabled for debugging');
      return;
    }
    
    // Skip redirect if user just logged in (give time for state to update)
    if (justLoggedIn) {
      console.log('[DashboardLayout] User just logged in, skipping redirect check');
      return;
    }
    
    // Add a small delay and check to prevent redirect loops
    if (!loading && !isAuthenticated) {
      const redirectTimer = setTimeout(() => {
        // Double-check authentication state before redirecting
        const currentToken = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
        const stillJustLoggedIn = typeof window !== 'undefined' && sessionStorage.getItem('just_logged_in') === 'true';
        
        if (currentToken && stillJustLoggedIn) {
          console.log('[DashboardLayout] Token exists and user just logged in, skipping redirect');
          return;
        }
        
        console.log('[DashboardLayout] Not authenticated, redirecting to login...');
        // Use replace instead of push to avoid adding to history
        router.replace('/login');
      }, 1500); // Increased delay to 1.5 seconds
      
      return () => clearTimeout(redirectTimer);
    }
  }, [isAuthenticated, loading, router, disableRedirects]);

  if (loading) {
    console.log('[DashboardLayout] Showing loading state');
    return (
      <div className="min-h-screen flex items-center justify-center bg-background-light dark:bg-background-dark">
        <div className="text-center">
          <div className="text-lg text-text-light dark:text-text-dark mb-2">Loading...</div>
          <div className="text-sm text-subtext-light dark:text-subtext-dark">
            Verifying authentication
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    console.log('[DashboardLayout] Not authenticated, returning null (will redirect)');
    return null;
  }
  
  console.log('[DashboardLayout] Rendering dashboard layout');

  return (
    <div className="flex min-h-screen bg-background-light dark:bg-background-dark font-display text-text-light dark:text-text-dark">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        {/* Header with Search */}
        <header className="sticky top-0 z-30 bg-white dark:bg-background-dark border-b border-gray-200 dark:border-gray-800 px-6 py-4">
          <div className="flex items-center justify-between">
            <GlobalSearch />
          </div>
        </header>
        <main className="flex-1 p-8 overflow-y-auto">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
