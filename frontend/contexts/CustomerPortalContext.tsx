'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
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

  useEffect(() => {
    // Check for stored token on mount
    if (typeof window !== 'undefined') {
      const storedToken = localStorage.getItem('customer_portal_token');
      if (storedToken) {
        setToken(storedToken);
        // Try to get current user
        customerPortalApi.getCurrentUser()
          .then((userData) => {
            setUser(userData);
          })
          .catch(() => {
            // Token invalid, clear it
            localStorage.removeItem('customer_portal_token');
            setToken(null);
          })
          .finally(() => {
            setLoading(false);
          });
      } else {
        setLoading(false);
      }
    }
  }, []);

  const login = async (email: string, password: string, loanNumber?: string) => {
    const loginData: CustomerLoginDto = { email, password, loanNumber };
    const response = await customerPortalApi.login(loginData);
    
    if (response.requiresMfa && response.tempToken) {
      // MFA required, return temp token for verification
      return { requiresMfa: true, tempToken: response.tempToken };
    }
    
    // Normal login successful
    if (response.access_token) {
      localStorage.setItem('customer_portal_token', response.access_token);
      setToken(response.access_token);
      setUser(response.user);
    }
    
    return { requiresMfa: false };
  };

  const verifyMfaLogin = async (tempToken: string, mfaToken: string) => {
    const response = await customerPortalApi.verifyMfaLogin(tempToken, mfaToken);
    if (response.access_token) {
      localStorage.setItem('customer_portal_token', response.access_token);
      setToken(response.access_token);
      setUser(response.user);
    }
  };

  const register = async (email: string, password: string, name: string, phoneNumber?: string, loanNumber?: string) => {
    const registerData: CustomerRegisterDto = { email, password, name, phoneNumber, loanNumber };
    const response = await customerPortalApi.register(registerData);
    localStorage.setItem('customer_portal_token', response.access_token);
    setToken(response.access_token);
    setUser(response.user);
  };

  const logout = () => {
    localStorage.removeItem('customer_portal_token');
    setToken(null);
    setUser(null);
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
        isAuthenticated: !!user && !!token,
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

