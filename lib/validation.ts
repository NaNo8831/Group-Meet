import { z } from "zod";

const slotSchema = z
  .object({
    startsAt: z.string().datetime("Choose a valid start date and time."),
    endsAt: z.string().datetime("Choose a valid end date and time.")
  })
  .refine((slot) => new Date(slot.endsAt).getTime() > new Date(slot.startsAt).getTime(), {
    message: "End time must be after start time.",
    path: ["endsAt"]
  });

export const createMeetingSchema = z.object({
  clientName: z.string().trim().min(1, "Name is required."),
  clientEmail: z.string().trim().email("Enter a valid email address."),
  meetingType: z.enum(["in_depth", "short_form"], {
    required_error: "Choose a meeting type."
  }),
  slots: z.array(slotSchema).min(1, "Add at least one time.")
});

export const submitResponsesSchema = z.object({
  meetingId: z.string().uuid("Meeting ID must be a valid UUID."),
  teamMemberId: z.string().uuid("Team member ID must be a valid UUID."),
  slotIds: z.array(z.string().uuid("Slot ID must be a valid UUID.")).min(1, "Select at least one time.")
});

export type CreateMeetingInput = z.infer<typeof createMeetingSchema>;
export type SubmitResponsesInput = z.infer<typeof submitResponsesSchema>;
