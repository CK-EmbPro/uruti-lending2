'use client';

import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';

export default function SecuritiesPage() {
  // TODO: Implement securities list
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Securities</h1>
      </div>

      <Card>
        <p className="text-center py-12 text-gray-500">
          Securities management will be implemented here
        </p>
      </Card>
    </div>
  );
}

