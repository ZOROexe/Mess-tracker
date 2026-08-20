"use client";

import React, { forwardRef } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin, { DateClickArg } from "@fullcalendar/interaction";
import { DatesSetArg, EventClickArg } from "@fullcalendar/core";
import { CalendarEventContent } from "./CalendarEvent";

export interface FormattedCalendarEvent {
  title: string;
  start: string;
  allDay: boolean;
  backgroundColor: string;
  borderColor: string;
}

export interface FoodCalendarProps {
  events: FormattedCalendarEvent[];
  onDatesSet: (info: DatesSetArg) => void;
  onDateClick: (info: DateClickArg) => void;
  onEventClick: (info: EventClickArg) => void;
}

export const FoodCalendar = forwardRef<FullCalendar, FoodCalendarProps>(function FoodCalendar(
  { events, onDatesSet, onDateClick, onEventClick },
  ref
) {
  return (
    <div className="w-full select-none">
      <FullCalendar
        ref={ref}
        plugins={[dayGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        events={events}
        validRange={() => ({
          start: "2000-01-01",
        })}
        datesSet={onDatesSet}
        dateClick={onDateClick}
        eventClick={onEventClick}
        eventContent={(arg) => <CalendarEventContent arg={arg} />}
        height="auto"
        headerToolbar={false} /* Toolbar handled externally by CalendarToolbar */
        fixedWeekCount={false}
      />
    </div>
  );
});

FoodCalendar.displayName = "FoodCalendar";
