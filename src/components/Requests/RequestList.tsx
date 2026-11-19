"use client";

import { formatInTimeZone } from "date-fns-tz";
import { useEffect, useState } from "react";

// Mirrors the JSON from GET /api/admin/requests. Read-only (Decision 068).
interface RequestItem {
  id: string;
  clientName: string;
  clientEmail: string;
  status: string;
  createdAt: string;
  businessTimezone: string;
  meetingType: { title: string; slug: string } | null;
  duration: { label: string; minutes: number } | null;
  slots: string[];
}

const STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  flagged: "Flagged",
  ready_for_pairing: "Ready for pairing",
  paired: "Paired",
  awaiting_confirmation: "Awaiting confirmation",
  confirmed: "Confirmed",
  completed: "Completed",
  cancelled: "Cancelled"
};

function formatTime(value: string, timeZone: string) {
  try {
    return formatInTimeZone(new Date(value), timeZone, "EEE MMM d, h:mm a zzz");
  } catch {
    return new Date(value).toLocaleString();
  }
}

export function RequestList() {
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch("/api/admin/requests");
        const payload = (await res.json().catch(() => null)) as { requests?: RequestItem[]; error?: string } | null;
        if (cancelled) return;
        if (!res.ok) {
          setError(payload?.error ?? "Failed to load requests");
        } else {
          setRequests(payload?.requests ?? []);
        }
      } catch {
        if (!cancelled) setError("Could not reach the server. Check your connection and try again.");
      }
      if (!cancelled) setLoading(false);
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Requests</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          The latest client requests, newest first. This list is read-only for now.
        </p>
      </div>

      {error ? (
        <p className="rounded-md border border-destructive/25 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      ) : null}

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : requests.length === 0 && !error ? (
        <p className="rounded-md border bg-white p-4 text-sm text-muted-foreground">No requests yet.</p>
      ) : (
        <div className="overflow-x-auto rounded-md border bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                <th className="px-4 py-3">Client</th>
                <th className="px-4 py-3">Meeting</th>
                <th className="px-4 py-3">Proposed times</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Received</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((item) => (
                <tr key={item.id} className="border-b align-top last:border-b-0">
                  <td className="px-4 py-3">
                    <div className="font-medium">{item.clientName}</div>
                    <div className="text-xs text-muted-foreground">{item.clientEmail}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div>{item.meetingType?.title ?? "Unknown"}</div>
                    <div className="text-xs text-muted-foreground">
                      {item.duration ? `${item.duration.label}, ${item.duration.minutes} min` : "—"}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <ul className="grid gap-1">
                      {item.slots.map((slot) => (
                        <li key={slot}>{formatTime(slot, item.businessTimezone)}</li>
                      ))}
                    </ul>
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700">
                      {STATUS_LABELS[item.status] ?? item.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{formatTime(item.createdAt, item.businessTimezone)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
