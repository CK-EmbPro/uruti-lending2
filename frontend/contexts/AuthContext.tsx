"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
} from "react";
import { useRouter, usePathname } from "next/navigation";
import { authApi, type AuthResponse } from "@/lib/api/auth";

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
  login: (email: string, password: string) => Promise<User>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();
  
  const isAuthenticated = !!user && !!token;
  
  const isVerifyingRef = useRef(false);
  const isLoggingInRef = useRef(false);

  const verifySession = async () => {
    if (isVerifyingRef.current) {
      console.log("[AuthContext] Verification already in progress");
      return;
    }

    const savedToken = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
    if (!savedToken) {
      setLoading(false);
      return;
    }

    console.log("[AuthContext] Verifying session...");
    isVerifyingRef.current = true;

    try {
      const userData = await authApi.getCurrentUser();
      console.log("[AuthContext] Session verified:", userData.email);
      setUser(userData);
      setToken(savedToken);
    } catch (error: any) {
      console.warn("[AuthContext] Session verification failed, clearing state");
      localStorage.removeItem('access_token');
      setUser(null);
      setToken(null);
    } finally {
      setLoading(false);
      isVerifyingRef.current = false;
    }
  };

  // Verify session only once on mount
  useEffect(() => {
    console.log("[AuthContext] Initial mount - verifying session");
    verifySession();
  }, []);

  // Handle redirection for admin routes
  useEffect(() => {
    if (loading) return;

    // List of public routes that don't need auth
    const publicRoutes = [
      '/',
      '/login',
      '/register',
      '/forgot-password',
      '/loan-applications',
    ];

    const isPublicRoute = publicRoutes.some(route => 
      pathname === route || pathname.startsWith('/reset-password')
    );

    // If unauthenticated and trying to access a non-public route, redirect to login
    if (!isAuthenticated && !isPublicRoute) {
      console.log('[AuthContext] Redirecting unauthenticated user to login');
      router.push('/login');
    }
  }, [loading, isAuthenticated, pathname, router]);

  const login = async (email: string, password: string): Promise<User> => {
    if (isLoggingInRef.current) {
      throw new Error("Login already in progress");
    }

    console.log("[AuthContext] Starting login for:", email);
    isLoggingInRef.current = true;

    try {
      const response: AuthResponse = await authApi.login({ email, password });
      console.log("[AuthContext] Login API successful");

      if (response.access_token) {
        localStorage.setItem("access_token", response.access_token);
        setUser(response.user);
        setToken(response.access_token);
        setLoading(false);
      }

      return response.user;
    } catch (error: any) {
      console.error("[AuthContext] Login error:", error.message);
      localStorage.removeItem('access_token');
      setUser(null);
      setToken(null);
      throw error;
    } finally {
      isLoggingInRef.current = false;
    }
  };

  const register = async (email: string, password: string, name: string) => {
    if (isLoggingInRef.current) {
      throw new Error("Registration already in progress");
    }

    isLoggingInRef.current = true;
    try {
      const response: AuthResponse = await authApi.register({
        email,
        password,
        name,
      });
      localStorage.setItem("access_token", response.access_token);
      setToken(response.access_token);
      setUser(response.user);
      setLoading(false);
    } finally {
      isLoggingInRef.current = false;
    }
  };

  const logout = async () => {
    try {
      console.log("[AuthContext] Logging out...");
      await authApi.logout();
    } catch (error) {
      console.error("[AuthContext] Logout error:", error);
    } finally {
      localStorage.removeItem("access_token");
      setUser(null);
      setToken(null);
      console.log("[AuthContext] Logged out");

      // Navigate to login after logout
      if (typeof window !== "undefined") {
        router.replace("/login");
      }
    }
  };



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
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
