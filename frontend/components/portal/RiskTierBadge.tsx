'use client';

import { Badge } from '@/components/ui/Badge';
import { Info } from 'lucide-react';
import { Tooltip } from '@/components/ui/Tooltip';

interface RiskTierBadgeProps {
  tier: 'PRIME' | 'STANDARD' | 'MONITORED' | 'HIGH_RISK';
  displayName?: string;
  description?: string;
  score?: number;
  className?: string;
  showTooltip?: boolean;
}

const tierConfig = {
  PRIME: {
    displayName: 'Prime',
    color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    borderColor: 'border-green-300 dark:border-green-700',
    iconColor: 'text-green-600 dark:text-green-400',
  },
  STANDARD: {
    displayName: 'Standard',
    color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    borderColor: 'border-blue-300 dark:border-blue-700',
    iconColor: 'text-blue-600 dark:text-blue-400',
  },
  MONITORED: {
    displayName: 'Monitored',
    color: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
    borderColor: 'border-amber-300 dark:border-amber-700',
    iconColor: 'text-amber-600 dark:text-amber-400',
  },
  HIGH_RISK: {
    displayName: 'High Risk',
    color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    borderColor: 'border-red-300 dark:border-red-700',
    iconColor: 'text-red-600 dark:text-red-400',
  },
};

export function RiskTierBadge({
  tier,
  displayName,
  description,
  score,
  className = '',
  showTooltip = true,
}: RiskTierBadgeProps) {
  const config = tierConfig[tier];
  const tierDisplayName = displayName || config.displayName;

  const badge = (
    <Badge
      className={`${config.color} ${config.borderColor} border px-3 py-1 font-semibold ${className}`}
    >
      <span className="flex items-center gap-2">
        {tierDisplayName}
        {score !== undefined && (
          <span className="text-xs font-normal opacity-75">({score})</span>
        )}
        {showTooltip && description && (
          <Tooltip content={description}>
            <Info className={`h-3 w-3 ${config.iconColor} cursor-help`} />
          </Tooltip>
        )}
      </span>
    </Badge>
  );

  return badge;
}

