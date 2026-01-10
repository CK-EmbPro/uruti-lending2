'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { authApi, type AuthResponse } from '@/lib/api/auth';

interface User {
  id: string;
  email: string;
  name: string;
  roles: string[];
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  useEffect(() => {
    // Check for existing token on mount (only once)
    let mounted = true;
    
    console.log('[AuthContext] useEffect - Checking for existing token...', {
      hasWindow: typeof window !== 'undefined',
      isVerifying,
      hasUser: !!user,
      timestamp: new Date().toISOString(),
    });
    
    if (typeof window !== 'undefined') {
      const storedToken = localStorage.getItem('auth_token');
      console.log('[AuthContext] Stored token check:', {
        hasToken: !!storedToken,
        tokenLength: storedToken?.length,
        tokenPreview: storedToken ? storedToken.substring(0, 20) + '...' : null,
        localStorageKeys: Object.keys(localStorage),
      });
      
      // Only verify token if we don't already have user data
      // This prevents unnecessary API calls and potential redirect loops
      if (storedToken && !isVerifying && !user) {
        console.log('[AuthContext] Token found, verifying...');
        setToken(storedToken);
        verifyToken(storedToken);
      } else {
        const reason = !storedToken 
          ? 'no token in localStorage' 
          : isVerifying 
            ? 'already verifying' 
            : 'user already exists';
        console.log('[AuthContext] No token verification needed:', {
          reason,
          hasStoredToken: !!storedToken,
          isVerifying,
          hasUser: !!user,
        });
        if (mounted) {
          setLoading(false);
        }
      }
    } else {
      console.log('[AuthContext] Window not available (SSR), setting loading to false');
      if (mounted) {
        setLoading(false);
      }
    }

    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const verifyToken = async (token: string) => {
    if (isVerifying) {
      console.log('[AuthContext] Token verification already in progress, skipping');
      return; // Prevent duplicate calls
    }
    
    console.log('[AuthContext] Starting token verification...');
    setIsVerifying(true);
    try {
      console.log('[AuthContext] Calling authApi.getCurrentUser...');
      const userData = await authApi.getCurrentUser();
      console.log('[AuthContext] Token verification successful:', {
        userId: userData?.id,
        userEmail: userData?.email,
      });
      setUser(userData);
      setToken(token);
    } catch (error: any) {
      // Check if it's a timeout or network error
      const isTimeout = error?.message?.includes('timeout') || error?.code === 'ECONNABORTED';
      const isNetworkError = !error?.response && error?.request;
      
      if (isTimeout || isNetworkError) {
        console.warn('[AuthContext] Token verification timeout/network error:', {
          message: error?.message,
          isTimeout,
          isNetworkError,
        });
        // On timeout/network error, keep the token but mark as loading false
        // This allows the user to stay logged in if it's just a temporary network issue
        // The token will be cleared on actual 401 errors from API calls
        setToken(token);
        // Don't clear user/token on timeout - let subsequent API calls handle auth
        // If user exists from previous session, keep it; otherwise isAuthenticated will be false
        // but token is preserved for retry
      } else {
        // Token invalid or expired, clear it
        // Don't redirect here - let the interceptor handle it only for non-auth/me calls
        console.warn('[AuthContext] Token verification failed:', {
          message: error?.message,
          status: error?.response?.status,
          data: error?.response?.data,
        });
        localStorage.removeItem('auth_token');
        setToken(null);
        setUser(null);
      }
    } finally {
      setLoading(false);
      setIsVerifying(false);
      console.log('[AuthContext] Token verification completed');
    }
  };

  const login = async (email: string, password: string) => {
    if (isLoggingIn) {
      console.warn('[AuthContext] Login already in progress');
      throw new Error('Login already in progress');
    }
    
    console.log('[AuthContext] Starting login process for:', email);
    setIsLoggingIn(true);
    try {
      console.log('[AuthContext] Calling authApi.login...');
      const response: AuthResponse = await authApi.login({ email, password });
      console.log('[AuthContext] Login API response received:', {
        hasToken: !!response.access_token,
        hasUser: !!response.user,
        userEmail: response.user?.email,
        userId: response.user?.id,
      });
      
      // Store token first
      localStorage.setItem('auth_token', response.access_token);
      
      // Clear any redirect timestamps and cooldowns on successful login
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('last_redirect_time');
        sessionStorage.removeItem('redirect_cooldown_timestamp');
        // Set a flag to prevent immediate redirects after login
        sessionStorage.setItem('just_logged_in', 'true');
        // Clear the flag after 3 seconds
        setTimeout(() => {
          sessionStorage.removeItem('just_logged_in');
        }, 3000);
      }
      
      console.log('[AuthContext] Token stored in localStorage');
      
      // Update state synchronously to ensure it's set before any redirects
      setToken(response.access_token);
      setUser(response.user);
      setLoading(false);
      
      // Force a small delay to ensure state is propagated
      await new Promise(resolve => setTimeout(resolve, 100));
      
      console.log('[AuthContext] Login successful - State updated:', {
        tokenSet: !!response.access_token,
        userSet: !!response.user,
        isAuthenticated: !!response.user && !!response.access_token,
      });
      
      // Don't verify token after login - we already have user data from login response
      // This prevents the redirect loop
    } catch (error: any) {
      console.error('[AuthContext] Login error:', {
        message: error?.message,
        response: error?.response?.data,
        status: error?.response?.status,
      });
      throw error;
    } finally {
      setIsLoggingIn(false);
      console.log('[AuthContext] Login process completed');
    }
  };

  const register = async (email: string, password: string, name: string) => {
    if (isLoggingIn) {
      throw new Error('Registration already in progress');
    }
    
    setIsLoggingIn(true);
    try {
      const response: AuthResponse = await authApi.register({ email, password, name });
      localStorage.setItem('auth_token', response.access_token);
      setToken(response.access_token);
      setUser(response.user);
      setLoading(false);
    } finally {
      setIsLoggingIn(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('auth_token');
    setToken(null);
    setUser(null);
  };

  // isAuthenticated requires both user and token to be set
  // This ensures we only consider authenticated when we have verified user data
  const isAuthenticated = !!user && !!token;
  
  // Debug logging for authentication state
  useEffect(() => {
    console.log('[AuthContext] Authentication state changed:', {
      hasUser: !!user,
      hasToken: !!token,
      isAuthenticated,
      userEmail: user?.email,
      loading,
      timestamp: new Date().toISOString(),
    });
  }, [user, token, isAuthenticated, loading]);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        register,
        logout,
        isAuthenticated,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

