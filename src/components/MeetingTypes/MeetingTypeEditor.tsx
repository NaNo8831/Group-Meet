"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { DurationsEditor } from "./DurationsEditor";
import { PoolEditor } from "./PoolEditor";
import { RolesEditor } from "./RolesEditor";
import { MeetingTypeDetail, errorClass, inputClass, primaryButtonClass, sendJson } from "./types";

export function MeetingTypeEditor({ id }: { id: string }) {
  const [detail, setDetail] = useState<MeetingTypeDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    const result = await sendJson<{ meeting_type: MeetingTypeDetail }>("GET", `/api/admin/meeting-types/${id}`);
    if (result.ok) {
      setDetail(result.data.meeting_type);
      setLoadError(null);
    } else {
      setLoadError(result.error);
    }
    setLoading(false);
  }, [id]);

  useEffect(() => {
    void reload();
  }, [reload]);

  if (loading) return <p className="text-sm text-muted-foreground">Loading…</p>;

  if (!detail) {
    return (
      <div className="grid gap-3">
        <p className={errorClass}>{loadError ?? "Meeting type not found."}</p>
        <Link href="/admin/meeting-types" className="text-sm underline underline-offset-2">
          Back to meeting types
        </Link>
      </div>
    );
  }

  return (
    <div className="grid gap-6">
      <div>
        <Link href="/admin/meeting-types" className="text-sm text-muted-foreground underline underline-offset-2">
          All meeting types
        </Link>
        <h1 className="mt-2 text-2xl font-semibold">{detail.title}</h1>
      </div>

      <StatusPanel detail={detail} onChanged={reload} />
      <DetailsForm detail={detail} onChanged={reload} />
      <DurationsEditor meetingTypeId={detail.id} durations={detail.durations} onChanged={reload} />
      <RolesEditor meetingTypeId={detail.id} roles={detail.roles} onChanged={reload} />
      <PoolEditor
        meetingTypeId={detail.id}
        roles={detail.roles}
        pool={detail.pool}
        readiness={detail.readiness}
        onChanged={reload}
      />
    </div>
  );
}

function StatusPanel({ detail, onChanged }: { detail: MeetingTypeDetail; onChanged: () => Promise<void> }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function toggle() {
    setBusy(true);
    setError(null);
    const result = await sendJson("PATCH", `/api/admin/meeting-types/${detail.id}`, {
      is_active: !detail.is_active
    });
    if (!result.ok) setError(result.error);
    else await onChanged();
    setBusy(false);
  }

  const shortRoles = detail.readiness.roleCoverage.filter((c) => c.available < c.needed);

  return (
    <section className="grid gap-3 rounded-md border bg-white p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold">Status</h2>
            <span
              className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                detail.is_active ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600"
              }`}
            >
              {detail.is_active ? "Active" : "Inactive"}
            </span>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Planned public link: <code>/meet/{detail.slug}</code> (goes live in Sprint 009).
          </p>
        </div>
        <button type="button" onClick={toggle} disabled={busy} className={primaryButtonClass}>
          {busy ? "Saving…" : detail.is_active ? "Turn off" : "Turn on"}
        </button>
      </div>

      {error ? <p className={errorClass}>{error}</p> : null}

      {detail.is_active && shortRoles.length > 0 ? (
        <p className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          Warning: {shortRoles.map((c) => `${c.name} has ${c.available} of ${c.needed} people needed`).join("; ")}.
        </p>
      ) : null}
      {!detail.is_active && shortRoles.length > 0 && detail.readiness.canActivate ? (
        <p className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          You can turn this on, but {shortRoles.map((c) => c.name).join(" and ")}{" "}
          {shortRoles.length === 1 ? "does" : "do"} not have enough people in the pool yet.
        </p>
      ) : null}
    </section>
  );
}

function DetailsForm({ detail, onChanged }: { detail: MeetingTypeDetail; onChanged: () => Promise<void> }) {
  const [title, setTitle] = useState(detail.title);
  const [slug, setSlug] = useState(detail.slug);
  const [description, setDescription] = useState(detail.landing_description ?? "");
  const [minSlots, setMinSlots] = useState(String(detail.min_matched_slots));
  const [minResponses, setMinResponses] = useState(detail.min_responses === null ? "" : String(detail.min_responses));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSaved(false);

    const result = await sendJson("PATCH", `/api/admin/meeting-types/${detail.id}`, {
      title,
      slug,
      landing_description: description.trim() === "" ? null : description,
      min_matched_slots: Number(minSlots),
      min_responses: minResponses.trim() === "" ? null : Number(minResponses)
    });

    if (!result.ok) {
      // Keep what was typed so the admin can fix just the problem.
      setError(result.error);
    } else {
      setSaved(true);
      await onChanged();
    }
    setSaving(false);
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-4 rounded-md border bg-white p-5">
      <h2 className="text-lg font-semibold">Details and settings</h2>

      <label className="grid gap-1.5">
        <span className="text-xs font-medium">Title</span>
        <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} required maxLength={120} className={inputClass} />
      </label>

      <label className="grid gap-1.5">
        <span className="text-xs font-medium">Link</span>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">/meet/</span>
          <input type="text" value={slug} onChange={(e) => setSlug(e.target.value)} required maxLength={60} className={`${inputClass} flex-1`} />
        </div>
      </label>

      <label className="grid gap-1.5">
        <span className="text-xs font-medium">Landing page text</span>
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={5} maxLength={2000} className={inputClass} />
        <span className="text-xs text-muted-foreground">Plain text, up to 2000 characters.</span>
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="grid gap-1.5">
          <span className="text-xs font-medium">Minimum matched time slots</span>
          <input type="number" value={minSlots} onChange={(e) => setMinSlots(e.target.value)} required min={1} step={1} className={inputClass} />
          <span className="text-xs text-muted-foreground">
            Times where every role can be filled before an admin is asked to review.
          </span>
        </label>
        <label className="grid gap-1.5">
          <span className="text-xs font-medium">Minimum responses (optional)</span>
          <input type="number" value={minResponses} onChange={(e) => setMinResponses(e.target.value)} min={1} step={1} placeholder="No minimum" className={inputClass} />
          <span className="text-xs text-muted-foreground">Leave empty for no minimum.</span>
        </label>
      </div>

      {error ? <p className={errorClass}>{error}</p> : null}
      {saved ? <p className="text-sm text-green-700">Saved.</p> : null}

      <div>
        <button type="submit" disabled={saving} className={primaryButtonClass}>
          {saving ? "Saving…" : "Save changes"}
        </button>
      </div>
    </form>
  );
}
