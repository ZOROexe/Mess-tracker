"use client";

import React from "react";
import { IconButton } from "@/components/ui/IconButton";
import { Button } from "@/components/ui/Button";

export interface CalendarToolbarProps {
  currentMonthTitle: string;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onToday: () => void;
  onLogMeal?: () => void;
  totalSpent?: number;
}

export function CalendarToolbar({
  currentMonthTitle,
  onPrevMonth,
  onNextMonth,
  onToday,
  onLogMeal,
  totalSpent,
}: CalendarToolbarProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 py-2 select-none">
      {/* Month Title & Prev/Next Controls */}
      <div className="flex items-center justify-between sm:justify-start gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[#F5F7F8]">
            {currentMonthTitle}
          </h2>
          {totalSpent !== undefined && (
            <p className="text-xs text-[#9AA3AD] mt-0.5 sm:hidden">
              <span className="text-[#2DD4BF] font-semibold tabular-nums">
                ₹{totalSpent.toLocaleString()}
              </span>{" "}
              spent this month
            </p>
          )}
        </div>

        {/* Navigation buttons */}
        <div className="flex items-center gap-1 bg-[#12161A] p-1 rounded-lg border border-white/[0.08]">
          <IconButton
            size="sm"
            variant="ghost"
            label="Previous month"
            onClick={onPrevMonth}
            className="text-[#9AA3AD] hover:text-[#F5F7F8]"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
            </svg>
          </IconButton>

          <button
            onClick={onToday}
            className="px-2.5 py-1 text-xs font-medium text-[#9AA3AD] hover:text-[#F5F7F8] hover:bg-white/[0.04] rounded-md transition-colors"
          >
            Today
          </button>

          <IconButton
            size="sm"
            variant="ghost"
            label="Next month"
            onClick={onNextMonth}
            className="text-[#9AA3AD] hover:text-[#F5F7F8]"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
            </svg>
          </IconButton>
        </div>
      </div>

      {/* Action Button */}
      {onLogMeal && (
        <div className="hidden sm:flex items-center gap-3">
          <Button
            variant="primary"
            size="sm"
            onClick={onLogMeal}
            leftIcon={
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
              </svg>
            }
          >
            Log Meal
          </Button>
        </div>
      )}
    </div>
  );
}
