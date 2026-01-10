'use client';

import { forwardRef } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { Input } from './Input';
import { Calendar } from 'lucide-react';

interface CustomDatePickerProps {
  value?: Date | null;
  onChange: (date: Date | null) => void;
  placeholder?: string;
  minDate?: Date;
  maxDate?: Date;
  disabled?: boolean;
  className?: string;
}

export const CustomDatePicker = forwardRef<HTMLInputElement, CustomDatePickerProps>(
  ({ value, onChange, placeholder, minDate, maxDate, disabled, className }, ref) => {
    return (
      <div className="relative">
        <DatePicker
          selected={value}
          onChange={onChange}
          minDate={minDate}
          maxDate={maxDate}
          disabled={disabled}
          placeholderText={placeholder}
          dateFormat="yyyy-MM-dd"
          className={`
            w-full px-3 py-2 border border-gray-300 rounded-md
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
            ${disabled ? 'bg-gray-100 cursor-not-allowed' : ''}
            ${className || ''}
          `}
          customInput={<Input ref={ref} />}
        />
        <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
      </div>
    );
  },
);

CustomDatePicker.displayName = 'CustomDatePicker';

