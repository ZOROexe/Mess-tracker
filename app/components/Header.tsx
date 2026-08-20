"use client";

import Link from "next/link";
import { Button } from "@/components/ui/Button";

interface Action {
  label: string;
  href: string;
  variant?: "primary" | "secondary" | "subtle" | "ghost";
}

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: Action[];
  rightElement?: React.ReactNode;
}

export default function PageHeader({
  title,
  subtitle,
  actions = [],
  rightElement,
}: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pb-2 border-b border-white/[0.04] mb-6">
      {/* Title & Subtitle */}
      <div className="space-y-1">
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#F5F7F8]">
          {title}
        </h1>
        {subtitle && (
          <p className="text-xs sm:text-sm text-[#9AA3AD]">
            {subtitle}
          </p>
        )}
      </div>

      {/* Actions / Right Element */}
      <div className="flex flex-wrap items-center gap-2.5 sm:justify-end">
        {actions.map((action) => (
          <Link key={action.href} href={action.href}>
            <Button
              variant={action.variant || "subtle"}
              size="sm"
            >
              {action.label}
            </Button>
          </Link>
        ))}
        {rightElement}
      </div>
    </div>
  );
}