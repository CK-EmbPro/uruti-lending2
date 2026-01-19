'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { customerPortalApi, CustomerPortalUser, CustomerLoginDto, CustomerRegisterDto } from '@/lib/api/customer-portal';

interface CustomerPortalContextType {
  user: CustomerPortalUser | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string, loanNumber?: string) => Promise<{ requiresMfa: boolean; tempToken?: string }>;
  verifyMfaLogin: (tempToken: string, mfaToken: string) => Promise<void>;
  register: (email: string, password: string, name: string, phoneNumber?: string, loanNumber?: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const CustomerPortalContext = createContext<CustomerPortalContextType | undefined>(undefined);

export function CustomerPortalProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<CustomerPortalUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  const isAuthenticated = !!user && !!token;

  const verifySession = async () => {
    const savedToken = typeof window !== 'undefined' ? localStorage.getItem('customer_token') : null;
    if (!savedToken) {
      setLoading(false);
      return;
    }

    try {
      const userData = await customerPortalApi.getCurrentUser();
      setUser(userData);
      setToken(savedToken);
    } catch (error) {
      localStorage.removeItem('customer_token');
      setUser(null);
      setToken(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    verifySession();
  }, []);

  // Handle redirection
  useEffect(() => {
    if (loading) return;

    // Only perform redirection if we are in the portal area
    if (!pathname?.startsWith('/portal/')) return;

    const isPublicRoute = 
      pathname === '/portal/login' || 
      pathname === '/portal/register' || 
      pathname === '/portal/forgot-password' || 
      pathname.startsWith('/portal/reset-password');

    if (!isAuthenticated && !isPublicRoute) {
      console.log('[CustomerPortalContext] Redirecting unauthenticated user to login');
      router.push('/portal/login');
    }
  }, [loading, isAuthenticated, pathname, router]);

  const login = async (email: string, password: string, loanNumber?: string) => {
    const loginData: CustomerLoginDto = { email, password, loanNumber };
    const response = await customerPortalApi.login(loginData);
    
    if (response.requiresMfa && response.tempToken) {
      return { requiresMfa: true, tempToken: response.tempToken };
    }
    
    if (response.user && response.access_token) {
      localStorage.setItem('customer_token', response.access_token);
      setUser(response.user);
      setToken(response.access_token);
    }
    
    return { requiresMfa: false };
  };

  const verifyMfaLogin = async (tempToken: string, mfaToken: string) => {
    const response = await customerPortalApi.verifyMfaLogin(tempToken, mfaToken);
    if (response.user && response.access_token) {
      localStorage.setItem('customer_token', response.access_token);
      setUser(response.user);
      setToken(response.access_token);
    }
  };

  const register = async (email: string, password: string, name: string, phoneNumber?: string, loanNumber?: string) => {
    const registerData: CustomerRegisterDto = { email, password, name, phoneNumber, loanNumber };
    const response = await customerPortalApi.register(registerData);
    if (response.user && response.access_token) {
      localStorage.setItem('customer_token', response.access_token);
      setUser(response.user);
      setToken(response.access_token);
    }
  };

  const logout = async () => {
    try {
      await customerPortalApi.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('customer_token');
      setToken(null);
      setUser(null);
    }
  };

  return (
    <CustomerPortalContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        verifyMfaLogin,
        register,
        logout,
        isAuthenticated,
      }}
    >
      {children}
    </CustomerPortalContext.Provider>
  );
}

export function useCustomerPortal() {
  const context = useContext(CustomerPortalContext);
  if (context === undefined) {
    throw new Error('useCustomerPortal must be used within a CustomerPortalProvider');
  }
  return context;
}

