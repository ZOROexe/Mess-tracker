"use client";

import React, { forwardRef } from "react";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "surface" | "elevated" | "outline";
  interactive?: boolean;
}

export const Card = forwardRef<HTMLDivElement, CardProps>(function Card(
  { className = "", variant = "surface", interactive = false, children, ...props },
  ref
) {
  const variantStyles = {
    surface: "bg-[#12161A] border border-white/[0.08]",
    elevated: "bg-[#171C21] border border-white/[0.08]",
    outline: "bg-transparent border border-white/[0.08]",
  };

  const interactiveStyles = interactive
    ? "transition-all duration-150 hover:bg-[#171C21] hover:border-white/[0.15] cursor-pointer"
    : "";

  return (
    <div
      ref={ref}
      className={`rounded-xl text-[#F5F7F8] ${variantStyles[variant]} ${interactiveStyles} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
});

Card.displayName = "Card";

export function CardHeader({
  className = "",
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`p-5 pb-3 flex flex-col gap-1.5 ${className}`} {...props}>
      {children}
    </div>
  );
}

export function CardTitle({
  className = "",
  children,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={`text-base font-semibold text-[#F5F7F8] tracking-tight ${className}`}
      {...props}
    >
      {children}
    </h3>
  );
}

export function CardDescription({
  className = "",
  children,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={`text-xs text-[#9AA3AD] ${className}`} {...props}>
      {children}
    </p>
  );
}

export function CardContent({
  className = "",
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`p-5 pt-0 ${className}`} {...props}>
      {children}
    </div>
  );
}

export function CardFooter({
  className = "",
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`p-5 pt-0 flex items-center gap-3 border-t border-white/[0.04] mt-4 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
