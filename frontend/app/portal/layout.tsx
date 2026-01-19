'use client';

import { PortalAuthGuard } from '@/components/auth/PortalAuthGuard';
import { CustomerPortalProvider } from '@/contexts/CustomerPortalContext';
import { ReactNode } from 'react';

export default function PortalLayout({ children }: { children: ReactNode }) {
  return (
    <CustomerPortalProvider>
      {children}
    </CustomerPortalProvider>
  );
}

