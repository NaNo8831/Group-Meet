import { format } from "date-fns";
import type { TimeSlot } from "./types";

export function formatSlot(slot: Pick<TimeSlot, "starts_at" | "ends_at">) {
  const start = new Date(slot.starts_at);
  const end = new Date(slot.ends_at);

  return `${format(start, "EEEE, MMMM d, yyyy")} from ${format(start, "h:mm a")} to ${format(end, "h:mm a")}`;
}

export function firstName(name: string) {
  return name.trim().split(/\s+/)[0] ?? name;
}
