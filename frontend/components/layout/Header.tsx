"use client";

import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/Button";
import { MobileMenu } from "./MobileMenu";
import { GlobalSearch } from "@/components/features/GlobalSearch";
import { useRouter } from "next/navigation";
import { useState, useRef, useEffect } from "react";

export function Header() {
  const { user, logout, isAuthenticated } = useAuth();
  const router = useRouter();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    setShowUserMenu(false);
    router.push("/login");
  };

  const handleDashboard = () => {
    setShowUserMenu(false);
    router.push("/dashboard");
  };

  return (
    <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
      <div className="px-4 sm:px-6 py-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4 flex-1">
          <MobileMenu />
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">
            Uruti Lending Platform
          </h1>
        </div>
        <div className="hidden lg:block flex-1 max-w-2xl mx-4">
          <GlobalSearch />
        </div>
        <div
          className="hidden md:flex items-center gap-4 relative"
          ref={menuRef}
        >
          {isAuthenticated && user ? (
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center justify-center w-10 h-10 rounded-full bg-primary text-white font-bold hover:bg-primary/90 transition-colors"
                title={user.name}
              >
                {user.name.charAt(0).toUpperCase()}
              </button>

              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50">
                  <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">
                      {user.name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {user.email}
                    </p>
                  </div>
                  <button
                    onClick={handleDashboard}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center gap-2"
                  >
                    <span className="material-symbols-outlined text-base">
                      dashboard
                    </span>
                    Go to Dashboard
                  </button>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors border-t border-gray-200 dark:border-gray-700 flex items-center gap-2"
                  >
                    <span className="material-symbols-outlined text-base">
                      logout
                    </span>
                    Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Button variant="outline" size="sm">
              <a href="/login">Log In</a>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
