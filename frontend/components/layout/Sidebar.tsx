'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils/cn';
import { useAuth } from '@/contexts/AuthContext';
import { useLoans } from '@/lib/hooks/useLoan';
import { useLoanApplications } from '@/lib/hooks/useLoanApplication';
import { useDelinquentLoans } from '@/lib/hooks/useCollections';
import { usePendingVerifications } from '@/lib/hooks/useCustomerPortalVerifications';
import { NotificationCenter } from '@/components/features/NotificationCenter';
import { 
  LayoutDashboard, 
  FileText, 
  Wallet, 
  CreditCard, 
  Shield, 
  BarChart3, 
  User, 
  LogOut,
  Sparkles,
  AlertCircle,
  AlertTriangle,
  Settings,
  Workflow,
  Users,
  Bell,
  Plug,
  Search,
  Brain,
  Zap,
  Globe,
  Award,
  Wrench
} from 'lucide-react';

interface NavItem {
  name: string;
  href: string;
  icon: string;
  badge?: number;
  section?: string;
}

const mainNavigation: NavItem[] = [
  { name: 'Dashboard', href: '/dashboard', icon: 'dashboard', section: 'main' },
  { name: 'Search', href: '/search', icon: 'search', section: 'main' },
  { name: 'Product Recommendations', href: '/products/recommendations', icon: 'sparkles', section: 'main' },
  { name: 'Pre-Qualification', href: '/pre-qualification', icon: 'sparkles', section: 'main' },
  { name: 'Loan Applications', href: '/loan-applications', icon: 'description', section: 'main' },
  { name: 'My Loans', href: '/loans', icon: 'account_balance_wallet', section: 'main' },
  { name: 'Notifications', href: '/notifications', icon: 'bell', section: 'main' },
  { name: 'Disbursements', href: '/disbursements', icon: 'payments', section: 'transactions' },
  { name: 'Repayments', href: '/repayments', icon: 'credit_card', section: 'transactions' },
  { name: 'Collections', href: '/collections', icon: 'alert_circle', section: 'transactions' },
  { name: 'Securities', href: '/securities', icon: 'security', section: 'transactions' },
  { name: 'Accounting', href: '/accounting', icon: 'account_balance', section: 'transactions' },
  { name: 'Analytics', href: '/analytics', icon: 'analytics', section: 'analytics' },
  { name: 'Predictive Analytics', href: '/predictive-analytics', icon: 'brain', section: 'analytics' },
  { name: 'Integrations', href: '/integrations/platforms', icon: 'plug', section: 'analytics' },
  { name: 'Marketing', href: '/marketing', icon: 'marketing', section: 'analytics' },
  { name: 'Reports', href: '/reports', icon: 'assessment', section: 'analytics' },
  { name: 'Risk Management', href: '/risk-management', icon: 'risk_management', section: 'analytics' },
  { name: 'Fraud Detection', href: '/fraud-detection', icon: 'shield', section: 'analytics' },
  { name: 'Compliance', href: '/compliance', icon: 'security', section: 'analytics' },
  { name: 'Administration', href: '/administration', icon: 'settings', section: 'analytics' },
  { name: 'Workflow & Exception', href: '/workflow-exception', icon: 'workflow', section: 'analytics' },
  { name: 'Workflow Automation', href: '/workflow-automation', icon: 'zap', section: 'analytics' },
  { name: 'Multi-Currency', href: '/currency', icon: 'globe', section: 'analytics' },
  { name: 'FX Hedging', href: '/currency/hedging', icon: 'shield', section: 'analytics' },
  { name: 'Loyalty & Rewards', href: '/loyalty', icon: 'award', section: 'main' },
  { name: 'Customer Portal Verifications', href: '/customer-portal/verifications', icon: 'shield', section: 'analytics' },
  { name: 'Platform Tools', href: '/tools', icon: 'wrench', section: 'analytics' },
];

