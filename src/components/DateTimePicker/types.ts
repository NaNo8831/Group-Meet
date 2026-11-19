import { format } from "date-fns";
import { fromZonedTime } from "date-fns-tz";
import { MIN_HOURS_AHEAD } from "@/lib/slot-rules";

// A length the client can choose, defined by an admin on the meeting type.
export interface DurationOption {
  id: string;
  label: string;
  minutes: number;
}

export interface TimeSlot {
  date: string;
  startTime: string;
}

// What the browser sends: start times only. The server works out every end time (Decision 049).
export interface ApiSlot {
  startsAt: string;
}

export const DEFAULT_START_TIME = "09:00";

/** Converts picked dates and times, read in the business time zone, to ISO start times. */
export function toApiSlots(slots: TimeSlot[], timeZone: string): ApiSlot[] {
  return slots.map((slot) => ({
    startsAt: fromZonedTime(`${slot.date}T${slot.startTime}:00`, timeZone).toISOString()
  }));
}

/**
 * True when this date and time, in the business time zone, is less than the minimum notice from now
 * (48 hours; the same rule the server enforces). Covers times already in the past too.
 */
export function isTooSoon(date: string, startTime: string, timeZone: string, now: Date = new Date()): boolean {
  const earliest = now.getTime() + MIN_HOURS_AHEAD * 60 * 60 * 1000;
  return fromZonedTime(`${date}T${startTime}:00`, timeZone).getTime() < earliest;
}

export { MIN_HOURS_AHEAD };

export function formatTimeLabel(value: string) {
  const date = new Date(`2000-01-01T${value}:00`);
  return format(date, "h:mm a");
}

export function getTimeOptions() {
  const options: string[] = [];

  for (let hour = 7; hour <= 21; hour += 1) {
    for (let minute = 0; minute < 60; minute += 15) {
      if (hour === 21 && minute > 0) {
        continue;
      }

      options.push(`${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`);
    }
  }

  return options;
}
