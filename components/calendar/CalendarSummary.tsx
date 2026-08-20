"use client";

import React from "react";

export interface SummaryData {
  messTotal: number;
  outsideTotal: number;
  grandTotal: number;
}

export interface CalendarSummaryProps {
  summary: SummaryData;
}

export function CalendarSummary({ summary }: CalendarSummaryProps) {
  return (
    <div className="grid grid-cols-3 gap-2 sm:gap-3">
      {/* Mess Total */}
      <div className="rounded-xl bg-[#12161A] border border-white/[0.08] p-3 flex flex-col justify-between h-[68px] sm:h-[72px]">
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-[#2DD4BF] shrink-0" />
          <span className="text-[11px] font-medium uppercase tracking-wider text-[#9AA3AD]">
            Mess
          </span>
        </div>
        <span className="text-sm sm:text-base font-semibold text-[#2DD4BF] tabular-nums">
          ₹{summary.messTotal.toLocaleString()}
        </span>
      </div>

      {/* Outside Total */}
      <div className="rounded-xl bg-[#12161A] border border-white/[0.08] p-3 flex flex-col justify-between h-[68px] sm:h-[72px]">
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-[#F87171] shrink-0" />
          <span className="text-[11px] font-medium uppercase tracking-wider text-[#9AA3AD]">
            Outside
          </span>
        </div>
        <span className="text-sm sm:text-base font-semibold text-[#F87171] tabular-nums">
          ₹{summary.outsideTotal.toLocaleString()}
        </span>
      </div>

      {/* Total Spending */}
      <div className="rounded-xl bg-[#171C21] border border-white/[0.08] p-3 flex flex-col justify-between h-[68px] sm:h-[72px]">
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-[#F5F7F8] shrink-0" />
          <span className="text-[11px] font-medium uppercase tracking-wider text-[#9AA3AD]">
            Total
          </span>
        </div>
        <span className="text-sm sm:text-base font-semibold text-[#F5F7F8] tabular-nums">
          ₹{summary.grandTotal.toLocaleString()}
        </span>
      </div>
    </div>
  );
}
