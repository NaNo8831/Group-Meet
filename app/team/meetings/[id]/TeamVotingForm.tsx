"use client";

import { Check, Loader2 } from "lucide-react";
import { useState } from "react";
import { formatSlot } from "@/lib/format";
import type { Meeting, TeamMember, TimeSlot } from "@/lib/types";
import { cn } from "@/lib/utils";

interface TeamVotingFormProps {
  meeting: Meeting;
  member: TeamMember;
  slots: TimeSlot[];
}

export function TeamVotingForm({ meeting, member, slots }: TeamVotingFormProps) {
  const [selected, setSelected] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  function toggleSlot(slotId: string) {
    setSelected((current) =>
      current.includes(slotId) ? current.filter((id) => id !== slotId) : [...current, slotId]
    );
  }

  async function submit() {
    setIsSubmitting(true);
    setError(null);

    const response = await fetch("/api/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        meetingId: meeting.id,
        teamMemberId: member.id,
        slotIds: selected
      })
    });
    const payload = (await response.json().catch(() => null)) as { confirmed?: boolean; error?: string } | null;

    setIsSubmitting(false);

    if (!response.ok) {
      setError(payload?.error ?? "Unable to submit availability.");
      return;
    }

    setConfirmed(Boolean(payload?.confirmed));
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className="rounded-md border bg-accent p-4 text-accent-foreground">
        <h2 className="font-semibold">Thanks, {member.name}</h2>
        <p className="mt-2">
          {confirmed
            ? "This meeting has quorum and is now confirmed."
            : "Your availability has been recorded. We will confirm once quorum is reached."}
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-5">
      <div className="grid gap-3">
        {slots.map((slot) => {
          const isSelected = selected.includes(slot.id);

          return (
            <button
              type="button"
              key={slot.id}
              onClick={() => toggleSlot(slot.id)}
              className={cn(
                "flex min-h-16 items-center justify-between gap-4 rounded-md border px-4 py-3 text-left transition",
                isSelected ? "border-primary bg-accent text-accent-foreground" : "bg-white hover:bg-muted"
              )}
            >
              <span>{formatSlot(slot)}</span>
              <span
                className={cn(
                  "flex h-6 w-6 shrink-0 items-center justify-center rounded-md border",
                  isSelected ? "border-primary bg-primary text-primary-foreground" : "bg-white"
                )}
              >
                {isSelected ? <Check className="h-4 w-4" aria-hidden="true" /> : null}
              </span>
            </button>
          );
        })}
      </div>

      {error ? (
        <p className="rounded-md border border-destructive/25 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      ) : null}

      <button
        type="button"
        onClick={submit}
        disabled={selected.length === 0 || isSubmitting}
        className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-primary px-4 py-3 font-medium text-primary-foreground transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : null}
        Submit availability
      </button>
    </div>
  );
}
