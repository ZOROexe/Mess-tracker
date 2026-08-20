"use client";

import React, { forwardRef } from "react";

export type IconButtonVariant = "ghost" | "subtle" | "outline" | "primary" | "secondary";
export type IconButtonSize = "xs" | "sm" | "md" | "lg";

export interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: IconButtonVariant;
  size?: IconButtonSize;
  rounded?: "full" | "lg" | "md";
  label: string; // Accessible label for screen readers
}

const variantStyles: Record<IconButtonVariant, string> = {
  ghost: "bg-transparent text-[#9AA3AD] hover:text-[#F5F7F8] hover:bg-white/5 active:bg-white/10 focus-visible:ring-white/20",
  subtle: "bg-[#171C21] text-[#9AA3AD] border border-white/10 hover:text-[#F5F7F8] hover:bg-white/10 active:bg-white/15 focus-visible:ring-white/20",
  outline: "bg-transparent text-[#9AA3AD] border border-white/10 hover:text-[#F5F7F8] hover:bg-white/5 active:bg-white/10 focus-visible:ring-white/20",
  primary: "bg-[#2DD4BF] text-[#0B0D0F] hover:bg-[#2DD4BF]/90 active:bg-[#25b5a3] focus-visible:ring-[#2DD4BF]/50",
  secondary: "bg-transparent text-[#2DD4BF] border border-white/10 hover:bg-white/5 active:bg-white/10 focus-visible:ring-[#2DD4BF]/50",
};

const sizeStyles: Record<IconButtonSize, string> = {
  xs: "w-6 h-6 text-xs",
  sm: "w-8 h-8 text-sm",
  md: "w-9 h-9 text-base",
  lg: "w-10 h-10 text-lg",
};

const roundedStyles = {
  full: "rounded-full",
  lg: "rounded-lg",
  md: "rounded-md",
};

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  {
    className = "",
    variant = "ghost",
    size = "md",
    rounded = "lg",
    label,
    children,
    disabled,
    ...props
  },
  ref
) {
  return (
    <button
      ref={ref}
      aria-label={label}
      title={label}
      disabled={disabled}
      className={`inline-flex items-center justify-center transition-all duration-150 select-none cursor-pointer disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 ${variantStyles[variant]} ${sizeStyles[size]} ${roundedStyles[rounded]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
});

IconButton.displayName = "IconButton";
