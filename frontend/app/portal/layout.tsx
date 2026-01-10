'use client';

import { CustomerPortalProvider } from '@/contexts/CustomerPortalContext';
import { ReactNode } from 'react';

export default function PortalLayout({ children }: { children: ReactNode }) {
  return <CustomerPortalProvider>{children}</CustomerPortalProvider>;
}

