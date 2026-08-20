"use client";

import { useRef, useState, useMemo } from "react";
import FullCalendar from "@fullcalendar/react";
import { useSession } from "next-auth/react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { FetchMonthlyFood } from "@/lib/api";
import {
  FoodCalendar,
  CalendarToolbar,
  CalendarSummary,
  CalendarLegend,
} from "@/components/calendar";
import DayEntryModal from "./components/DayEntryModal";
import LoginModal from "./components/LoginModal";
import { CalendarGridSkeleton, SummarySkeleton, DayEntryModalSkeleton } from "./components/Skeletons";

interface CalendarEvent {
  date: string;
  totalCost: number;
  hasMess: boolean;
  hasOutside: boolean;
}

export default function CalendarPage() {
  const calendarRef = useRef<FullCalendar | null>(null);
  const [month, setMonth] = useState<string | null>(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });
  const [currentMonthTitle, setCurrentMonthTitle] = useState<string>(() => {
    const now = new Date();
    return now.toLocaleString("default", { month: "long", year: "numeric" });
  });

  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const [dateSelected, setDateSelected] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoginModalOpen, setLoginModalOpen] = useState(false);

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ["month-entry", month],
    queryFn: () => FetchMonthlyFood(month!),
    enabled: !!month,
    initialData: () => {
      return queryClient.getQueryData(["month-entry", month]);
    },
    staleTime: 600000, // 1 min
  });

  const events: CalendarEvent[] = data?.entries ?? [];
  const summary = data?.summary ?? {
    messTotal: 0,
    outsideTotal: 0,
    grandTotal: 0,
  };

  const formattedEvents = useMemo(() => {
    return events.map((e) => {
      let bgColor = "#2DD4BF"; // Teal for Mess only

      if (e.hasOutside && e.hasMess) {
        bgColor = "#F59E0B"; // Amber for Mixed
      } else if (e.hasOutside) {
        bgColor = "#F87171"; // Coral for Outside only
      }

      console.log(`Event for ${e.date} and title ₹${e.totalCost}: totalCost=${e.totalCost}, hasMess=${e.hasMess}, hasOutside=${e.hasOutside}, bgColor=${bgColor}`);

      return {
        title: `₹${e.totalCost}`,
        start: e.date,
        allDay: true,
        backgroundColor: bgColor,
        borderColor: bgColor,
      };
    });
  }, [events]);

  const handlePrevMonth = () => {
    const calendarApi = calendarRef.current?.getApi();
    if (calendarApi) {
      calendarApi.prev();
    }
  };

  const handleNextMonth = () => {
    const calendarApi = calendarRef.current?.getApi();
    if (calendarApi) {
      calendarApi.next();
    }
  };

  const handleToday = () => {
    const calendarApi = calendarRef.current?.getApi();
    if (calendarApi) {
      calendarApi.today();
    }
  };

  const handleLogMeal = () => {
    const todayStr = new Date().toISOString().slice(0, 10);
    if (!session) {
      setDateSelected(todayStr);
      setLoginModalOpen(true);
    } else {
      setDateSelected(todayStr);
      setIsModalOpen(true);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Calendar Toolbar */}
      <CalendarToolbar
        currentMonthTitle={currentMonthTitle}
        onPrevMonth={handlePrevMonth}
        onNextMonth={handleNextMonth}
        onToday={handleToday}
        onLogMeal={handleLogMeal}
        totalSpent={summary.grandTotal}
      />

      {/* Login Modal for unauthenticated day click */}
      {isLoginModalOpen && dateSelected && (
        <LoginModal
          onPress={() => setLoginModalOpen(false)}
          onClose={() => setLoginModalOpen(false)}
        />
      )}

      {/* Day Entry Modal for authenticated day click */}
      {isModalOpen && dateSelected && (
        isLoading ? (
          <DayEntryModalSkeleton />
        ) : (
          <DayEntryModal
            date={dateSelected}
            onClose={() => setIsModalOpen(false)}
            onSave={() => {
              setIsModalOpen(false);
              setMonth((prev) => prev);
            }}
            month={month}
          />
        )
      )}

      {/* Monthly Summary */}
      {isFetching && !data ? (
        <SummarySkeleton />
      ) : (
        <CalendarSummary summary={summary} />
      )}

      {/* Persistent Calendar Grid Container */}
      <div className="relative w-full rounded-2xl bg-[#12161A] border border-white/[0.08] overflow-hidden p-2 sm:p-4 min-h-[500px]">
        <FoodCalendar
          ref={calendarRef}
          events={formattedEvents}
          onDatesSet={(info) => {
            const start = info.view.currentStart;
            const newMonth = `${start.getFullYear()}-${String(
              start.getMonth() + 1
            ).padStart(2, "0")}`;

            setMonth((prev) => (prev === newMonth ? prev : newMonth));
            setCurrentMonthTitle(
              start.toLocaleString("default", { month: "long", year: "numeric" })
            );
          }}
          onDateClick={(info) => {
            if (!session) {
              setDateSelected(info.dateStr);
              setLoginModalOpen(true);
            } else {
              setDateSelected(info.dateStr);
              setIsModalOpen(true);
            }
          }}
          onEventClick={(info) => {
            info.jsEvent.preventDefault();
            info.jsEvent.stopPropagation();

            const date = info.event.startStr.slice(0, 10);
            setDateSelected(date);
            if (!session) {
              setLoginModalOpen(true);
            } else {
              setIsModalOpen(true);
            }
          }}
        />

        {/* Non-destructive loading overlay when fetching month data */}
        {isFetching && (
          <div className="absolute inset-0 z-10 bg-[#12161A]/85 backdrop-blur-[2px] p-2 sm:p-4 pointer-events-none animate-scaleIn flex flex-col justify-between">
            <CalendarGridSkeleton />
          </div>
        )}
      </div>

      {/* Semantic Legend */}
      <CalendarLegend />
    </div>
  );
}
