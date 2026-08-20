"use client";

import React, { forwardRef } from "react";

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  {
    className = "",
    label,
    error,
    helperText,
    id,
    disabled,
    children,
    ...props
  },
  ref
) {
  const generatedId = React.useId();
  const selectId = id || (label ? generatedId : undefined);

  return (
    <div className="w-full space-y-1.5">
      {label && (
        <label
          htmlFor={selectId}
          className="block text-xs font-medium uppercase tracking-wider text-[#9AA3AD]"
        >
          {label}
        </label>
      )}
      <div className="relative flex items-center">
        <select
          ref={ref}
          id={selectId}
          disabled={disabled}
          className={`w-full appearance-none rounded-lg bg-[#171C21] border text-sm text-[#F5F7F8] transition-all duration-150 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed pl-3.5 pr-10 py-2.5 ${
            error
              ? "border-[#F87171] focus:ring-1 focus:ring-[#F87171]"
              : "border-white/10 focus:border-[#2DD4BF] focus:ring-1 focus:ring-[#2DD4BF]/40"
          } ${className}`}
          {...props}
        >
          {children}
        </select>
        <div className="pointer-events-none absolute right-3 flex items-center text-[#9AA3AD]">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
      {error && <p className="text-xs text-[#F87171]">{error}</p>}
      {helperText && !error && (
        <p className="text-xs text-[#68717C]">{helperText}</p>
      )}
    </div>
  );
});

Select.displayName = "Select";
