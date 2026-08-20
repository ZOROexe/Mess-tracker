"use client";

import React from "react";
import { EventContentArg } from "@fullcalendar/core";

export interface CalendarEventProps {
  arg: EventContentArg;
}

export function CalendarEventContent({ arg }: CalendarEventProps) {
  const { event } = arg;
  const rawColor = event.backgroundColor;
  
  // Determine text color based on rawColor or semantic state
  let textColorClass = "text-[#2DD4BF]";
  if (rawColor === "#F87171" || rawColor === "#ef4444") {
    textColorClass = "text-[#F87171]";
  } else if (rawColor === "#F59E0B" || rawColor === "#f59e0b") {
    textColorClass = "text-[#F59E0B]";
  }

  return (
    <div className="w-full flex items-center justify-end pr-0.5 sm:pr-1 select-none">
      <span
        className={`text-[11px] sm:text-xs font-semibold tabular-nums tracking-tight ${textColorClass}`}
      >
        {event.title}
      </span>
    </div>
  );
}
