'use client';

import ReactSelect, { StylesConfig, GroupBase } from 'react-select';
import { Option } from '@/lib/types/common';

interface SelectEnhancedProps {
  options: Option[];
  value?: Option | Option[] | null;
  onChange: (value: Option | Option[] | null) => void;
  placeholder?: string;
  isMulti?: boolean;
  isDisabled?: boolean;
  isClearable?: boolean;
  isSearchable?: boolean;
  className?: string;
}

export function SelectEnhanced({
  options,
  value,
  onChange,
  placeholder = 'Select...',
  isMulti = false,
  isDisabled = false,
  isClearable = true,
  isSearchable = true,
  className,
}: SelectEnhancedProps) {
  const customStyles: StylesConfig<Option, boolean, GroupBase<Option>> = {
    control: (provided, state) => ({
      ...provided,
      borderColor: state.isFocused ? '#3b82f6' : '#d1d5db',
      boxShadow: state.isFocused ? '0 0 0 1px #3b82f6' : 'none',
      '&:hover': {
        borderColor: '#3b82f6',
      },
    }),
    option: (provided, state) => ({
      ...provided,
      backgroundColor: state.isSelected
        ? '#3b82f6'
        : state.isFocused
          ? '#eff6ff'
          : 'white',
      color: state.isSelected ? 'white' : '#111827',
    }),
  };

  return (
    <ReactSelect
      options={options}
      value={value}
      onChange={onChange as any}
      placeholder={placeholder}
      isMulti={isMulti}
      isDisabled={isDisabled}
      isClearable={isClearable}
      isSearchable={isSearchable}
      styles={customStyles}
      className={className}
    />
  );
}

