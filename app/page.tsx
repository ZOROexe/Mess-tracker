"use client";
import Link from "next/link";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import MonthlySummary from "./components/MonthlySummary";
import DayEntryModal from "./components/DayEntryModal";
import { CalendarSkeleton } from "./components/Skeletons";
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

  const [dateSelected, setDateSelected] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const isFirstRender = useRef(true);

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
  if (isLoading && !data) {
    return (
      <div className="py-6 space-y-6">
        <h1 className="px-6 text-2xl font-semibold text-white">Mess Food Tracker</h1>
        <CalendarSkeleton />
      </div>
    )
  }
  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between">
        <h1 className="text-2xl font-semibold text-white">Mess Food Tracker</h1>
        <button className="bg-blue-500 px-3 py-2 rounded-2xl">
          <Link href='/settings/mess-pricing'>Mess Pricing</Link>
        </button>
      </div>
      {isModalOpen && dateSelected && (
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
      <MonthlySummary summary={summary} />
      <FullCalendar
        plugins={[dayGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        initialDate={new Date()}
        events={formattedEvents}
        validRange={() => ({
          start: "2000-01-01"
        })}
        datesSet={(info) => {
          // Use the view's active start date (the actual month being viewed)
          // not currentStart (which includes previous month's days)
          const viewDate = info.view.calendar.getDate();
          const newMonth = `${viewDate.getFullYear()}-${String(viewDate.getMonth() + 1).padStart(2, '0')}`;
          
          console.log("datesSet triggered - viewDate:", viewDate, "newMonth:", newMonth);
          
          // Prevent double-trigger on mount (StrictMode)
          if (isFirstRender.current) {
            isFirstRender.current = false;
            return;
          }
          
          setMonth((prev) => (prev === newMonth ? prev : newMonth));
        }}
        dateClick={(info) => {
          console.log("Clicked date:", info.dateStr);
          setDateSelected(info.dateStr);
          setIsModalOpen(true);
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
    </div>
  );
}