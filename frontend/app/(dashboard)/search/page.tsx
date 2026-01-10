'use client';

import { useSearchParams } from 'next/navigation';
import { AdvancedSearch } from '@/components/features/AdvancedSearch';
import { SearchEntityType } from '@/lib/api/search';

export default function SearchPage() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('q') || '';
  const initialType = (searchParams.get('type') as SearchEntityType) || undefined;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Advanced Search</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Search across loans, applications, products, and more with advanced filters
        </p>
      </div>
      <AdvancedSearch initialQuery={initialQuery} initialType={initialType} />
    </div>
  );
}
