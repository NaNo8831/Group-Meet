"use client";

import { format, getDay, getISOWeek, parseISO } from "date-fns";
import { MoreVertical, Plus } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import {
  DEFAULT_START_TIME,
  MEETING_DURATIONS,
  formatTimeLabel,
  getTimeOptions,
  type MeetingType,
  type TimeSlot
} from "./types";

interface TimeSlotEditorProps {
  meetingType: MeetingType;
  selectedDates: string[];
  slots: TimeSlot[];
  onChange: (slots: TimeSlot[]) => void;
  onRemoveDate: (date: string) => void;
}

const timeOptions = getTimeOptions();
const BUFFER_MINUTES = 15;

function timeToMinutes(value: string) {
  const [hours, minutes] = value.split(":").map(Number);
  return hours * 60 + minutes;
}

function overlapsBufferedSlot(candidate: string, selected: string, duration: number) {
  const candidateStart = timeToMinutes(candidate);
  const candidateEnd = candidateStart + duration + BUFFER_MINUTES;
  const selectedStart = timeToMinutes(selected);
  const selectedEnd = selectedStart + duration + BUFFER_MINUTES;

  return candidateStart < selectedEnd && candidateEnd > selectedStart;
}

function SlotMenu({
  date,
  slotIndex,
  startTime,
  selectedDates,
  onDelete,
  onApplyToDay
}: {
  date: string;
  slotIndex: number;
  startTime: string;
  selectedDates: string[];
  onDelete: () => void;
  onApplyToDay: (dayOfWeek: number, startTime: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const parsedDate = parseISO(`${date}T00:00:00`);
  const dayOfWeek = getDay(parsedDate);
  const dayName = format(parsedDate, "EEEE");

  const siblingsWithSameDay = selectedDates.filter((d) => {
    if (d === date) return false;
    return getDay(parseISO(`${d}T00:00:00`)) === dayOfWeek;
  });

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="inline-flex h-9 w-9 items-center justify-center rounded-md border transition hover:bg-muted"
        aria-label="Slot options"
        title="Slot options"
      >
        <MoreVertical className="h-4 w-4" aria-hidden="true" />
      </button>

      {open ? (
        <div className="absolute right-0 top-full z-10 mt-1 min-w-[13rem] rounded-md border bg-white py-1 shadow-md">
          {siblingsWithSameDay.length > 0 ? (
            <button
              type="button"
              onClick={() => {
                onApplyToDay(dayOfWeek, startTime);
                setOpen(false);
              }}
              className="w-full px-3 py-2 text-left text-sm transition hover:bg-muted"
            >
              Apply to all {dayName}s
            </button>
          ) : null}

          <button
            type="button"
            onClick={() => {
              onDelete();
              setOpen(false);
            }}
            className="w-full px-3 py-2 text-left text-sm text-destructive transition hover:bg-destructive/10"
          >
            Delete
          </button>
        </div>
      ) : null}
    </div>
  );
}

export function TimeSlotEditor({ meetingType, selectedDates, slots, onChange, onRemoveDate }: TimeSlotEditorProps) {
  const duration = MEETING_DURATIONS[meetingType];

  if (selectedDates.length === 0) {
    return (
      <div className="rounded-md border bg-white p-4 text-sm text-muted-foreground">
        Select one or more dates to add available times.
      </div>
    );
  }

  function slotsForDate(date: string) {
    return slots.filter((slot) => slot.date === date);
  }

  function isOptionBlocked(date: string, option: string, currentSlotIndex?: number) {
    return slotsForDate(date).some((slot, index) => {
      if (index === currentSlotIndex) return false;
      return overlapsBufferedSlot(option, slot.startTime, duration);
    });
  }

  function firstAvailableTime(date: string) {
    return timeOptions.find((option) => !isOptionBlocked(date, option));
  }

  function addSlot(date: string) {
    const startTime = !isOptionBlocked(date, DEFAULT_START_TIME) ? DEFAULT_START_TIME : firstAvailableTime(date);
    if (!startTime) return;
    onChange([...slots, { date, startTime }]);
  }

  function updateSlot(date: string, slotIndex: number, startTime: string) {
    let currentIndex = -1;
    onChange(
      slots.map((slot) => {
        if (slot.date !== date) return slot;
        currentIndex += 1;
        return currentIndex === slotIndex ? { ...slot, startTime } : slot;
      })
    );
  }

  function removeSlot(date: string, slotIndex: number) {
    const dateSlots = slotsForDate(date);

    if (dateSlots.length <= 1) {
      onRemoveDate(date);
      return;
    }

    let currentIndex = -1;
    onChange(
      slots.filter((slot) => {
        if (slot.date !== date) return true;
        currentIndex += 1;
        return currentIndex !== slotIndex;
      })
    );
  }

  function applySlotToDay(dayOfWeek: number, startTime: string) {
    const targetDates = selectedDates.filter(
      (d) => getDay(parseISO(`${d}T00:00:00`)) === dayOfWeek
    );

    const newSlots = [...slots];
    for (const targetDate of targetDates) {
      if (!isOptionBlocked(targetDate, startTime)) {
        newSlots.push({ date: targetDate, startTime });
      }
    }
    onChange(newSlots);
  }

  // Group dates by ISO week
  const weekGroups: { weekKey: string; dates: string[] }[] = [];
  for (const date of selectedDates) {
    const weekKey = String(getISOWeek(parseISO(`${date}T00:00:00`)));
    const existing = weekGroups.find((g) => g.weekKey === weekKey);
    if (existing) {
      existing.dates.push(date);
    } else {
      weekGroups.push({ weekKey, dates: [date] });
    }
  }

  return (
    <div className="rounded-md border bg-white">
      {weekGroups.map((group, groupIndex) => (
        <div key={group.weekKey}>
          {groupIndex > 0 ? <hr className="border-t border-gray-200" /> : null}

          {group.dates.map((date) => {
            const dateSlots = slotsForDate(date);
            const parsedDate = parseISO(`${date}T00:00:00`);
            const chipLabel = format(parsedDate, "MMM d");

            return (
              <div key={date} className="p-3">
                {dateSlots.map((slot, index) => (
                  <div key={`${date}-${index}`} className="mb-1.5 flex items-center gap-2">
                    {index === 0 ? (
                      <span className="inline-flex h-9 w-16 shrink-0 items-center justify-center rounded-md bg-accent px-2 text-xs font-semibold text-accent-foreground">
                        {chipLabel}
                      </span>
                    ) : (
                      <span className="inline-flex h-9 w-16 shrink-0" aria-hidden="true" />
                    )}

                    <select
                      value={slot.startTime}
                      onChange={(event) => updateSlot(date, index, event.target.value)}
                      className="min-w-0 flex-1 rounded-md border bg-white px-3 py-2 text-sm outline-none transition focus:ring-2 focus:ring-ring"
                      aria-label={`Start time for ${chipLabel}`}
                    >
                      {timeOptions
                        .filter((option) => !isOptionBlocked(date, option, index))
                        .map((option) => (
                          <option key={option} value={option}>
                            {formatTimeLabel(option)}
                          </option>
                        ))}
                    </select>

                    <SlotMenu
                      date={date}
                      slotIndex={index}
                      startTime={slot.startTime}
                      selectedDates={selectedDates}
                      onDelete={() => removeSlot(date, index)}
                      onApplyToDay={applySlotToDay}
                    />
                  </div>
                ))}

                <div className="mt-1.5 flex items-center gap-2">
                  <span className="inline-flex h-9 w-16 shrink-0" aria-hidden="true" />
                  <button
                    type="button"
                    onClick={() => addSlot(date)}
                    disabled={!firstAvailableTime(date)}
                    className="inline-flex items-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-medium text-primary transition hover:bg-accent disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                    Add time
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
