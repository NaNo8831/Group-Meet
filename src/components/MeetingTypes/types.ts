// Client-side shapes for the meeting type admin screens.
// These mirror the JSON returned by /api/admin/meeting-types. They are kept separate from
// lib/meeting-types.ts, which imports server-only code and must not be bundled into the browser.

export interface MeetingTypeDuration {
  id: string
  meeting_type_id: string
  label: string
  minutes: number
  sort_order: number
}

export interface MeetingTypeRole {
  id: string
  meeting_type_id: string
  name: string
  required_count: number
  sort_order: number
}

export interface PoolEntry {
  professional_id: string
  name: string
  email: string
  is_active: boolean
  role_ids: string[]
}

export interface RoleCoverage {
  roleId: string
  name: string
  needed: number
  available: number
}

export interface Readiness {
  hasDuration: boolean
  hasRole: boolean
  canActivate: boolean
  roleCoverage: RoleCoverage[]
}

export interface MeetingTypeSummary {
  id: string
  title: string
  slug: string
  is_active: boolean
  durations: { id: string; label: string; minutes: number }[]
  roles: { id: string; name: string; required_count: number }[]
  pool_size: number
}

export interface MeetingTypeDetail {
  id: string
  title: string
  slug: string
  landing_description: string | null
  is_active: boolean
  min_matched_slots: number
  min_responses: number | null
  durations: MeetingTypeDuration[]
  roles: MeetingTypeRole[]
  pool: PoolEntry[]
  readiness: Readiness
}

export interface RosterProfessional {
  id: string
  name: string
  email: string
  is_active: boolean
}

export type RequestResult<T> = { ok: true; data: T } | { ok: false; error: string }

/** Sends a JSON request to the admin API and returns either the data or a plain error message. */
export async function sendJson<T = unknown>(
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE",
  url: string,
  body?: unknown
): Promise<RequestResult<T>> {
  try {
    const res = await fetch(url, {
      method,
      headers: body === undefined ? undefined : { "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body)
    })
    const payload = (await res.json().catch(() => null)) as (T & { error?: string }) | null
    if (!res.ok) {
      return { ok: false, error: payload?.error ?? "Something went wrong. Please try again." }
    }
    return { ok: true, data: payload as T }
  } catch {
    return { ok: false, error: "Could not reach the server. Check your connection and try again." }
  }
}

/** Same rules as the server's slugify: "In-Depth Intro, Part 2!" becomes "in-depth-intro-part-2". */
export function slugifyTitle(title: string): string {
  return title
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60)
    .replace(/-+$/g, "")
}

export const errorClass =
  "rounded-md border border-destructive/25 bg-destructive/10 px-3 py-2 text-sm text-destructive"
export const inputClass =
  "rounded-md border bg-white px-3 py-2 text-sm outline-none transition focus:ring-2 focus:ring-ring"
export const primaryButtonClass =
  "inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:opacity-95 disabled:opacity-60"
export const smallButtonClass =
  "rounded-md border px-2 py-1 text-xs transition hover:bg-muted disabled:opacity-60"
