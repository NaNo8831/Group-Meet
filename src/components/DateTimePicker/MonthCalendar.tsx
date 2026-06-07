import {
  addDays,
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  format,
  isAfter,
  isBefore,
  isSameDay,
  startOfDay,
  startOfMonth,
  subMonths
} from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useMemo, useState } from "react";

interface MonthCalendarProps {
  selectedDates: string[];
  onToggleDate: (date: string) => void;
}

const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function MonthCalendar({ selectedDates, onToggleDate }: MonthCalendarProps) {
  const today = startOfDay(new Date());
  const maxDate = addDays(today, 28);
  const [visibleMonth, setVisibleMonth] = useState(startOfMonth(today));

  const days = useMemo(() => {
    const monthStart = startOfMonth(visibleMonth);
    const monthEnd = endOfMonth(visibleMonth);
    const leadingBlanks = Array.from({ length: monthStart.getDay() }, (_, index) => `blank-${index}`);
    const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd });

    return { leadingBlanks, monthDays };
  }, [visibleMonth]);

  return (
    <div className="rounded-md border bg-white p-4">
      <div className="mb-4 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => setVisibleMonth((current) => subMonths(current, 1))}
          className="inline-flex h-9 w-9 items-center justify-center rounded-md border transition hover:bg-muted"
          aria-label="Previous month"
          title="Previous month"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
        </button>
        <h3 className="text-sm font-semibold">{format(visibleMonth, "MMMM yyyy")}</h3>
        <button
          type="button"
          onClick={() => setVisibleMonth((current) => addMonths(current, 1))}
          className="inline-flex h-9 w-9 items-center justify-center rounded-md border transition hover:bg-muted"
          aria-label="Next month"
          title="Next month"
        >
          <ChevronRight className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium text-muted-foreground">
        {weekDays.map((day) => (
          <div key={day} className="py-1">
            {day}
          </div>
        ))}
      </div>

      <div className="mt-1 grid grid-cols-7 gap-1">
        {days.leadingBlanks.map((blank) => (
          <div key={blank} className="aspect-square" />
        ))}

        {days.monthDays.map((day) => {
          const dateValue = format(day, "yyyy-MM-dd");
          const disabled = isBefore(day, today) || isAfter(day, maxDate);
          const selected = selectedDates.includes(dateValue);
          const isToday = isSameDay(day, today);

          return (
            <button
              key={dateValue}
              type="button"
              onClick={() => onToggleDate(dateValue)}
              disabled={disabled}
              className={`aspect-square rounded-md text-sm transition focus:outline-none focus:ring-2 focus:ring-ring ${
                selected
                  ? "bg-primary font-semibold text-primary-foreground"
                  : "text-foreground hover:bg-muted"
              } ${isToday && !selected ? "ring-1 ring-primary/45" : ""} ${
                disabled ? "cursor-not-allowed text-muted-foreground/35 hover:bg-transparent" : ""
              }`}
            >
              {format(day, "d")}
            </button>
          );
        })}
      </div>
    </div>
  );
}