// Icon mapping component
const IconRenderer = ({ iconName, className, isActive }: { iconName: string; className?: string; isActive?: boolean }) => {
  const iconProps = { className: cn('flex-shrink-0', className), size: 20 };
  
  switch (iconName) {
    case 'dashboard':
      return <LayoutDashboard {...iconProps} />;
    case 'description':
      return <FileText {...iconProps} />;
    case 'account_balance_wallet':
      return <Wallet {...iconProps} />;
    case 'payments':
      return <CreditCard {...iconProps} />;
    case 'credit_card':
      return <CreditCard {...iconProps} />;
    case 'security':
      return <Shield {...iconProps} />;
    case 'analytics':
      return <BarChart3 {...iconProps} />;
    case 'assessment':
      return <BarChart3 {...iconProps} />;
    case 'sparkles':
      return <Sparkles {...iconProps} />;
    case 'person':
      return <User {...iconProps} />;
    case 'logout':
      return <LogOut {...iconProps} />;
    case 'alert_circle':
      return <AlertCircle {...iconProps} />;
    case 'risk_management':
      return <AlertTriangle {...iconProps} />;
    case 'settings':
      return <Settings {...iconProps} />;
    case 'workflow':
      return <Workflow {...iconProps} />;
    case 'marketing':
      return <Users {...iconProps} />;
    case 'account_balance':
      return <Wallet {...iconProps} />;
    case 'bell':
      return <Bell {...iconProps} />;
    case 'plug':
      return <Plug {...iconProps} />;
    case 'search':
      return <Search {...iconProps} />;
    case 'shield':
      return <Shield {...iconProps} />;
    case 'brain':
      return <Brain {...iconProps} />;
    case 'zap':
      return <Zap {...iconProps} />;
    case 'globe':
      return <Globe {...iconProps} />;
    case 'award':
      return <Award {...iconProps} />;
    case 'wrench':
      return <Wrench {...iconProps} />;
    default:
      return <FileText {...iconProps} />;
  }
};

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { logout, user } = useAuth();
  const { data: loans = [] } = useLoans();
  const { data: applications = [] } = useLoanApplications();
  const { data: delinquentLoans = [] } = useDelinquentLoans();
  const { data: pendingVerifications = [] } = usePendingVerifications();

  // Calculate badges
  const pendingApplications = applications.filter(
    (app) => ['Submitted', 'Under Review', 'Pending'].includes(app.status || '')
  ).length;

  const activeLoans = loans.filter(
    (loan) => ['Disbursed', 'Active', 'Partially Disbursed'].includes(loan.status)
  ).length;

  const delinquentCount = delinquentLoans.length;

  const pendingVerificationCount = pendingVerifications.length;

  const navigationWithBadges = mainNavigation.map((item) => {
    if (item.href === '/loan-applications' && pendingApplications > 0) {
      return { ...item, badge: pendingApplications };
    }
    if (item.href === '/loans' && activeLoans > 0) {
      return { ...item, badge: activeLoans };
    }
    if (item.href === '/collections' && delinquentCount > 0) {
      return { ...item, badge: delinquentCount };
    }
    if (item.href === '/customer-portal/verifications' && pendingVerificationCount > 0) {
      return { ...item, badge: pendingVerificationCount };
    }
    return item;
  });

  // Group navigation by section
  const groupedNavigation = navigationWithBadges.reduce((acc, item) => {
    const section = item.section || 'main';
    if (!acc[section]) {
      acc[section] = [];
    }
    acc[section].push(item);
    return acc;
  }, {} as Record<string, NavItem[]>);

  const sectionLabels: Record<string, string> = {
    main: 'MAIN',
    transactions: 'TRANSACTIONS',
    analytics: 'ANALYTICS',
  };

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  // Get user role/name
  const userDisplayName = user?.roles?.includes('Admin') || user?.roles?.includes('System Administrator')
    ? 'System Administrator'
    : user?.name || 'User';

  return (
    <aside className="flex w-64 flex-col border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-background-dark">
      {/* User Profile Section */}
      {user && (
        <div className="p-4 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-background-light dark:bg-background-dark">
            <div className="bg-primary/20 rounded-lg size-10 flex items-center justify-center flex-shrink-0">
              <User className="text-primary" size={20} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-text-light dark:text-text-dark text-sm font-semibold truncate">
                {userDisplayName}
              </p>
              <p className="text-text-secondary-light dark:text-text-secondary-dark text-xs truncate">
                {user.email}
              </p>
            </div>
            <NotificationCenter userId={user.id} />
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-3">
        <div className="space-y-6">
          {Object.entries(groupedNavigation).map(([section, items]) => (
            <div key={section}>
              <p className="text-text-secondary-light dark:text-text-secondary-dark text-xs font-semibold uppercase tracking-wider px-3 mb-2">
                {sectionLabels[section] || section}
              </p>
              <div className="space-y-1">
                {items.map((item) => {
                  const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group relative',
                        isActive
                          ? 'bg-primary/10 text-primary dark:bg-primary/20'
                          : 'hover:bg-gray-100 dark:hover:bg-white/10 text-text-secondary-light dark:text-text-secondary-dark'
                      )}
                    >
                      <IconRenderer 
                        iconName={item.icon}
                        className={cn(
                          'text-xl',
                          isActive ? 'text-primary' : 'text-text-secondary-light dark:text-text-secondary-dark group-hover:text-primary'
                        )}
                        isActive={isActive}
                      />
                      <span className={cn(
                        'text-sm font-medium leading-normal flex-1',
                        isActive ? 'text-primary' : 'text-text-light dark:text-text-dark'
                      )}>
                        {item.name}
                      </span>
                      {item.badge && item.badge > 0 && (
                        <span className="flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-primary text-white text-xs font-bold">
                          {item.badge > 99 ? '99+' : item.badge}
                        </span>
                      )}
                      {isActive && (
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-primary rounded-r-full" />
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </nav>

      {/* Footer - Logout Only */}
      <div className="border-t border-gray-200 dark:border-gray-800 p-4">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-text-secondary-light dark:text-text-secondary-dark hover:text-red-600 dark:hover:text-red-400 transition-colors w-full text-left group"
        >
          <LogOut className="text-xl text-text-secondary-light dark:text-text-secondary-dark group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors" size={20} />
          <span className="text-sm font-medium leading-normal text-text-light dark:text-text-dark group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors">
            Logout
          </span>
        </button>
      </div>
    </aside>
  );
}
