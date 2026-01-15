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

  const verifySession = async () => {
    try {
      const userData = await customerPortalApi.getCurrentUser();
      setUser(userData);
      setToken('cookie-set');
    } catch (error) {
      setUser(null);
      setToken(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    verifySession();
  }, []);

  const login = async (email: string, password: string, loanNumber?: string) => {
    const loginData: CustomerLoginDto = { email, password, loanNumber };
    const response = await customerPortalApi.login(loginData);
    
    if (response.requiresMfa && response.tempToken) {
      return { requiresMfa: true, tempToken: response.tempToken };
    }
    
    if (response.user) {
      setUser(response.user);
      setToken('cookie-set');
      
      // Verify cookie
      try {
        await customerPortalApi.getCurrentUser();
      } catch (error) {
        console.error('Cookie verification failed');
      }
    }
    
    return { requiresMfa: false };
  };

  const verifyMfaLogin = async (tempToken: string, mfaToken: string) => {
    const response = await customerPortalApi.verifyMfaLogin(tempToken, mfaToken);
    if (response.user) {
      setUser(response.user);
      setToken('cookie-set');
      
      // Verify cookie
      try {
        await customerPortalApi.getCurrentUser();
      } catch (error) {
        console.error('Cookie verification failed');
      }
    }
  };

  const register = async (email: string, password: string, name: string, phoneNumber?: string, loanNumber?: string) => {
    const registerData: CustomerRegisterDto = { email, password, name, phoneNumber, loanNumber };
    const response = await customerPortalApi.register(registerData);
    if (response.user) {
      setUser(response.user);
      setToken('cookie-set');
    }
  };

  const logout = async () => {
    try {
      await customerPortalApi.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
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

