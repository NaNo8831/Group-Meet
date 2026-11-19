"use client";

import { CalendarPlus, CheckCircle2, Loader2 } from "lucide-react";
import Link from "next/link";
import { formatInTimeZone } from "date-fns-tz";
import { useCallback, useState } from "react";
import { DateTimePicker, type ApiSlot, type DurationOption } from "@/src/components/DateTimePicker";

interface RequestFormProps {
  slug: string;
  durations: DurationOption[];
  timeZone: string;
}

interface Submitted {
  durationLabel: string;
  minutes: number;
  times: string[];
}

export function RequestForm({ slug, durations, timeZone }: RequestFormProps) {
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [website, setWebsite] = useState("");
  const [durationId, setDurationId] = useState<string | null>(null);
  const [slots, setSlots] = useState<ApiSlot[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState<Submitted | null>(null);

  const handlePickerChange = useCallback((nextSlots: ApiSlot[], nextDurationId: string | null) => {
    setSlots(nextSlots);
    setDurationId(nextDurationId);
  }, []);

  const canSubmit =
    clientName.trim() !== "" && clientEmail.trim() !== "" && durationId !== null && slots.length > 0 && !submitting;

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!canSubmit || !durationId) return;

    setError(null);
    setSubmitting(true);

    try {
      const response = await fetch(`/api/meet/${encodeURIComponent(slug)}/requests`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client_name: clientName,
          client_email: clientEmail,
          duration_id: durationId,
          starts_at: slots.map((slot) => slot.startsAt),
          website
        })
      });
      const payload = (await response.json().catch(() => null)) as { error?: string } | null;

      if (!response.ok) {
        // Keep everything the client typed so they can fix just the problem.
        setError(payload?.error ?? "Unable to submit your request. Please try again.");
        return;
      }

      const chosen = durations.find((option) => option.id === durationId);
      setSubmitted({
        durationLabel: chosen?.label ?? "",
        minutes: chosen?.minutes ?? 0,
        times: slots.map((slot) => slot.startsAt)
      });
    } catch {
      setError("Could not reach the server. Check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="rounded-lg border bg-white p-5 shadow-sm sm:p-6">
        <div className="mb-4 flex items-center gap-3">
          <CheckCircle2 className="h-6 w-6 text-primary" aria-hidden="true" />
          <h2 className="text-xl font-semibold">Request received</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          Thank you. We have your request for a {submitted.minutes}-minute meeting
          {submitted.durationLabel ? ` (${submitted.durationLabel})` : ""}. You will hear from us by email once a
          time is arranged.
        </p>
        <h3 className="mt-5 text-sm font-semibold">Times you proposed</h3>
        <ul className="mt-2 grid gap-1 text-sm">
          {submitted.times.map((time) => (
            <li key={time}>{formatInTimeZone(new Date(time), timeZone, "EEEE, MMM d, yyyy 'at' h:mm a zzz")}</li>
          ))}
        </ul>
        <Link href="/" className="mt-6 inline-block text-sm underline underline-offset-2">
          Back to all meetings
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-lg border bg-white p-5 shadow-sm sm:p-6" noValidate>
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-md bg-accent text-accent-foreground">
          <CalendarPlus className="h-5 w-5" aria-hidden="true" />
        </div>
        <div>
          <h2 className="text-xl font-semibold">Meeting request</h2>
          <p className="text-sm text-muted-foreground">Propose the times that work for you.</p>
        </div>
      </div>

      <div className="grid gap-4">
        <label className="grid gap-2">
          <span className="text-sm font-medium">Name</span>
          <input
            type="text"
            value={clientName}
            onChange={(e) => setClientName(e.target.value)}
            maxLength={120}
            autoComplete="name"
            className="rounded-md border px-3 py-2 outline-none transition focus:ring-2 focus:ring-ring"
          />
        </label>

        <label className="grid gap-2">
          <span className="text-sm font-medium">Email</span>
          <input
            type="email"
            value={clientEmail}
            onChange={(e) => setClientEmail(e.target.value)}
            maxLength={254}
            autoComplete="email"
            className="rounded-md border px-3 py-2 outline-none transition focus:ring-2 focus:ring-ring"
          />
        </label>

        {/* Hidden trap field: people never see or reach it; automated form fillers often fill it. */}
        <div aria-hidden="true" style={{ position: "absolute", left: "-10000px", top: "auto", width: 1, height: 1, overflow: "hidden" }}>
          <label>
            Website
            <input
              type="text"
              name="website"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              tabIndex={-1}
              autoComplete="off"
            />
          </label>
        </div>

        <div className="grid gap-3">
          <DateTimePicker durations={durations} timeZone={timeZone} onChange={handlePickerChange} />
          <p className="text-xs text-muted-foreground">
            Times are shown in {formatInTimeZone(new Date(), timeZone, "zzzz")}.
          </p>
        </div>
      </div>

      {error ? (
        <p className="mt-5 rounded-md border border-destructive/25 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={!canSubmit}
        className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-md bg-primary px-4 py-3 font-medium text-primary-foreground transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {submitting ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : null}
        Submit request
      </button>
    </form>
  );
}
