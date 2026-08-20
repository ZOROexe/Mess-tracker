"use client";

import React, { forwardRef } from "react";

export type ButtonVariant = "primary" | "secondary" | "destructive" | "ghost" | "subtle" | "outline";
export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary: "bg-[#2DD4BF] text-[#0B0D0F] font-semibold hover:bg-[#2DD4BF]/90 active:bg-[#25b5a3] focus-visible:ring-[#2DD4BF]/50",
  secondary: "bg-transparent text-[#2DD4BF] border border-white/10 hover:bg-white/5 active:bg-white/10 focus-visible:ring-[#2DD4BF]/50",
  destructive: "bg-transparent text-[#F87171] border border-[#F87171]/20 hover:bg-[#F87171]/10 active:bg-[#F87171]/20 focus-visible:ring-[#F87171]/50",
  ghost: "bg-transparent text-[#9AA3AD] hover:text-[#F5F7F8] hover:bg-white/5 active:bg-white/10 focus-visible:ring-white/20",
  subtle: "bg-[#171C21] text-[#F5F7F8] border border-white/10 hover:bg-white/10 active:bg-white/15 focus-visible:ring-white/20",
  outline: "bg-transparent text-[#F5F7F8] border border-white/10 hover:bg-white/5 active:bg-white/10 focus-visible:ring-white/20",
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: "h-8 px-3 text-xs gap-1.5 rounded-lg",
  md: "h-9.5 px-4 py-2 text-sm gap-2 rounded-lg",
  lg: "h-11 px-5 py-2.5 text-base gap-2.5 rounded-xl",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    className = "",
    variant = "primary",
    size = "md",
    isLoading = false,
    leftIcon,
    rightIcon,
    children,
    disabled,
    ...props
  },
  ref
) {
  const baseStyles =
    "inline-flex items-center justify-center font-medium transition-all duration-150 select-none cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2";
  
  return (
    <button
      ref={ref}
      disabled={disabled || isLoading}
      className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
      {...props}
    >
      {isLoading ? (
        <svg className="animate-spin h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      ) : (
        leftIcon
      )}
      <span>{children}</span>
      {!isLoading && rightIcon}
    </button>
  );
});

Button.displayName = "Button";
