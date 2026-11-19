import { z } from "zod";
import { MAX_SLOTS } from "@/lib/slot-rules";

// Validation for a client's request to a meeting type. Pure: no database imports.
// The browser sends only start times; the server derives every end time from the chosen
// duration (Decision 049), so there is deliberately no end time field here.

export const createRequestSchema = z.object({
  client_name: z
    .string({ required_error: "Name is required." })
    .trim()
    .min(1, "Name is required.")
    .max(120, "Name must be 120 characters or fewer."),
  client_email: z
    .string({ required_error: "Email is required." })
    .trim()
    .toLowerCase()
    .email("Enter a valid email address.")
    .max(254, "Email must be 254 characters or fewer."),
  duration_id: z
    .string({ required_error: "Choose one of the listed lengths." })
    .uuid("Choose one of the listed lengths."),
  starts_at: z
    .array(z.string().datetime("One of the times is not a valid date and time."), {
      required_error: "Add at least one time."
    })
    .min(1, "Add at least one time.")
    .max(MAX_SLOTS, `Choose no more than ${MAX_SLOTS} times.`),
  /** Hidden trap field. Real people leave it empty. */
  website: z.string().optional()
});

export type CreateRequestInput = z.infer<typeof createRequestSchema>;
