"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { CalendarPlus, Loader2, Minus, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { z } from "zod";
import { createMeetingSchema } from "@/lib/validation";

const localSlotSchema = z
  .object({
    startsAt: z.string().min(1, "Choose a start date and time."),
    endsAt: z.string().min(1, "Choose an end date and time.")
  })
  .refine((slot) => new Date(slot.endsAt).getTime() > new Date(slot.startsAt).getTime(), {
    message: "End time must be after start time.",
    path: ["endsAt"]
  });

const formSchema = createMeetingSchema
  .omit({ slots: true })
  .extend({
    slots: z.array(localSlotSchema).min(1, "Add at least one time.").max(5, "Add no more than five times.")
  });

type RequestFormValues = z.infer<typeof formSchema>;

function toIso(value: string) {
  return new Date(value).toISOString();
}

export default function HomePage() {
  const router = useRouter();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const form = useForm<RequestFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      participantName: "",
      participantEmail: "",
      topic: "",
      slots: [{ startsAt: "", endsAt: "" }]
    }
  });
  const slots = useFieldArray({
    control: form.control,
    name: "slots"
  });
  const isSubmitting = form.formState.isSubmitting;

  async function onSubmit(values: RequestFormValues) {
    setSubmitError(null);

    const response = await fetch("/api/meetings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        ...values,
        slots: values.slots.map((slot) => ({
          startsAt: toIso(slot.startsAt),
          endsAt: toIso(slot.endsAt)
        }))
      })
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
              <p className="text-sm text-muted-foreground">Add up to five proposed times.</p>
            </div>
          </div>

          <div className="grid gap-4">
            <label className="grid gap-2">
              <span className="text-sm font-medium">Name</span>
              <input
                className="rounded-md border px-3 py-2 outline-none transition focus:ring-2 focus:ring-ring"
                {...form.register("participantName")}
              />
              <FieldError message={form.formState.errors.participantName?.message} />
            </label>

            <label className="grid gap-2">
              <span className="text-sm font-medium">Email</span>
              <input
                type="email"
                className="rounded-md border px-3 py-2 outline-none transition focus:ring-2 focus:ring-ring"
                {...form.register("participantEmail")}
              />
              <FieldError message={form.formState.errors.participantEmail?.message} />
            </label>

            <label className="grid gap-2">
              <span className="text-sm font-medium">Topic</span>
              <textarea
                rows={4}
                className="resize-none rounded-md border px-3 py-2 outline-none transition focus:ring-2 focus:ring-ring"
                {...form.register("topic")}
              />
              <FieldError message={form.formState.errors.topic?.message} />
            </label>

            <div className="grid gap-3">
              <div className="flex items-center justify-between gap-4">
                <h3 className="text-sm font-semibold">Proposed times</h3>
                <button
                  type="button"
                  onClick={() => slots.append({ startsAt: "", endsAt: "" })}
                  disabled={slots.fields.length >= 5}
                  className="inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm font-medium transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Plus className="h-4 w-4" aria-hidden="true" />
                  Add another time
                </button>
              </div>

              {slots.fields.map((field, index) => (
                <div key={field.id} className="grid gap-3 rounded-md border bg-muted/35 p-3 sm:grid-cols-[1fr_1fr_auto]">
                  <label className="grid gap-2">
                    <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Start</span>
                    <input
                      type="datetime-local"
                      className="min-w-0 rounded-md border bg-white px-3 py-2 outline-none transition focus:ring-2 focus:ring-ring"
                      {...form.register(`slots.${index}.startsAt`)}
                    />
                    <FieldError message={form.formState.errors.slots?.[index]?.startsAt?.message} />
                  </label>

                  <label className="grid gap-2">
                    <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">End</span>
                    <input
                      type="datetime-local"
                      className="min-w-0 rounded-md border bg-white px-3 py-2 outline-none transition focus:ring-2 focus:ring-ring"
                      {...form.register(`slots.${index}.endsAt`)}
                    />
                    <FieldError message={form.formState.errors.slots?.[index]?.endsAt?.message} />
                  </label>

                  <button
                    type="button"
                    onClick={() => slots.remove(index)}
                    disabled={slots.fields.length === 1}
                    aria-label="Remove time"
                    title="Remove time"
                    className="mt-6 inline-flex h-10 w-10 items-center justify-center rounded-md border bg-white transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Minus className="h-4 w-4" aria-hidden="true" />
                  </button>
                </div>
              ))}
              <FieldError message={form.formState.errors.slots?.root?.message} />
            </div>
          </div>

          {submitError ? (
            <p className="mt-5 rounded-md border border-destructive/25 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {submitError}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={isSubmitting}
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
