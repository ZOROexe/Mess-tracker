"use client";

import React from "react";

export type BadgeVariant =
  | "mess"
  | "outside"
  | "mixed"
  | "info"
  | "neutral"
  | "paid"
  | "partially_paid"
  | "unpaid";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  size?: "sm" | "md";
  dot?: boolean;
}

const variantStyles: Record<BadgeVariant, { container: string; dot: string }> = {
  mess: {
    container: "bg-[#2DD4BF]/10 text-[#2DD4BF] border border-[#2DD4BF]/20",
    dot: "bg-[#2DD4BF]",
  },
  outside: {
    container: "bg-[#F87171]/10 text-[#F87171] border border-[#F87171]/20",
    dot: "bg-[#F87171]",
  },
  mixed: {
    container: "bg-[#F59E0B]/10 text-[#F59E0B] border border-[#F59E0B]/20",
    dot: "bg-[#F59E0B]",
  },
  info: {
    container: "bg-[#60A5FA]/10 text-[#60A5FA] border border-[#60A5FA]/20",
    dot: "bg-[#60A5FA]",
  },
  neutral: {
    container: "bg-white/5 text-[#9AA3AD] border border-white/10",
    dot: "bg-[#9AA3AD]",
  },
  paid: {
    container: "bg-[#2DD4BF]/15 text-[#2DD4BF] border border-[#2DD4BF]/30 font-medium",
    dot: "bg-[#2DD4BF]",
  },
  partially_paid: {
    container: "bg-[#F59E0B]/15 text-[#F59E0B] border border-[#F59E0B]/30 font-medium",
    dot: "bg-[#F59E0B]",
  },
  unpaid: {
    container: "bg-[#F87171]/15 text-[#F87171] border border-[#F87171]/30 font-medium",
    dot: "bg-[#F87171]",
  },
};

export function Badge({
  className = "",
  variant = "neutral",
  size = "sm",
  dot = false,
  children,
  ...props
}: BadgeProps) {
  const styles = variantStyles[variant];
  const sizeClass = size === "sm" ? "px-2 py-0.5 text-[11px]" : "px-2.5 py-1 text-xs";

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md uppercase tracking-wider font-medium select-none ${styles.container} ${sizeClass} ${className}`}
      {...props}
    >
      {dot && <span className={`w-1.5 h-1.5 rounded-full ${styles.dot}`} />}
      {children}
    </span>
  );
}
