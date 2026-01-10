'use client';

import { ArrowUp, ArrowDown } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface SortableHeaderProps {
  children: React.ReactNode;
  onSort: () => void;
  sortDirection?: 'asc' | 'desc' | null;
  className?: string;
}

export function SortableHeader({
  children,
  onSort,
  sortDirection,
  className,
}: SortableHeaderProps) {
  return (
    <th
      className={cn(
        'px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none',
        className
      )}
      onClick={onSort}
    >
      <div className="flex items-center gap-2">
        <span>{children}</span>
        <div className="flex flex-col">
          <ArrowUp
            className={cn(
              'w-3 h-3',
              sortDirection === 'asc' ? 'text-blue-600' : 'text-gray-400'
            )}
          />
          <ArrowDown
            className={cn(
              'w-3 h-3 -mt-1',
              sortDirection === 'desc' ? 'text-blue-600' : 'text-gray-400'
            )}
          />
        </div>
      </div>
    </th>
  );
}

