"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import toast from "react-hot-toast";
import Link from "next/link";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login, isAuthenticated, loading, user } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isSubmitting) return;

    setIsSubmitting(true);
    console.log("[LoginPage] Submitting login...");

    try {
      const user = await login(email, password);
      console.log("[LoginPage] Login successful", user.roles);

      toast.success("Login successful!");

      // Wait for state to fully propagate
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Role-based redirection
      const userRoles = user.roles || [];
      const isStaff = userRoles.some((role: string) => 
        ['admin', 'loan_officer', 'manager', 'approver'].includes(role)
      );

      if (isStaff) {
        console.log("[LoginPage] Staff user detected, redirecting to dashboard");
        router.replace("/dashboard");
      } else {
        console.log("[LoginPage] Regular user detected, redirecting to portal");
        router.replace("/portal/dashboard");
      }
    } catch (error: any) {
      console.error("[LoginPage] Login failed:", error);
      setIsSubmitting(false);

      let errorMessage = "Login failed";
      if (error?.message?.includes("cookie not properly set")) {
        errorMessage = "Authentication error. Please try again.";
      } else if (error?.response?.status === 401) {
        errorMessage = "Invalid email or password";
      } else if (error?.code === "ECONNABORTED") {
        errorMessage = "Connection timeout. Please try again.";
      } else if (!error?.response && error?.request) {
        errorMessage = "Cannot connect to server.";
      }

      toast.error(errorMessage);
    }
  };

  // Show loading while checking auth
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-lg mb-2">Loading...</div>
          <div className="text-sm text-gray-500">
            Checking authentication...
          </div>
        </div>
      </div>
    );
  }

  // Redirect if already authenticated
  if (isAuthenticated && user) {
    const isStaff = user.roles?.some(role => 
      ['admin', 'loan_officer', 'manager', 'approver'].includes(role)
    );
    router.replace(isStaff ? "/dashboard" : "/portal/dashboard");
    return null;
  }

  return (
    <div className="relative flex min-h-screen w-full font-display">
      {/* Left Panel */}
      <div className="hidden lg:flex relative w-2/3 bg-primary items-center justify-center p-12 overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-30"
          style={{
            backgroundImage:
              "url('https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1200')",
          }}
        >
          <div className="absolute inset-0 bg-primary/80"></div>
        </div>

        <div className="relative z-10 flex flex-col text-white max-w-2xl">
          <h1 className="text-5xl font-bold mb-4 leading-tight">
            Sign In to the Simple, Fast and Reliable Lending solutions
          </h1>

          <div className="w-16 h-0.5 bg-white mb-8"></div>

          <p className="text-4xl font-light leading-tight mb-12">
            Empowering Your Financial Journey with Trust, Speed, and
            Transparency
          </p>

          <div className="flex items-center gap-2 text-white/90">
            <span className="material-symbols-outlined text-xl">lock</span>
            <span className="text-sm">
              You are logging in to a safe and secure platform
            </span>
          </div>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="flex flex-1 lg:w-1/3 bg-white items-center justify-center p-8 lg:p-12 relative overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-5"
          style={{
            backgroundImage:
              "url('https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1200')",
          }}
        ></div>

        <div className="relative z-10 w-full max-w-md">
          <form onSubmit={handleSubmit} className="flex flex-col gap-8">
            <div className="flex flex-col">
              <label className="text-sm text-gray-500 mb-2">Email</label>
              <input
                className="bg-transparent border-0 border-b-2 border-teal-500 focus:outline-none focus:border-teal-600 pb-2 text-gray-800 text-base disabled:opacity-50"
                placeholder="Enter your email address"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                disabled={isSubmitting}
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm text-gray-500 mb-2">Password</label>
              <div className="flex items-center border-b-2 border-teal-500 focus-within:border-teal-600">
                <input
                  className="flex-1 bg-transparent border-0 focus:outline-none pb-2 text-gray-800 text-base pr-2 disabled:opacity-50"
                  placeholder="Enter your password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  disabled={isSubmitting}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-gray-400 hover:text-gray-600 transition-colors p-1 disabled:opacity-50"
                  disabled={isSubmitting}
                >
                  <span className="material-symbols-outlined text-xl">
                    {showPassword ? "visibility_off" : "visibility"}
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

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-primary text-white py-4 px-6 font-semibold text-base uppercase tracking-wide hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting ? "SIGNING IN..." : "SIGN IN"}
            </button>

            <p className="text-xs text-gray-500 text-center">
              By signing in you agree to our{" "}
              <Link href="/terms" className="text-primary underline">
                Terms and Conditions.
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
