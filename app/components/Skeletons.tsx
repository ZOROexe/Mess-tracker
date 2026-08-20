"use client";

import { Skeleton } from "@/components/ui/Skeleton";

export function SummarySkeleton() {
  return (
    <div className="grid grid-cols-3 gap-2 sm:gap-3">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="rounded-xl bg-[#12161A] border border-white/[0.08] p-3 flex flex-col justify-between h-[68px] sm:h-[72px]"
        >
          <Skeleton className="h-3 w-14" />
          <Skeleton className="h-5 w-20" />
        </div>
      ))}
    </div>
  );
}

export function CalendarGridSkeleton() {
  return (
    <div className="w-full h-full flex flex-col space-y-2 select-none">
      {/* Weekday headers matching FullCalendar header: Sunday-first */}
      <div className="grid grid-cols-7 border-b border-white/[0.08] pb-2">
        {["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"].map((day, i) => (
          <div key={i} className="text-center">
            <span className="text-[11px] font-medium text-[#9AA3AD] uppercase tracking-wider">
              {day}
            </span>
          </div>
        ))}
      </div>

      {/* Days grid: 42 cells (6 rows × 7 cols) matching fixedWeekCount=false max */}
      <div className="grid grid-cols-7 gap-[1px] bg-white/[0.06] rounded-lg overflow-hidden border border-white/[0.08] flex-1">
        {Array.from({ length: 42 }).map((_, i) => (
          <div
            key={i}
            className="min-h-[80px] md:min-h-[100px] bg-[#12161A] p-2 flex flex-col justify-between"
          >
            <div className="flex justify-end">
              <Skeleton className="h-3 w-4" />
            </div>
            <div className="flex justify-end">
              {i % 4 === 1 && <Skeleton className="h-3 w-10" />}
              {i % 4 === 2 && <Skeleton className="h-3 w-12" />}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function DayEntryModalSkeleton() {
  return (
    <div className="space-y-6">
      {/* 3 Meals */}
      {[1, 2, 3].map((i) => (
        <div key={i} className="space-y-3">
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-12" />
          </div>
          {/* 3-segment toggle */}
          <div className="grid grid-cols-3 gap-1 bg-[#12161A] p-1 rounded-lg border border-white/[0.06]">
            <Skeleton className="h-7 w-full rounded-md" />
            <Skeleton className="h-7 w-full rounded-md" />
            <Skeleton className="h-7 w-full rounded-md" />
          </div>
          {/* Inputs */}
          <Skeleton className="h-9 w-full rounded-lg" />
          {i < 3 && <div className="pt-2 border-b border-white/[0.04]" />}
        </div>
      ))}

      {/* Footer */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/[0.06]">
        <Skeleton className="h-9 w-20 rounded-lg" />
        <Skeleton className="h-9 w-28 rounded-lg" />
      </div>
    </div>
  );
}

export function MessPricingSkeleton() {
  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-7 w-44" />
        <Skeleton className="h-8 w-28" />
      </div>

      <div className="space-y-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-10 w-full" />
      </div>

      <div className="rounded-xl bg-[#12161A] border border-white/[0.08] p-5 space-y-4">
        <Skeleton className="h-5 w-32" />
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      </div>
    </div>
  );
}

export function MessListSkeleton() {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <Skeleton className="h-7 w-36" />
          <Skeleton className="h-4 w-56" />
        </div>
        <Skeleton className="h-8 w-24" />
      </div>

      <div className="space-y-3.5">
        {[1, 2].map((i) => (
          <div
            key={i}
            className="rounded-xl bg-[#12161A] border border-white/[0.08] p-5 flex items-center justify-between gap-4"
          >
            <div className="space-y-2 flex-1">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-3.5 w-60" />
              <Skeleton className="h-3.5 w-48" />
            </div>
            <Skeleton className="h-8 w-24 shrink-0" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function MessFormSkeleton() {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="space-y-1">
        <Skeleton className="h-7 w-36" />
        <Skeleton className="h-4 w-52" />
      </div>

      <div className="rounded-xl bg-[#12161A] border border-white/[0.08] p-5 sm:p-6 space-y-5">
        <Skeleton className="h-10 w-full" />
        <div className="grid grid-cols-3 gap-2">
          <Skeleton className="h-9 w-full" />
          <Skeleton className="h-9 w-full" />
          <Skeleton className="h-9 w-full" />
        </div>
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    </div>
  );
}

function ChartSkeleton() {
  return (
    <div className="rounded-xl bg-[#12161A] border border-white/[0.08] p-5 space-y-4">
      <div className="space-y-1">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-3 w-48" />
      </div>
      <div className="h-[240px] flex items-center justify-center">
        <Skeleton className="h-full w-full rounded-lg" />
      </div>
    </div>
  );
}

export function AnalyticsPageSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-9 w-40" />
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="rounded-xl bg-[#12161A] border border-white/[0.08] p-4 space-y-3"
          >
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-6 w-28" />
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <ChartSkeleton />
        <ChartSkeleton />
      </div>

      {/* Spending by mess */}
      <ChartSkeleton />

      {/* Billing summary */}
      <div className="rounded-xl bg-[#12161A] border border-white/[0.08] p-5 space-y-3">
        <Skeleton className="h-5 w-48" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      </div>
    </div>
  );
}