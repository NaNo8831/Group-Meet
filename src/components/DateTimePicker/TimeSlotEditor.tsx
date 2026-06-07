import { format, parseISO } from "date-fns";
import { Minus, Plus } from "lucide-react";
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
      if (index === currentSlotIndex) {
        return false;
      }

      return overlapsBufferedSlot(option, slot.startTime, duration);
    });
  }

  function firstAvailableTime(date: string) {
    return timeOptions.find((option) => !isOptionBlocked(date, option));
  }

  function addSlot(date: string) {
    const startTime = !isOptionBlocked(date, DEFAULT_START_TIME) ? DEFAULT_START_TIME : firstAvailableTime(date);

    if (!startTime) {
      return;
    }

    onChange([...slots, { date, startTime }]);
  }

  function updateSlot(date: string, slotIndex: number, startTime: string) {
    let currentIndex = -1;
    onChange(
      slots.map((slot) => {
        if (slot.date !== date) {
          return slot;
        }

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
        if (slot.date !== date) {
          return true;
        }

        currentIndex += 1;
        return currentIndex !== slotIndex;
      })
    );
  }

  return (
    <div className="rounded-md border bg-white">
      {selectedDates.map((date) => {
        const dateSlots = slotsForDate(date);

        return (
          <div key={date} className="border-b p-4 last:border-b-0">
            <div className="mb-3 flex items-center justify-between gap-3">
              <h3 className="text-sm font-semibold">{format(parseISO(`${date}T00:00:00`), "EEE, MMM d")}</h3>
              <button
                type="button"
                onClick={() => addSlot(date)}
                disabled={!firstAvailableTime(date)}
                className="inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm font-medium transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Plus className="h-4 w-4" aria-hidden="true" />
                Add time
              </button>
            </div>

            <div className="grid gap-2">
              {dateSlots.map((slot, index) => (
                <div key={`${date}-${index}`} className="grid grid-cols-[1fr_auto] gap-2">
                  <select
                    value={slot.startTime}
                    onChange={(event) => updateSlot(date, index, event.target.value)}
                    className="min-w-0 rounded-md border bg-white px-3 py-2 outline-none transition focus:ring-2 focus:ring-ring"
                    aria-label={`Start time for ${format(parseISO(`${date}T00:00:00`), "MMM d")}`}
                  >
                    {timeOptions
                      .filter((option) => !isOptionBlocked(date, option, index))
                      .map((option) => (
                        <option key={option} value={option}>
                          {formatTimeLabel(option)}
                        </option>
                      ))}
                  </select>

                  <button
                    type="button"
                    onClick={() => removeSlot(date, index)}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-md border transition hover:bg-muted"
                    aria-label="Remove time"
                    title="Remove time"
                  >
                    <Minus className="h-4 w-4" aria-hidden="true" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
