"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { CalendarPlus, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { createMeetingSchema } from "@/lib/validation";
import { DateTimePicker, type ApiSlot, type MeetingType } from "@/src/components/DateTimePicker";

const formSchema = createMeetingSchema;

type RequestFormValues = z.infer<typeof formSchema>;

export default function HomePage() {
  const router = useRouter();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const form = useForm<RequestFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      clientName: "",
      clientEmail: "",
      slots: []
    }
  });
  const isSubmitting = form.formState.isSubmitting;
  const selectedMeetingType = form.watch("meetingType");
  const selectedSlots = form.watch("slots");
  const canSubmit = Boolean(selectedMeetingType) && selectedSlots.length > 0 && !isSubmitting;

  const handleDateTimeChange = useCallback(
    (slots: ApiSlot[], meetingType: MeetingType | null) => {
      if (meetingType) {
        form.setValue("meetingType", meetingType, { shouldDirty: true, shouldValidate: true });
      }

      form.setValue("slots", slots, { shouldDirty: true, shouldValidate: true });
    },
    [form]
  );

  async function onSubmit(values: RequestFormValues) {
    setSubmitError(null);

    const response = await fetch("/api/meetings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(values)
    });

    const payload = (await response.json().catch(() => null)) as { meetingId?: string; error?: string } | null;

    if (!response.ok || !payload?.meetingId) {
      setSubmitError(payload?.error ?? "Unable to submit the meeting request.");
      return;
    }

    router.push(`/meetings/${payload.meetingId}`);
  }

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#f7fbfa_0%,#ffffff_55%)] px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-5xl gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
        <section className="pt-4 lg:pt-12">
          <p className="mb-4 text-sm font-medium uppercase tracking-wide text-primary">Group Meet</p>
          <h1 className="text-4xl font-semibold leading-tight text-foreground sm:text-5xl">
            Request a meeting with the right team pair.
          </h1>
          <p className="mt-5 max-w-xl text-base leading-7 text-muted-foreground">
            Propose a few times, and the request confirms automatically when one Leader and one Support are both
            available.
          </p>
        </section>

        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="rounded-lg border bg-white p-5 shadow-sm sm:p-6"
          noValidate
        >
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-accent text-accent-foreground">
              <CalendarPlus className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <h2 className="text-xl font-semibold">Meeting request</h2>
              <p className="text-sm text-muted-foreground">Choose a meeting type and propose available times.</p>
            </div>
          </div>

          <div className="grid gap-4">
            <label className="grid gap-2">
              <span className="text-sm font-medium">Name</span>
              <input
                className="rounded-md border px-3 py-2 outline-none transition focus:ring-2 focus:ring-ring"
                {...form.register("clientName")}
              />
              <FieldError message={form.formState.errors.clientName?.message} />
            </label>

            <label className="grid gap-2">
              <span className="text-sm font-medium">Email</span>
              <input
                type="email"
                className="rounded-md border px-3 py-2 outline-none transition focus:ring-2 focus:ring-ring"
                {...form.register("clientEmail")}
              />
              <FieldError message={form.formState.errors.clientEmail?.message} />
            </label>

            <div className="grid gap-3">
              <DateTimePicker onChange={handleDateTimeChange} />
              <FieldError message={form.formState.errors.meetingType?.message} />
              <FieldError message={form.formState.errors.slots?.message} />
            </div>
          </div>

          {submitError ? (
            <p className="mt-5 rounded-md border border-destructive/25 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {submitError}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={!canSubmit}
            className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-md bg-primary px-4 py-3 font-medium text-primary-foreground transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : null}
            Submit request
          </button>
        </form>
      </div>
    </main>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) {
    return null;
  }

  return <span className="text-sm text-destructive">{message}</span>;
}
