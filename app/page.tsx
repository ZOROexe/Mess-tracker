"use client";
import Link from "next/link";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import MonthlySummary from "./components/MonthlySummary";
import DayEntryModal from "./components/DayEntryModal";
import LoginModal from "./components/LoginModal";
import { CalendarGridSkeleton, SummarySkeleton, DayEntryModalSkeleton } from "./components/Skeletons";
import AuthButton from "./components/authButton";
import { useSession } from "next-auth/react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { FetchMonthlyFood } from "@/lib/api";
import { useRef, useState, useMemo } from "react";

interface CalendarEvent {
  date: string;
  totalCost: number;
  hasMess: boolean;
  hasOutside: boolean;
}

export default function CalendarPage() {
  const [month, setMonth] = useState<string | null>(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const queryClient = useQueryClient();

  const { data: session } = useSession();
  const [dateSelected, setDateSelected] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoginModalOpen, setLoginModalOpen] = useState(false);

  const { data, isLoading, isFetching, error } = useQuery({
    queryKey: ["month-entry", month],
    queryFn: () => FetchMonthlyFood(month!),
    enabled: !!month,
    initialData: () => {
      return queryClient.getQueryData(["month-entry", month])
    },
    staleTime: 600000 //1 min
  })

  const events: CalendarEvent[] = data?.entries ?? [];
  const summary = data?.summary ?? {
    messTotal: 0,
    outsideTotal: 0,
    grandTotal: 0
  };

  const formattedEvents = useMemo(() => {
    return events.map((e) => {
    let bgColor = "#22c55e"; // green

    if (e.hasOutside && e.hasMess) bgColor = "#f59e0b"; // orange
    else if (e.hasOutside) bgColor = "#ef4444"; // red

    return {
      title: `₹${e.totalCost}`,
      start: e.date,
      allDay: true,
      backgroundColor: bgColor,
      borderColor: bgColor
    };
  });
  }, [events]);

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Title */}
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">
            Mess Price Tracker
          </h1>
          <p className="text-sm text-gray-400">
            Track daily meals & monthly spend
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap items-center gap-3 sm:justify-end">
          <Link
            href="/settings/mess-pricing"
            className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm hover:bg-white/10 transition"
          >
            Mess Pricing
          </Link>

          {session && (
            <span className="text-sm text-gray-400 max-w-[170px] truncate">
              {session.user?.email}
            </span>
          )}

          <AuthButton />
        </div>
      </div>
      {
        isLoginModalOpen && dateSelected && <LoginModal onPress={() => setLoginModalOpen(false) } onClose={() => setLoginModalOpen(false)} />
      }
      {isModalOpen && dateSelected && (
        isLoading ? <DayEntryModalSkeleton/> :
        <DayEntryModal
          date={dateSelected}
          onClose={() => setIsModalOpen(false)}
          onSave={() => {
            setIsModalOpen(false);
            setMonth((prev) => prev);
          }}
          month = {month}
        />
      )}
      <div className="">
        {isFetching ? <SummarySkeleton/> : <MonthlySummary summary={summary} />}
        
      </div>
      <div className="rounded-2xl bg-white/5 backdrop-blur-md p-4 border border-white/10">
          <FullCalendar
            plugins={[dayGridPlugin, interactionPlugin]}
            initialView="dayGridMonth"
            events={formattedEvents}
            validRange={() => ({
              start: "2000-01-01"
            })}
            datesSet={(info) => {
              const start = info.view.currentStart;
              const newMonth = `${start.getFullYear()}-${String(
                start.getMonth() + 1
              ).padStart(2, "0")}`;

              setMonth(newMonth);
            }}
            dateClick={(info) => {
              if (!session) {
                setLoginModalOpen(true);
                setDateSelected(info.dateStr);
              } else {
                console.log("Clicked date:", info.dateStr);
                setDateSelected(info.dateStr);
                setIsModalOpen(true);
              }
            }}
            eventClick={(info) => {
              info.jsEvent.preventDefault();
              info.jsEvent.stopPropagation();

              const date = info.event.startStr.slice(0, 10);
              setDateSelected(date);
              setIsModalOpen(true);
            }}
            height="auto"
        />
        {isFetching && (
          <div className="absolute inset-0 z-50 rounded-2xl bg-black/30 backdrop-blur-sm">
            <CalendarGridSkeleton />
          </div>
        )}
      </div>
    </div>
  );
}