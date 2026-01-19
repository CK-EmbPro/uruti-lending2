'use client';

import { AuthProvider } from "@/contexts/AuthContext";
import { CustomerPortalProvider } from "@/contexts/CustomerPortalContext";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { ReactNode } from "react";
import { usePathname } from "next/navigation";

export default function MainLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  
  // List of paths that SHOULD NOT have the admin sidebar/header
  const isLandingPage = pathname === '/';
  const isAuthPage = pathname === '/login' || pathname === '/register' || pathname === '/forgot-password' || pathname?.startsWith('/reset-password');
  
  const showAdminLayout = !isLandingPage && !isAuthPage;

  return (
    <AuthProvider>
      <CustomerPortalProvider>
        {showAdminLayout ? (
          <div className="flex h-screen overflow-hidden bg-background-light dark:bg-background-dark">
            <Sidebar />
            <div className="flex flex-col flex-1 overflow-hidden">
              <Header />
              <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
                {children}
              </main>
            </div>
          </div>
        ) : (
          <>{children}</>
        )}
      </CustomerPortalProvider>
    </AuthProvider>
  );
}
