"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
} from "react";
import { useRouter } from "next/navigation";
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
  const isVerifyingRef = useRef(false);
  const isLoggingInRef = useRef(false);

  const verifySession = async () => {
    if (isVerifyingRef.current) {
      console.log("[AuthContext] Verification already in progress");
      return;
    }

    console.log("[AuthContext] Verifying session...");
    isVerifyingRef.current = true;

    try {
      const userData = await authApi.getCurrentUser();
      console.log("[AuthContext] Session verified:", userData.email);
      setUser(userData);
      setToken("cookie-set");
    } catch (error: any) {
      console.warn("[AuthContext] Session verification failed:", {
        status: error?.response?.status,
        message: error?.message,
      });

      const is401 = error?.response?.status === 401;
      if (is401) {
        console.log("[AuthContext] 401 - Clearing auth state");
        setUser(null);
        setToken(null);
      }
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

  const login = async (email: string, password: string): Promise<User> => {
    if (isLoggingInRef.current) {
      throw new Error("Login already in progress");
    }

    console.log("[AuthContext] Starting login for:", email);
    isLoggingInRef.current = true;

    try {
      // Step 1: Login and get response (backend sets cookie)
      const response: AuthResponse = await authApi.login({ email, password });
      console.log("[AuthContext] Login API successful");

      // Step 2: Update state
      setUser(response.user);
      setToken("cookie-set");
      setLoading(false);

      // Step 3: Verify cookie with a retry mechanism
      console.log("[AuthContext] Verifying cookie...");
      let verified = false;
      let attempts = 0;
      const maxAttempts = 3;

      while (!verified && attempts < maxAttempts) {
        try {
          await authApi.getCurrentUser();
          verified = true;
          console.log("[AuthContext] Cookie verified successfully");
        } catch (verifyError: any) {
          attempts++;
          if (attempts < maxAttempts) {
            console.warn(
              `[AuthContext] Verification attempt ${attempts} failed, retrying...`
            );
            await new Promise((resolve) => setTimeout(resolve, 300));
          } else {
            console.error(
              "[AuthContext] Cookie verification failed after retries"
            );
            throw new Error("Authentication failed - cookie not properly set");
          }
        }
      }

      console.log("[AuthContext] Login complete and verified");
      return response.user;
    } catch (error: any) {
      console.error("[AuthContext] Login error:", error.message);
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
      localStorage.setItem("auth_token", response.access_token);
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
      setUser(null);
      setToken(null);
      console.log("[AuthContext] Logged out");

      // Navigate to login after logout
      if (typeof window !== "undefined") {
        router.replace("/login");
      }
    }
  };

  const isAuthenticated = !!user && !!token;

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
