"use client";

import React from "react";
import { IconButton } from "@/components/ui/IconButton";

export function StatCard({
  label,
  value,
  dotColor,
  subtitle,
}: {
  label: string;
  value: string;
  dotColor?: string;
  subtitle?: string;
}) {
  return (
    <div className="rounded-xl bg-[#12161A] border border-white/[0.08] p-4 flex flex-col justify-between">
      <div className="flex items-center gap-1.5 mb-1.5">
        {dotColor && (
          <span
            className="w-1.5 h-1.5 rounded-full shrink-0"
            style={{ backgroundColor: dotColor }}
          />
        )}
        <p className="text-[11px] font-medium uppercase tracking-wider text-[#9AA3AD]">
          {label}
        </p>
      </div>
      <p className="text-xl sm:text-2xl font-bold text-[#F5F7F8] tabular-nums tracking-tight">
        {value}
      </p>
      {subtitle && (
        <p className="text-[11px] text-[#68717C] mt-1">{subtitle}</p>
      )}
    </div>
  );
}

export function ChartCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl bg-[#12161A] border border-white/[0.08] p-5 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-[#F5F7F8] tracking-tight">
            {title}
          </h3>
          {subtitle && (
            <p className="text-xs text-[#9AA3AD] mt-0.5">{subtitle}</p>
          )}
        </div>
      </div>
      <div className="w-full">{children}</div>
    </div>
  );
}

export function MonthSwitcher({
  labelMonth,
  date,
  onChange,
}: {
  labelMonth: string;
  date: Date;
  onChange: (d: Date) => void;
}) {
  return (
    <div className="flex items-center justify-between sm:justify-end gap-2 bg-[#12161A] p-1 rounded-lg border border-white/[0.08] select-none">
      <IconButton
        size="sm"
        variant="ghost"
        label="Previous Month"
        onClick={() => onChange(new Date(date.getFullYear(), date.getMonth() - 1))}
        className="text-[#9AA3AD] hover:text-[#F5F7F8]"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
        </svg>
      </IconButton>

      <span className="text-xs font-semibold text-[#F5F7F8] min-w-[130px] text-center tabular-nums">
        {labelMonth}
      </span>

      <IconButton
        size="sm"
        variant="ghost"
        label="Next Month"
        onClick={() => onChange(new Date(date.getFullYear(), date.getMonth() + 1))}
        className="text-[#9AA3AD] hover:text-[#F5F7F8]"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
        </svg>
      </IconButton>
    </div>
  );
}

export function EmptyChartState({ message }: { message: string }) {
  return (
    <div className="h-56 flex flex-col items-center justify-center text-xs text-[#68717C] gap-2 rounded-lg bg-[#0B0D0F]/40 border border-white/[0.04]">
      <svg className="w-6 h-6 text-[#68717C]/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
      <span>{message}</span>
    </div>
  );
}