"use client";

import { useEffect, useMemo, useState } from "react";
import { DurationStep } from "./DurationStep";
import { MonthCalendar } from "./MonthCalendar";
import { TimeSlotEditor } from "./TimeSlotEditor";
import {
  DEFAULT_START_TIME,
  toApiSlots,
  type ApiSlot,
  type MeetingType,
  type TimeSlot
} from "./types";

interface DateTimePickerProps {
  onChange: (slots: ApiSlot[], meetingType: MeetingType | null) => void;
}

export function DateTimePicker({ onChange }: DateTimePickerProps) {
  const [meetingType, setMeetingType] = useState<MeetingType | null>(null);
  const [selectedDates, setSelectedDates] = useState<string[]>([]);
  const [slots, setSlots] = useState<TimeSlot[]>([]);

  const apiSlots = useMemo(() => {
    if (!meetingType) {
      return [];
    }

    return toApiSlots(slots, meetingType);
  }, [meetingType, slots]);

  useEffect(() => {
    onChange(apiSlots, meetingType);
  }, [apiSlots, meetingType, onChange]);

  function toggleDate(date: string) {
    if (selectedDates.includes(date)) {
      setSelectedDates((current) => current.filter((selectedDate) => selectedDate !== date));
      setSlots((current) => current.filter((slot) => slot.date !== date));
      return;
    }

    setSelectedDates((current) => [...current, date].sort());
    setSlots((current) => [...current, { date, startTime: DEFAULT_START_TIME }]);
  }

  function removeDate(date: string) {
    setSelectedDates((current) => current.filter((selectedDate) => selectedDate !== date));
    setSlots((current) => current.filter((slot) => slot.date !== date));
  }

  return (
    <div className="grid gap-4">
      <div className="grid gap-2">
        <h3 className="text-sm font-semibold">Meeting type</h3>
        <DurationStep value={meetingType} onChange={setMeetingType} />
      </div>

      {meetingType ? (
        <div className="grid gap-3">
          <h3 className="text-sm font-semibold">Proposed times</h3>
          <div className="flex flex-col gap-4 md:flex-row md:items-start">
            <div className="md:w-[19rem] md:shrink-0">
              <MonthCalendar selectedDates={selectedDates} onToggleDate={toggleDate} />
            </div>
            <div className="min-w-0 flex-1">
              <TimeSlotEditor
                meetingType={meetingType}
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

export type { ApiSlot, MeetingType } from "./types";
