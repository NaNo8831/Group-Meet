import { format } from "date-fns";
import type { Meeting, TimeSlot } from "./types";

/** Client name, falling back to the legacy participant_name on pre-Sprint 004 rows. */
export function clientName(meeting: Pick<Meeting, "client_name" | "participant_name">) {
  return meeting.client_name ?? meeting.participant_name ?? "Client";
}

/** Client email, falling back to the legacy participant_email on pre-Sprint 004 rows. */
export function clientEmail(meeting: Pick<Meeting, "client_email" | "participant_email">) {
  return meeting.client_email ?? meeting.participant_email ?? null;
}

/** Display title for a meeting: its type, or the legacy topic on old rows. */
export function meetingTitle(meeting: Pick<Meeting, "meeting_type" | "topic">) {
  if (meeting.meeting_type === "in_depth") return "In-depth meeting (75 min)";
  if (meeting.meeting_type === "short_form") return "Short-form meeting (45 min)";
  return meeting.topic ?? "Meeting request";
}

export function formatSlot(slot: Pick<TimeSlot, "starts_at" | "ends_at">) {
  const start = new Date(slot.starts_at);
  const end = new Date(slot.ends_at);

  return `${format(start, "EEEE, MMMM d, yyyy")} from ${format(start, "h:mm a")} to ${format(end, "h:mm a")}`;
}

export function firstName(name: string) {
  return name.trim().split(/\s+/)[0] ?? name;
}
