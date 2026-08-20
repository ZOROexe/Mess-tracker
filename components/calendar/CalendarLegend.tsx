"use client";

import React from "react";

export function CalendarLegend() {
  return (
    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 pt-3 text-xs text-[#9AA3AD] select-none">
      <div className="flex items-center gap-1.5">
        <span className="w-2 h-2 rounded-full bg-[#2DD4BF]" />
        <span>Mess</span>
      </div>
      <div className="flex items-center gap-1.5">
        <span className="w-2 h-2 rounded-full bg-[#F87171]" />
        <span>Outside</span>
      </div>
      <div className="flex items-center gap-1.5">
        <span className="w-2 h-2 rounded-full bg-[#F59E0B]" />
        <span>Mixed</span>
      </div>
      <div className="flex items-center gap-1.5">
        <span className="w-2 h-2 rounded-sm border border-[#2DD4BF]/60 bg-[#171C21]" />
        <span>Today</span>
      </div>
    </div>
  );
}
