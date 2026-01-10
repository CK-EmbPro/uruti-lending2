'use client';

import PhoneInputWithCountry from 'react-phone-number-input';
import 'react-phone-number-input/style.css';
import { Input } from './Input';

interface PhoneInputProps {
  value?: string;
  onChange: (value: string | undefined) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export function PhoneInput({
  value,
  onChange,
  placeholder = 'Enter phone number',
  disabled,
  className,
}: PhoneInputProps) {
  return (
    <PhoneInputWithCountry
      international
      defaultCountry="US"
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      disabled={disabled}
      className={className}
      inputComponent={Input}
    />
  );
}

