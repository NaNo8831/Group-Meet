import { formatInTimeZone } from "date-fns-tz";

// Pure slot rules for a client's proposed times (Decision 066).
// No database, Next.js, or app imports: this file can be run on its own.
// Times are judged in the business time zone passed in, so daylight saving is handled by
// the time zone database and never by a fixed offset.

export const MAX_SLOTS = 30;
export const MIN_DAYS_AHEAD = 2; // two full calendar days, counted from midnight in the business time zone
export const MAX_DAYS_AHEAD = 29;
export const GRID_MINUTES = 15;
export const EARLIEST_MINUTE_OF_DAY = 7 * 60; // 07:00
export const LATEST_MINUTE_OF_DAY = 21 * 60; // 21:00, on the hour only
export const BUFFER_MINUTES = 15;

export type SlotCheck = { ok: true } | { ok: false; message: string };

export interface ValidateSlotsInput {
  /** ISO date-time strings for each proposed start. */
  startsAt: string[];
  /** Length of the chosen duration option, in minutes. */
  minutes: number;
  /** The current moment (passed in so results do not depend on the clock). */
  now: Date;
  /** The business time zone, for example US/Eastern or America/New_York. */
  timeZone: string;
}

function fail(message: string): SlotCheck {
  return { ok: false, message };
}

/**
 * The first calendar date (yyyy-MM-dd, in the business time zone) a client may request:
 * today plus MIN_DAYS_AHEAD days, counted from midnight. Plain calendar arithmetic, so
 * daylight saving never shifts it.
 */
export function earliestRequestDate(now: Date, timeZone: string): string {
  const [year, month, day] = formatInTimeZone(now, timeZone, "yyyy-MM-dd").split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day + MIN_DAYS_AHEAD)).toISOString().slice(0, 10);
}

function formatDateLabel(isoDate: string): string {
  return new Date(`${isoDate}T12:00:00Z`).toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
    timeZone: "UTC"
  });
}

function formatClock(totalMinutes: number): string {
  const hours24 = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  const suffix = hours24 >= 12 ? "PM" : "AM";
  const hours12 = hours24 % 12 === 0 ? 12 : hours24 % 12;
  return `${hours12}:${String(minutes).padStart(2, "0")} ${suffix}`;
}

export function validateSlots({ startsAt, minutes, now, timeZone }: ValidateSlotsInput): SlotCheck {
  if (startsAt.length < 1) {
    return fail("Add at least one time.");
  }
  if (startsAt.length > MAX_SLOTS) {
    return fail(`Choose no more than ${MAX_SLOTS} times.`);
  }

  const earliestDate = earliestRequestDate(now, timeZone);
  const latest = now.getTime() + MAX_DAYS_AHEAD * 24 * 60 * 60 * 1000;
  const starts: number[] = [];

  for (const value of startsAt) {
    const date = new Date(value);
    const time = date.getTime();

    if (Number.isNaN(time)) {
      return fail("One of the times is not a valid date and time.");
    }
    if (formatInTimeZone(date, timeZone, "yyyy-MM-dd") < earliestDate) {
      return fail(
        `Meetings can only be requested from ${formatDateLabel(earliestDate)} onward (${MIN_DAYS_AHEAD} full days ahead). Choose a later date.`
      );
    }
    if (time > latest) {
      return fail(`Choose times within the next ${MAX_DAYS_AHEAD} days.`);
    }
    if (date.getUTCSeconds() !== 0 || date.getUTCMilliseconds() !== 0) {
      return fail(`Times must start on a ${GRID_MINUTES}-minute mark.`);
    }

    const [hourText, minuteText] = formatInTimeZone(date, timeZone, "HH:mm").split(":");
    const minuteOfDay = Number(hourText) * 60 + Number(minuteText);

    if (minuteOfDay % GRID_MINUTES !== 0) {
      return fail(`Times must start on a ${GRID_MINUTES}-minute mark.`);
    }
    if (minuteOfDay < EARLIEST_MINUTE_OF_DAY || minuteOfDay > LATEST_MINUTE_OF_DAY) {
      return fail(
        `Times must start between ${formatClock(EARLIEST_MINUTE_OF_DAY)} and ${formatClock(LATEST_MINUTE_OF_DAY)}.`
      );
    }

    starts.push(time);
  }

  starts.sort((a, b) => a - b);
  const minimumGap = (minutes + BUFFER_MINUTES) * 60 * 1000;

  for (let index = 1; index < starts.length; index += 1) {
    const gap = starts[index] - starts[index - 1];
    if (gap === 0) {
      return fail("Each time can only be added once.");
    }
    if (gap < minimumGap) {
      return fail(`Times need to be at least ${minutes + BUFFER_MINUTES} minutes apart for a ${minutes}-minute meeting.`);
    }
  }

  return { ok: true };
}
