'use client';

import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/Button';
import { MobileMenu } from './MobileMenu';
import { GlobalSearch } from '@/components/features/GlobalSearch';
import { useRouter } from 'next/navigation';

export function Header() {
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
      <div className="px-4 sm:px-6 py-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4 flex-1">
          <MobileMenu />
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Uruti Lending Platform</h1>
        </div>
        <div className="hidden lg:block flex-1 max-w-2xl mx-4">
          <GlobalSearch />
        </div>
        <div className="hidden md:flex items-center gap-4">
          {user && (
            <span className="text-sm text-gray-700 dark:text-gray-300">
              {user.name} ({user.email})
            </span>
          )}
          <Button variant="outline" size="sm" onClick={handleLogout}>
            Logout
          </Button>
        </div>
      </div>
    </header>
  );
}

