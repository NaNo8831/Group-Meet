"use client";

import { useState } from "react";
import {
  MeetingTypeDuration,
  errorClass,
  inputClass,
  primaryButtonClass,
  sendJson,
  smallButtonClass
} from "./types";

interface DurationsEditorProps {
  meetingTypeId: string;
  durations: MeetingTypeDuration[];
  onChanged: () => Promise<void>;
}

function DurationRow({
  meetingTypeId,
  duration,
  onChanged
}: {
  meetingTypeId: string;
  duration: MeetingTypeDuration;
  onChanged: () => Promise<void>;
}) {
  const [label, setLabel] = useState(duration.label);
  const [minutes, setMinutes] = useState(String(duration.minutes));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const unchanged = label === duration.label && Number(minutes) === duration.minutes;

  async function save() {
    setBusy(true);
    setError(null);
    const result = await sendJson(
      "PATCH",
      `/api/admin/meeting-types/${meetingTypeId}/durations/${duration.id}`,
      { label, minutes: Number(minutes) }
    );
    if (!result.ok) setError(result.error);
    else await onChanged();
    setBusy(false);
  }

  async function remove() {
    setBusy(true);
    setError(null);
    const result = await sendJson(
      "DELETE",
      `/api/admin/meeting-types/${meetingTypeId}/durations/${duration.id}`
    );
    if (!result.ok) {
      setError(result.error);
      setBusy(false);
      return;
    }
    await onChanged();
    setBusy(false);
  }

  return (
    <li className="grid gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <input
          type="text"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          maxLength={40}
          aria-label="Duration name"
          className={`${inputClass} w-40`}
        />
        <input
          type="number"
          value={minutes}
          onChange={(e) => setMinutes(e.target.value)}
          min={5}
          max={480}
          step={5}
          aria-label="Minutes"
          className={`${inputClass} w-24`}
        />
        <span className="text-sm text-muted-foreground">minutes</span>
        <button type="button" onClick={save} disabled={busy || unchanged} className={smallButtonClass}>
          Save
        </button>
        <button type="button" onClick={remove} disabled={busy} className={smallButtonClass}>
          Delete
        </button>
      </div>
      {error ? <p className={errorClass}>{error}</p> : null}
    </li>
  );
}

export function DurationsEditor({ meetingTypeId, durations, onChanged }: DurationsEditorProps) {
  const [label, setLabel] = useState("");
  const [minutes, setMinutes] = useState("45");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const result = await sendJson("POST", `/api/admin/meeting-types/${meetingTypeId}/durations`, {
      label,
      minutes: Number(minutes)
    });
    if (!result.ok) {
      setError(result.error);
    } else {
      setLabel("");
      await onChanged();
    }
    setBusy(false);
  }

  return (
    <section className="grid gap-4 rounded-md border bg-white p-5">
      <div>
        <h2 className="text-lg font-semibold">Durations</h2>
        <p className="text-sm text-muted-foreground">
          The lengths a client can choose from, for example Short 30, Normal 45, Long 60.
        </p>
      </div>

      {durations.length === 0 ? (
        <p className="text-sm text-muted-foreground">No durations yet. Add at least one to switch this type on.</p>
      ) : (
        <ul className="grid gap-3">
          {durations.map((duration) => (
            <DurationRow
              key={`${duration.id}-${duration.label}-${duration.minutes}`}
              meetingTypeId={meetingTypeId}
              duration={duration}
              onChanged={onChanged}
            />
          ))}
        </ul>
      )}

      <form onSubmit={handleAdd} className="flex flex-wrap items-end gap-2 border-t pt-4">
        <label className="grid gap-1">
          <span className="text-xs font-medium">Name</span>
          <input
            type="text"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            required
            maxLength={40}
            placeholder="Short"
            className={`${inputClass} w-40`}
          />
        </label>
        <label className="grid gap-1">
          <span className="text-xs font-medium">Minutes</span>
          <input
            type="number"
            value={minutes}
            onChange={(e) => setMinutes(e.target.value)}
            required
            min={5}
            max={480}
            step={5}
            className={`${inputClass} w-24`}
          />
        </label>
        <button type="submit" disabled={busy} className={primaryButtonClass}>
          Add duration
        </button>
      </form>
      {error ? <p className={errorClass}>{error}</p> : null}
    </section>
  );
}
