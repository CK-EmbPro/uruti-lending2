'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Info } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface TooltipProps {
  content: string;
  children?: React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
  className?: string;
}

export function Tooltip({ content, children, position = 'top', className }: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isVisible && tooltipRef.current && triggerRef.current) {
      const tooltip = tooltipRef.current;
      const trigger = triggerRef.current;
      const rect = trigger.getBoundingClientRect();

      // Position tooltip
      switch (position) {
        case 'top':
          tooltip.style.bottom = `${rect.height + 8}px`;
          tooltip.style.left = '50%';
          tooltip.style.transform = 'translateX(-50%)';
          break;
        case 'bottom':
          tooltip.style.top = `${rect.height + 8}px`;
          tooltip.style.left = '50%';
          tooltip.style.transform = 'translateX(-50%)';
          break;
        case 'left':
          tooltip.style.right = `${rect.width + 8}px`;
          tooltip.style.top = '50%';
          tooltip.style.transform = 'translateY(-50%)';
          break;
        case 'right':
          tooltip.style.left = `${rect.width + 8}px`;
          tooltip.style.top = '50%';
          tooltip.style.transform = 'translateY(-50%)';
          break;
      }
    }
  }, [isVisible, position]);

  return (
    <div
      ref={triggerRef}
      className={cn('relative inline-flex items-center', className)}
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
      onFocus={() => setIsVisible(true)}
      onBlur={() => setIsVisible(false)}
    >
      {children || (
        <Info className="h-4 w-4 text-gray-400 hover:text-gray-600 cursor-help" />
      )}
      {isVisible && (
        <div
          ref={tooltipRef}
          className={cn(
            'absolute z-50 px-3 py-2 text-sm text-white bg-gray-900 rounded-lg shadow-lg whitespace-normal max-w-xs',
            'before:absolute before:border-4 before:border-transparent',
            position === 'top' && 'before:top-full before:left-1/2 before:-translate-x-1/2 before:border-t-gray-900',
            position === 'bottom' && 'before:bottom-full before:left-1/2 before:-translate-x-1/2 before:border-b-gray-900',
            position === 'left' && 'before:left-full before:top-1/2 before:-translate-y-1/2 before:border-l-gray-900',
            position === 'right' && 'before:right-full before:top-1/2 before:-translate-y-1/2 before:border-r-gray-900',
          )}
          role="tooltip"
        >
          {content}
        </div>
      )}
    </div>
  );
}

interface FieldWithTooltipProps {
  label: string;
  tooltip: string;
  required?: boolean;
  children: React.ReactNode;
}

export function FieldWithTooltip({ label, tooltip, required, children }: FieldWithTooltipProps) {
  return (
    <div className="space-y-1">
      <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
        <span>{label}</span>
        {required && <span className="text-red-500">*</span>}
        <Tooltip content={tooltip} />
      </label>
      {children}
    </div>
  );
}
