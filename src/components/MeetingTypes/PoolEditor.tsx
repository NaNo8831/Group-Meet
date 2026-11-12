"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  MeetingTypeRole,
  PoolEntry,
  Readiness,
  RosterProfessional,
  errorClass,
  sendJson
} from "./types";

interface PoolEditorProps {
  meetingTypeId: string;
  roles: MeetingTypeRole[];
  pool: PoolEntry[];
  readiness: Readiness;
  onChanged: () => Promise<void>;
}

export function PoolEditor({ meetingTypeId, roles, pool, readiness, onChanged }: PoolEditorProps) {
  const [roster, setRoster] = useState<RosterProfessional[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [rowErrors, setRowErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const result = await sendJson<{ professionals: RosterProfessional[] }>(
        "GET",
        "/api/admin/professionals"
      );
      if (cancelled) return;
      if (result.ok) setRoster(result.data.professionals);
      else setLoadError(result.error);
      setLoading(false);
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const poolByProfessional = new Map(pool.map((entry) => [entry.professional_id, entry]));
  // Active professionals, plus anyone already in the pool who has since been deactivated.
  const rows = roster
    .filter((pro) => pro.is_active || poolByProfessional.has(pro.id))
    .sort((a, b) => a.name.localeCompare(b.name));

  async function toggleRole(professionalId: string, roleId: string, checked: boolean) {
    const current = poolByProfessional.get(professionalId)?.role_ids ?? [];
    const next = checked ? Array.from(new Set([...current, roleId])) : current.filter((id) => id !== roleId);

    setBusyId(professionalId);
    setRowErrors((prev) => {
      const { [professionalId]: _removed, ...rest } = prev;
      return rest;
    });

    const result = await sendJson(
      "PUT",
      `/api/admin/meeting-types/${meetingTypeId}/pool/${professionalId}`,
      { role_ids: next }
    );

    if (!result.ok) {
      setRowErrors((prev) => ({ ...prev, [professionalId]: result.error }));
    } else {
      await onChanged();
    }
    setBusyId(null);
  }

  return (
    <section className="grid gap-4 rounded-md border bg-white p-5">
      <div>
        <h2 className="text-lg font-semibold">Pool</h2>
        <p className="text-sm text-muted-foreground">
          Tick the roles each professional can fill for this meeting type. Only people in the pool are asked
          about requests of this type.
        </p>
      </div>

      {readiness.roleCoverage.length > 0 ? (
        <ul className="grid gap-1 text-sm">
          {readiness.roleCoverage.map((coverage) => {
            const short = coverage.available < coverage.needed;
            return (
              <li key={coverage.roleId} className={short ? "text-amber-700" : "text-muted-foreground"}>
                {coverage.name}: {coverage.available} available, {coverage.needed} needed
                {short ? " — not enough people yet" : ""}
              </li>
            );
          })}
        </ul>
      ) : null}

      {loadError ? <p className={errorClass}>{loadError}</p> : null}

      {roles.length === 0 ? (
        <p className="text-sm text-muted-foreground">Add at least one role above before building the pool.</p>
      ) : loading ? (
        <p className="text-sm text-muted-foreground">Loading professionals…</p>
      ) : rows.length === 0 && !loadError ? (
        <p className="text-sm text-muted-foreground">
          No professionals yet. Add some on the{" "}
          <Link href="/admin/professionals" className="underline underline-offset-2">
            Professionals page
          </Link>
          .
        </p>
      ) : (
        <div className="overflow-x-auto rounded-md border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                <th className="px-4 py-3">Professional</th>
                {roles.map((role) => (
                  <th key={role.id} className="px-4 py-3">
                    {role.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((pro) => {
                const entry = poolByProfessional.get(pro.id);
                return (
                  <tr key={pro.id} className={`border-b last:border-b-0 ${!pro.is_active ? "opacity-60" : ""}`}>
                    <td className="px-4 py-3">
                      <div className="font-medium">
                        {pro.name}
                        {!pro.is_active ? (
                          <span className="ml-2 rounded-full bg-gray-100 px-2 py-0.5 text-xs font-normal text-gray-600">
                            Inactive
                          </span>
                        ) : null}
                      </div>
                      <div className="text-xs text-muted-foreground">{pro.email}</div>
                      {rowErrors[pro.id] ? (
                        <p className={`${errorClass} mt-2`}>{rowErrors[pro.id]}</p>
                      ) : null}
                    </td>
                    {roles.map((role) => (
                      <td key={role.id} className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={entry?.role_ids.includes(role.id) ?? false}
                          disabled={busyId === pro.id}
                          onChange={(e) => toggleRole(pro.id, role.id, e.target.checked)}
                          aria-label={`${pro.name} can be ${role.name}`}
                          className="h-4 w-4"
                        />
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
