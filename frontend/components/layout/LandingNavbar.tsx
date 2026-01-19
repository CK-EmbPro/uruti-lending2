"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCustomerPortal } from "@/contexts/CustomerPortalContext";
import { Dropdown } from "@/components/ui/Dropdown";
import { User, LayoutDashboard, LogOut } from "lucide-react";
import toast from "react-hot-toast";

export function LandingNavbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { isAuthenticated, loading, user, logout } = useCustomerPortal();
  const router = useRouter();

  const handleApplyLoan = (e: React.MouseEvent) => {
    if (loading) return;
    if (!isAuthenticated) {
      e.preventDefault();
      toast.error("Please log in first to apply for a loan", {
        icon: "🔐",
        duration: 4000,
      });
      router.push("/portal/login");
      return;
    }
    router.push("/portal/dashboard");
  };

  const handleLogout = () => {
    logout();
    toast.success("Logged out successfully");
  };

  const dropdownItems = [
    {
      label: "Portal Dashboard",
      onClick: () => router.push("/portal/dashboard"),
      icon: <LayoutDashboard className="w-4 h-4" />,
    },
    {
      label: "Logout",
      onClick: handleLogout,
      icon: <LogOut className="w-4 h-4" />,
      danger: true,
    },
  ];

  return (
    <div className="flex flex-1 justify-center border-b border-border-light dark:border-border-dark bg-white/80 dark:bg-background-dark/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="layout-content-container flex flex-col w-full max-w-6xl flex-1">
        <header className="flex items-center justify-between whitespace-nowrap px-4 sm:px-6 lg:px-8 py-4">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3">
            <div className="size-6 text-primary">
              <svg
                fill="none"
                viewBox="0 0 48 48"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M44 11.2727C44 14.0109 39.8386 16.3957 33.69 17.6364C39.8386 18.877 44 21.2618 44 24C44 26.7382 39.8386 29.123 33.69 30.3636C39.8386 31.6043 44 33.9891 44 36.7273C44 40.7439 35.0457 44 24 44C12.9543 44 4 40.7439 4 36.7273C4 33.9891 8.16144 31.6043 14.31 30.3636C8.16144 29.123 4 26.7382 4 24C4 21.2618 8.16144 18.877 14.31 17.6364C8.16144 16.3957 4 14.0109 4 11.2727C4 7.25611 12.9543 4 24 4C35.0457 4 44 7.25611 44 11.2727Z"
                  fill="currentColor"
                />
              </svg>
            </div>
            <h2 className="text-text-light dark:text-text-dark text-xl font-bold">
              Uruti
            </h2>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex flex-1 justify-end gap-8">
            <div className="flex items-center gap-6">
              <a
                className="text-subtext-light dark:text-subtext-dark hover:text-primary dark:hover:text-white text-sm font-medium transition-colors"
                href="#personal-loans"
              >
                Personal Loans
              </a>
              <a
                className="text-subtext-light dark:text-subtext-dark hover:text-primary dark:hover:text-white text-sm font-medium transition-colors"
                href="#business-loans"
              >
                Business Loans
              </a>
              <a
                className="text-subtext-light dark:text-subtext-dark hover:text-primary dark:hover:text-white text-sm font-medium transition-colors"
                href="#how-it-works"
              >
                How It Works
              </a>
              <a
                className="text-subtext-light dark:text-subtext-dark hover:text-primary dark:hover:text-white text-sm font-medium transition-colors"
                href="#about"
              >
                About Us
              </a>
            </div>

            {/* Auth Section */}
            <div className="flex items-center gap-3">
              {/* Auth Section */}
              <div className="flex items-center gap-3">
                {loading && (
                  <>
                    {/* Login Button Skeleton */}
                    <div className="flex min-w-[84px] h-10 px-4 rounded-lg bg-gray-200 dark:bg-gray-700 animate-pulse">
                      <div className="w-16 h-4 bg-gray-300 dark:bg-gray-600 rounded self-center"></div>
                    </div>
                    {/* Apply Now Button Skeleton */}
                    <div className="flex min-w-[84px] h-10 px-4 rounded-lg bg-gray-200 dark:bg-gray-700 animate-pulse">
                      <div className="w-20 h-4 bg-gray-300 dark:bg-gray-600 rounded self-center"></div>
                    </div>
                  </>
                )}
              </div>

              {!loading && !isAuthenticated && (
                <>
                  <Link href="/login">
                    <button className="flex min-w-[84px] cursor-pointer items-center justify-center rounded-lg h-10 px-4 bg-background-light dark:bg-background-dark text-text-light dark:text-text-dark border border-border-light dark:border-border-dark hover:bg-gray-100 dark:hover:bg-gray-800 text-sm font-bold transition-colors">
                      <span className="truncate">Log In</span>
                    </button>
                  </Link>
                  <button
                    onClick={handleApplyLoan}
                    className="flex min-w-[84px] cursor-pointer items-center justify-center rounded-lg h-10 px-4 bg-primary text-white text-sm font-bold hover:bg-primary/90 transition-colors"
                  >
                    <span className="truncate">Apply Now</span>
                  </button>
                </>
              )}

              {!loading && isAuthenticated && (
                <>
                  <button
                    onClick={handleApplyLoan}
                    className="flex min-w-[84px] cursor-pointer items-center justify-center rounded-lg h-10 px-4 bg-primary text-white text-sm font-bold hover:bg-primary/90 transition-colors"
                  >
                    <span className="truncate">Apply Now</span>
                  </button>

                  {/* User Dropdown */}
                  <Dropdown
                    trigger={
                      <button className="flex items-center justify-center size-10 rounded-full bg-primary/20 hover:bg-primary/30 transition-colors cursor-pointer">
                        <User className="text-primary" size={20} />
                      </button>
                    }
                    items={dropdownItems}
                    align="right"
                  />
                </>
              )}
            </div>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden flex items-center justify-center rounded-lg h-10 w-10 border border-border-light dark:border-border-dark hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <span className="material-symbols-outlined text-text-light dark:text-text-dark">
              menu
            </span>
          </button>
        </header>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-border-light dark:border-border-dark bg-white dark:bg-background-dark px-4 py-4 space-y-3">
            <a
              href="#personal-loans"
              className="block text-subtext-light dark:text-subtext-dark hover:text-primary dark:hover:text-white text-sm font-medium transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              Personal Loans
            </a>
            <a
              href="#business-loans"
              className="block text-subtext-light dark:text-subtext-dark hover:text-primary dark:hover:text-white text-sm font-medium transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              Business Loans
            </a>
            <a
              href="#how-it-works"
              className="block text-subtext-light dark:text-subtext-dark hover:text-primary dark:hover:text-white text-sm font-medium transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              How It Works
            </a>
            <a
              href="#about"
              className="block text-subtext-light dark:text-subtext-dark hover:text-primary dark:hover:text-white text-sm font-medium transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              About Us
            </a>

            {/* Mobile Auth Section */}
            <div className="pt-2 space-y-2 border-t border-border-light dark:border-border-dark">
              {!loading && !isAuthenticated && (
                <>
                  <Link href="/portal/login" onClick={() => setMobileMenuOpen(false)}>
                    <button className="w-full flex items-center justify-center rounded-lg h-10 px-4 bg-background-light dark:bg-background-dark text-text-light dark:text-text-dark border border-border-light dark:border-border-dark hover:bg-gray-100 dark:hover:bg-gray-800 text-sm font-bold transition-colors">
                      Log In
                    </button>
                  </Link>
                  <button
                    onClick={(e) => {
                      setMobileMenuOpen(false);
                      handleApplyLoan(e);
                    }}
                    className="w-full flex items-center justify-center rounded-lg h-10 px-4 bg-primary text-white text-sm font-bold hover:bg-primary/90 transition-colors"
                  >
                    Apply Now
                  </button>
                </>
              )}

              {!loading && isAuthenticated && (
                <>
                  <button
                    onClick={(e) => {
                      setMobileMenuOpen(false);
                      handleApplyLoan(e);
                    }}
                    className="w-full flex items-center justify-center rounded-lg h-10 px-4 bg-primary text-white text-sm font-bold hover:bg-primary/90 transition-colors"
                  >
                    Apply Now
                  </button>
                  <Link
                    href="/portal/dashboard"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <button className="w-full flex items-center justify-center gap-2 rounded-lg h-10 px-4 bg-background-light dark:bg-background-dark text-text-light dark:text-text-dark border border-border-light dark:border-border-dark hover:bg-gray-100 dark:hover:bg-gray-800 text-sm font-bold transition-colors">
                      <LayoutDashboard className="w-4 h-4" />
                      Dashboard
                    </button>
                  </Link>
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      handleLogout();
                    }}
                    className="w-full flex items-center justify-center gap-2 rounded-lg h-10 px-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 hover:bg-red-100 dark:hover:bg-red-900/30 text-sm font-bold transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    Logout
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
