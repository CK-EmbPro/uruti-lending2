'use client';

import { forwardRef } from 'react';
import CurrencyInputField from 'react-currency-input-field';
import { Input } from './Input';

interface CurrencyInputProps {
  value?: number;
  onChange: (value: number | undefined) => void;
  placeholder?: string;
  disabled?: boolean;
  prefix?: string;
  decimalsLimit?: number;
  className?: string;
}

export const CurrencyInput = forwardRef<HTMLInputElement, CurrencyInputProps>(
  (
    {
      value,
      onChange,
      placeholder = '$0.00',
      disabled,
      prefix = '$',
      decimalsLimit = 2,
      className,
    },
    ref,
  ) => {
    return (
      <CurrencyInputField
        id="currency-input"
        name="currency-input"
        value={value}
        onValueChange={(value) => onChange(value ? parseFloat(value) : undefined)}
        placeholder={placeholder}
        prefix={prefix}
        decimalsLimit={decimalsLimit}
        disabled={disabled}
        className={`
          w-full px-3 py-2 border border-gray-300 rounded-md
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
          ${disabled ? 'bg-gray-100 cursor-not-allowed' : ''}
          ${className || ''}
        `}
      />
    );
  },
);

CurrencyInput.displayName = 'CurrencyInput';

