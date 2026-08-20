"use client";

import React, { forwardRef } from "react";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftElement?: React.ReactNode;
  rightElement?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  {
    className = "",
    label,
    error,
    helperText,
    leftElement,
    rightElement,
    id,
    disabled,
    ...props
  },
  ref
) {
  const generatedId = React.useId();
  const inputId = id || (label ? generatedId : undefined);

  return (
    <div className="w-full space-y-1.5">
      {label && (
        <label
          htmlFor={inputId}
          className="block text-xs font-medium uppercase tracking-wider text-[#9AA3AD]"
        >
          {label}
        </label>
      )}
      <div className="relative flex items-center">
        {leftElement && (
          <div className="absolute left-3 flex items-center pointer-events-none text-[#68717C]">
            {leftElement}
          </div>
        )}
        <input
          ref={ref}
          id={inputId}
          disabled={disabled}
          className={`w-full rounded-lg bg-[#171C21] border text-sm text-[#F5F7F8] placeholder-[#68717C] transition-all duration-150 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed ${
            error
              ? "border-[#F87171] focus:ring-1 focus:ring-[#F87171]"
              : "border-white/10 focus:border-[#2DD4BF] focus:ring-1 focus:ring-[#2DD4BF]/40"
          } ${leftElement ? "pl-9" : "px-3.5"} ${
            rightElement ? "pr-9" : "px-3.5"
          } py-2.5 ${className}`}
          {...props}
        />
        {rightElement && (
          <div className="absolute right-3 flex items-center text-[#68717C]">
            {rightElement}
          </div>
        )}
      </div>
      {error && <p className="text-xs text-[#F87171]">{error}</p>}
      {helperText && !error && (
        <p className="text-xs text-[#68717C]">{helperText}</p>
      )}
    </div>
  );
});

Input.displayName = "Input";
