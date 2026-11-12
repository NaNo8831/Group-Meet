"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { MeetingTypeSummary, errorClass, primaryButtonClass, sendJson } from "./types";

export function MeetingTypeList() {
  const [meetingTypes, setMeetingTypes] = useState<MeetingTypeSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const result = await sendJson<{ meeting_types: MeetingTypeSummary[] }>(
        "GET",
        "/api/admin/meeting-types"
      );
      if (cancelled) return;
      if (result.ok) {
        setMeetingTypes(result.data.meeting_types);
      } else {
        setError(result.error);
      }
      setLoading(false);
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="grid gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Meeting types</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Each meeting type has its own link, durations, roles, and pool of professionals.
          </p>
        </div>
        <Link href="/admin/meeting-types/new" className={primaryButtonClass}>
          New meeting type
        </Link>
      </div>

      {error ? <p className={errorClass}>{error}</p> : null}

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : meetingTypes.length === 0 && !error ? (
        <p className="rounded-md border bg-white p-4 text-sm text-muted-foreground">
          No meeting types yet. Create one to get started.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-md border bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                <th className="px-4 py-3">Title</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Durations</th>
                <th className="px-4 py-3">Roles</th>
                <th className="px-4 py-3">Pool</th>
              </tr>
            </thead>
            <tbody>
              {meetingTypes.map((type) => (
                <tr key={type.id} className="border-b last:border-b-0">
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/meeting-types/${type.id}`}
                      className="font-medium underline-offset-2 hover:underline"
                    >
                      {type.title}
                    </Link>
                    <div className="text-xs text-muted-foreground">/meet/{type.slug}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                        type.is_active ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {type.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {type.durations.length > 0
                      ? type.durations.map((d) => `${d.label} ${d.minutes}`).join(", ")
                      : "None yet"}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {type.roles.length > 0
                      ? type.roles.map((r) => `${r.name} x${r.required_count}`).join(", ")
                      : "None yet"}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {type.pool_size} professional{type.pool_size === 1 ? "" : "s"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
