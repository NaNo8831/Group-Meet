import { addMinutes, format } from "date-fns";
import { fromZonedTime } from "date-fns-tz";

export type MeetingType = "in_depth" | "short_form";
export type Duration = 45 | 75;

export interface TimeSlot {
  date: string;
  startTime: string;
}

export interface ApiSlot {
  startsAt: string;
  endsAt: string;
}

export const MEETING_DURATIONS: Record<MeetingType, Duration> = {
  in_depth: 75,
  short_form: 45
};

export const BUSINESS_TIMEZONE = "America/New_York";
export const DEFAULT_START_TIME = "09:00";

export function toApiSlots(slots: TimeSlot[], meetingType: MeetingType): ApiSlot[] {
  const duration = MEETING_DURATIONS[meetingType];

  return slots.map((slot) => {
    const startsAt = fromZonedTime(`${slot.date}T${slot.startTime}:00`, BUSINESS_TIMEZONE);
    const endsAt = addMinutes(startsAt, duration);

    return {
      startsAt: startsAt.toISOString(),
      endsAt: endsAt.toISOString()
    };
  });
}

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
