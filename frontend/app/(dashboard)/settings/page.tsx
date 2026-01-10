'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils/cn';
import toast from 'react-hot-toast';

const settingsNav = [
  { name: 'Profile', href: '/settings', icon: 'person' },
  { name: 'Security', href: '/settings/security', icon: 'lock' },
  { name: 'Notifications', href: '/settings/notifications', icon: 'notifications' },
  { name: 'Account', href: '/settings/account', icon: 'settings' },
];

export default function SettingsPage() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [formData, setFormData] = useState({
    fullName: user?.name || '',
    email: user?.email || '',
    contactNumber: '',
    address: '',
  });
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    // Simulate API call
    setTimeout(() => {
      setIsSaving(false);
      toast.success('Settings saved successfully');
    }, 1000);
  };

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <div className="flex h-auto min-h-screen w-full flex-col">
      <div className="layout-container flex h-full grow flex-row">
        {/* Settings Sidebar */}
        <aside className="flex h-screen w-64 flex-col border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900/50 p-4 sticky top-0">
          {/* User Profile */}
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-10 bg-primary/20 flex items-center justify-center">
              <span className="material-symbols-outlined text-primary text-2xl">person</span>
            </div>
            <div className="flex flex-col">
              <h1 className="text-base font-medium leading-normal text-text-light dark:text-text-dark">
                {user?.name || 'User'}
              </h1>
              <p className="text-sm font-normal leading-normal text-text-secondary-light dark:text-text-secondary-dark">
                {user?.email || 'user@example.com'}
              </p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="mt-8 flex flex-col gap-2">
            {settingsNav.map((item) => {
              const isActive = pathname === item.href || (item.href === '/settings' && pathname === '/settings');
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2 rounded-lg transition-colors',
                    isActive
                      ? 'bg-primary/10 dark:bg-primary/20 text-primary'
                      : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-text-secondary-light dark:text-text-secondary-dark'
                  )}
                >
                  <span
                    className={cn(
                      'material-symbols-outlined',
                      isActive && "text-primary"
                    )}
                    style={isActive ? { fontVariationSettings: "'FILL' 1" } : {}}
                  >
                    {item.icon}
                  </span>
                  <p className="text-sm font-medium leading-normal text-text-light dark:text-text-dark">
                    {item.name}
                  </p>
                </Link>
              );
            })}
          </nav>

          {/* Footer Actions */}
          <div className="mt-auto flex flex-col gap-2">
            <Link
              href="/help"
              className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-text-secondary-light dark:text-text-secondary-dark transition-colors"
            >
              <span className="material-symbols-outlined">help</span>
              <p className="text-sm font-medium leading-normal text-text-light dark:text-text-dark">
                Help & Support
              </p>
            </Link>
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-text-secondary-light dark:text-text-secondary-dark transition-colors text-left"
            >
              <span className="material-symbols-outlined">logout</span>
              <p className="text-sm font-medium leading-normal text-text-light dark:text-text-dark">
                Logout
              </p>
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-8 sm:p-10 lg:p-12">
          <div className="max-w-4xl mx-auto">
            <div className="flex flex-wrap justify-between gap-3 pb-8 border-b border-gray-200 dark:border-gray-700">
              <p className="text-3xl lg:text-4xl font-black leading-tight tracking-[-0.033em] text-text-light dark:text-text-dark">
                Account Settings
              </p>
            </div>

            <div className="mt-8 bg-white dark:bg-gray-900/50 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-xl lg:text-[22px] font-bold leading-tight tracking-[-0.015em] text-text-light dark:text-text-dark">
                  Personal Information
                </h2>
                <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark mt-1">
                  Update your personal details here.
                </p>
              </div>

              <form onSubmit={handleSubmit}>
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <label className="flex flex-col md:col-span-2">
                      <p className="text-sm font-medium leading-normal pb-2 text-text-light dark:text-text-dark">
                        Full Name
                      </p>
                      <input
                        className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg text-text-light dark:text-text-dark focus:outline-0 focus:ring-2 focus:ring-primary/50 border border-border-light dark:border-border-dark bg-background-light dark:bg-background-dark h-12 placeholder:text-text-muted-light dark:placeholder:text-text-muted-dark p-3 text-base font-normal leading-normal"
                        placeholder="Enter your full name"
                        value={formData.fullName}
                        onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                      />
                    </label>
                    <label className="flex flex-col">
                      <p className="text-sm font-medium leading-normal pb-2 text-text-light dark:text-text-dark">
                        Email Address
                      </p>
                      <input
                        className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg text-text-light dark:text-text-dark focus:outline-0 focus:ring-2 focus:ring-primary/50 border border-border-light dark:border-border-dark bg-background-light dark:bg-background-dark h-12 placeholder:text-text-muted-light dark:placeholder:text-text-muted-dark p-3 text-base font-normal leading-normal"
                        placeholder="your.email@example.com"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      />
                    </label>
                    <label className="flex flex-col">
                      <p className="text-sm font-medium leading-normal pb-2 text-text-light dark:text-text-dark">
                        Contact Number
                      </p>
                      <input
                        className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg text-text-light dark:text-text-dark focus:outline-0 focus:ring-2 focus:ring-primary/50 border border-border-light dark:border-border-dark bg-background-light dark:bg-background-dark h-12 placeholder:text-text-muted-light dark:placeholder:text-text-muted-dark p-3 text-base font-normal leading-normal"
                        placeholder="(123) 456-7890"
                        type="tel"
                        value={formData.contactNumber}
                        onChange={(e) => setFormData({ ...formData, contactNumber: e.target.value })}
                      />
                    </label>
                    <label className="flex flex-col md:col-span-2">
                      <p className="text-sm font-medium leading-normal pb-2 text-text-light dark:text-text-dark">
                        Residential Address
                      </p>
                      <input
                        className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg text-text-light dark:text-text-dark focus:outline-0 focus:ring-2 focus:ring-primary/50 border border-border-light dark:border-border-dark bg-background-light dark:bg-background-dark h-12 placeholder:text-text-muted-light dark:placeholder:text-text-muted-dark p-3 text-base font-normal leading-normal"
                        placeholder="123 Main St, Anytown, USA 12345"
                        value={formData.address}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      />
                    </label>
                  </div>
                </div>

                <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 rounded-b-xl">
                  <button
                    type="button"
                    className="px-4 py-2 text-sm font-medium rounded-lg bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-text-light dark:text-text-dark"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="px-4 py-2 text-sm font-medium rounded-lg bg-primary hover:bg-primary/90 text-white disabled:opacity-50"
                  >
                    {isSaving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
