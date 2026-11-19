"use client";

import { format, parseISO } from "date-fns";
import { useEffect, useMemo, useState } from "react";
import { DurationStep } from "./DurationStep";
import { MonthCalendar } from "./MonthCalendar";
import { TimeSlotEditor } from "./TimeSlotEditor";
import {
  DEFAULT_START_TIME,
  MIN_DAYS_AHEAD,
  earliestRequestDate,
  isDateTooSoon,
  toApiSlots,
  type ApiSlot,
  type DurationOption,
  type TimeSlot
} from "./types";

interface DateTimePickerProps {
  /** The lengths the client can choose from, defined on the meeting type. */
  durations: DurationOption[];
  /** The business time zone the times are read in, supplied by the server. */
  timeZone: string;
  onChange: (slots: ApiSlot[], durationId: string | null) => void;
}

const BUFFER_MINUTES = 15;

function toMinutes(value: string) {
  const [hours, minutes] = value.split(":").map(Number);
  return hours * 60 + minutes;
}

/** When the length changes, drop times on the same day that no longer fit with the length plus buffer. */
function pruneConflicts(slots: TimeSlot[], minutes: number): TimeSlot[] {
  const kept: TimeSlot[] = [];
  const ordered = [...slots].sort((a, b) =>
    a.date === b.date ? toMinutes(a.startTime) - toMinutes(b.startTime) : a.date.localeCompare(b.date)
  );

  for (const slot of ordered) {
    const conflicts = kept.some(
      (other) =>
        other.date === slot.date &&
        Math.abs(toMinutes(other.startTime) - toMinutes(slot.startTime)) < minutes + BUFFER_MINUTES
    );
    if (!conflicts) kept.push(slot);
  }

  // Keep the original order so the editor does not jump around.
  return slots.filter((slot) => kept.includes(slot));
}

export function DateTimePicker({ durations, timeZone, onChange }: DateTimePickerProps) {
  const [durationId, setDurationId] = useState<string | null>(durations.length === 1 ? durations[0].id : null);
  const [selectedDates, setSelectedDates] = useState<string[]>([]);
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [notice, setNotice] = useState<string | null>(null);

  const duration = durations.find((option) => option.id === durationId) ?? null;

  const apiSlots = useMemo(() => toApiSlots(slots, timeZone), [slots, timeZone]);

  // The first day a client can pick: two full days ahead, counted from midnight in the business time zone.
  const earliestDate = earliestRequestDate(new Date(), timeZone);
  const earliestLabel = format(parseISO(`${earliestDate}T00:00:00`), "EEEE, MMM d");

  useEffect(() => {
    onChange(apiSlots, durationId);
  }, [apiSlots, durationId, onChange]);

  function chooseDuration(id: string) {
    setDurationId(id);
    const chosen = durations.find((option) => option.id === id);
    if (chosen) setSlots((current) => pruneConflicts(current, chosen.minutes));
  }

  function toggleDate(date: string) {
    setNotice(null);

    if (selectedDates.includes(date)) {
      setSelectedDates((current) => current.filter((selectedDate) => selectedDate !== date));
      setSlots((current) => current.filter((slot) => slot.date !== date));
      return;
    }

    // Days before the earliest allowed day cannot be picked (the calendar greys them out too).
    if (isDateTooSoon(date, timeZone)) {
      setNotice(`Meetings can only be requested from ${earliestLabel} onward. Choose a later date.`);
      return;
    }

    setSelectedDates((current) => [...current, date].sort());
    setSlots((current) => [...current, { date, startTime: DEFAULT_START_TIME }]);
  }

  function removeDate(date: string) {
    setSelectedDates((current) => current.filter((selectedDate) => selectedDate !== date));
    setSlots((current) => current.filter((slot) => slot.date !== date));
  }

  if (durations.length === 0) {
    return (
      <p className="rounded-md border bg-white p-4 text-sm text-muted-foreground">
        This meeting type has no lengths set up yet.
      </p>
    );
  }

  return (
    <div className="grid gap-4">
      {durations.length > 1 ? (
        <div className="grid gap-2">
          <h3 className="text-sm font-semibold">Meeting length</h3>
          <DurationStep durations={durations} value={durationId} onChange={chooseDuration} />
        </div>
      ) : null}

      {duration ? (
        <div className="grid gap-3">
          <h3 className="text-sm font-semibold">Proposed times</h3>
          <p className="text-xs text-muted-foreground">
            Requests need at least {MIN_DAYS_AHEAD} full days notice. The earliest day you can pick is {earliestLabel}.
          </p>
          {notice ? (
            <p className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-800">{notice}</p>
          ) : null}
          <div className="flex flex-col gap-4 md:flex-row md:items-start">
            <div className="md:w-[19rem] md:shrink-0">
              <MonthCalendar selectedDates={selectedDates} onToggleDate={toggleDate} minDate={earliestDate} />
            </div>
            <div className="min-w-0 flex-1">
              <TimeSlotEditor
                durationMinutes={duration.minutes}
                selectedDates={selectedDates}
                slots={slots}
                onChange={setSlots}
                onRemoveDate={removeDate}
              />
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export type { ApiSlot, DurationOption } from "./types";
