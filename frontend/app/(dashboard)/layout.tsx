"use client";

import { useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Sidebar } from "@/components/layout/Sidebar";
import { GlobalSearch } from "@/components/features/GlobalSearch";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const hasRedirectedRef = useRef(false);

  useEffect(() => {
    console.log("[DashboardLayout] Auth check:", {
      pathname,
      loading,
      isAuthenticated,
      hasRedirected: hasRedirectedRef.current,
    });

    // Prevent redirect loops
    if (hasRedirectedRef.current) {
      console.log("[DashboardLayout] Already redirected, skipping");
      return;
    }

    // Only redirect if loading complete AND not authenticated
    if (!loading && !isAuthenticated) {
      console.log("[DashboardLayout] Not authenticated - redirecting to login");
      hasRedirectedRef.current = true;
      router.replace("/login");
    }
  }, [isAuthenticated, loading, router, pathname]);

  // Reset redirect flag when auth state changes
  useEffect(() => {
    if (isAuthenticated) {
      hasRedirectedRef.current = false;
    }
  }, [isAuthenticated]);

  // Show loading while verifying auth
  if (loading) {
    console.log("[DashboardLayout] Loading...");
    return (
      <div className="min-h-screen flex items-center justify-center bg-background-light dark:bg-background-dark">
        <div className="text-center">
          <div className="text-lg text-text-light dark:text-text-dark mb-2">
            Loading...
          </div>
          <div className="text-sm text-subtext-light dark:text-subtext-dark">
            Verifying authentication
          </div>
        </div>
      </div>
    );
  }

  // Return null while redirecting
  if (!isAuthenticated) {
    console.log("[DashboardLayout] Not authenticated - rendering null");
    return null;
  }

  console.log("[DashboardLayout] Rendering dashboard");

  return (
    <div className="flex min-h-screen bg-background-light dark:bg-background-dark font-display text-text-light dark:text-text-dark">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <header className="sticky top-0 z-30 bg-white dark:bg-background-dark border-b border-gray-200 dark:border-gray-800 px-6 py-4">
          <div className="flex items-center justify-between">
            <GlobalSearch />
          </div>
        </header>
        <main className="flex-1 p-8 overflow-y-auto">
          <div className="max-w-7xl mx-auto">{children}</div>
        </main>
      </div>
    </div>
  );
}
