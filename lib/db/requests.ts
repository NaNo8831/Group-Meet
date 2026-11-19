import { createServiceSupabaseClient } from "@/lib/supabase";

// The data access module for client requests (Portability rule 1, Decision 071).
// This is the only place the new request code talks to the database. It exposes plain functions
// that return plain objects, with no Supabase types in the signatures, so the database behind
// it can change without touching routes or pages.
//
// Tables used: meeting_types, meeting_type_durations, platform_settings, requests, slots.
// Server only. Never import this from a client component.

const DEFAULT_TIMEZONE = "US/Eastern";

export interface PublicDuration {
  id: string;
  label: string;
  minutes: number;
}

export interface ActiveMeetingType {
  id: string;
  title: string;
  slug: string;
  landingDescription: string | null;
  durations: PublicDuration[];
}

export interface RequestListItem {
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

export interface NewRequest {
  meetingTypeId: string;
  durationId: string;
  clientName: string;
  clientEmail: string;
  businessTimezone: string;
  startsAt: string[];
}

type DurationRow = { id: string; meeting_type_id: string; label: string; minutes: number };
type TypeRow = { id: string; title: string; slug: string; landing_description: string | null };

function toDuration(row: DurationRow): PublicDuration {
  return { id: row.id, label: row.label, minutes: row.minutes };
}

/** The platform's business time zone, falling back to US/Eastern. */
export async function getBusinessTimezone(): Promise<string> {
  const supabase = createServiceSupabaseClient();
  const { data, error } = await supabase
    .from("platform_settings")
    .select("value")
    .eq("key", "business_timezone")
    .maybeSingle();

  if (error) throw error;
  const value = typeof data?.value === "string" ? data.value.trim() : "";
  return value || DEFAULT_TIMEZONE;
}

/** Active meeting types with their durations, for the home page. */
export async function listActiveMeetingTypes(): Promise<ActiveMeetingType[]> {
  const supabase = createServiceSupabaseClient();

  const { data: types, error } = await supabase
    .from("meeting_types")
    .select("id, title, slug, landing_description")
    .eq("is_active", true)
    .order("title");
  if (error) throw error;

  const typeRows = (types ?? []) as TypeRow[];
  if (typeRows.length === 0) return [];

  const { data: durations, error: durationError } = await supabase
    .from("meeting_type_durations")
    .select("id, meeting_type_id, label, minutes, sort_order")
    .in("meeting_type_id", typeRows.map((type) => type.id))
    .order("sort_order")
    .order("minutes");
  if (durationError) throw durationError;

  const byType = new Map<string, PublicDuration[]>();
  for (const row of (durations ?? []) as DurationRow[]) {
    const list = byType.get(row.meeting_type_id) ?? [];
    list.push(toDuration(row));
    byType.set(row.meeting_type_id, list);
  }

  return typeRows.map((type) => ({
    id: type.id,
    title: type.title,
    slug: type.slug,
    landingDescription: type.landing_description,
    durations: byType.get(type.id) ?? []
  }));
}

/** One active meeting type by its link, or null when the link is unknown or the type is switched off. */
export async function getActiveMeetingTypeBySlug(slug: string): Promise<ActiveMeetingType | null> {
  const supabase = createServiceSupabaseClient();

  const { data: type, error } = await supabase
    .from("meeting_types")
    .select("id, title, slug, landing_description")
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle();
  if (error) throw error;
  if (!type) return null;

  const { data: durations, error: durationError } = await supabase
    .from("meeting_type_durations")
    .select("id, meeting_type_id, label, minutes, sort_order")
    .eq("meeting_type_id", (type as TypeRow).id)
    .order("sort_order")
    .order("minutes");
  if (durationError) throw durationError;

  const row = type as TypeRow;
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    landingDescription: row.landing_description,
    durations: ((durations ?? []) as DurationRow[]).map(toDuration)
  };
}

/**
 * Saves a request and its slots. If the slots cannot be saved, the request just created is
 * removed again and the error is thrown, so a half-saved request is never left behind.
 */
export async function createRequestWithSlots(input: NewRequest): Promise<void> {
  const supabase = createServiceSupabaseClient();

  const { data: created, error } = await supabase
    .from("requests")
    .insert({
      client_name: input.clientName,
      client_email: input.clientEmail,
      meeting_type_id: input.meetingTypeId,
      duration_id: input.durationId,
      status: "pending",
      business_timezone: input.businessTimezone
    })
    .select("id")
    .single();
  if (error) throw error;

  const requestId = (created as { id: string }).id;

  const { error: slotError } = await supabase
    .from("slots")
    .insert(input.startsAt.map((startsAt) => ({ request_id: requestId, starts_at: startsAt })));

  if (slotError) {
    await supabase.from("requests").delete().eq("id", requestId);
    throw slotError;
  }
}

/** The latest requests with their slots, meeting type, and duration. Joined here, not in the database. */
export async function listRecentRequests(limit = 100): Promise<RequestListItem[]> {
  const supabase = createServiceSupabaseClient();

  const { data: requests, error } = await supabase
    .from("requests")
    .select("id, client_name, client_email, status, created_at, business_timezone, meeting_type_id, duration_id")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;

  type RequestRow = {
    id: string;
    client_name: string;
    client_email: string;
    status: string;
    created_at: string;
    business_timezone: string;
    meeting_type_id: string;
    duration_id: string;
  };
  const rows = (requests ?? []) as RequestRow[];
  if (rows.length === 0) return [];

  const requestIds = rows.map((row) => row.id);
  const typeIds = Array.from(new Set(rows.map((row) => row.meeting_type_id)));
  const durationIds = Array.from(new Set(rows.map((row) => row.duration_id)));

  const [slotsRes, typesRes, durationsRes] = await Promise.all([
    supabase.from("slots").select("request_id, starts_at").in("request_id", requestIds).order("starts_at"),
    supabase.from("meeting_types").select("id, title, slug").in("id", typeIds),
    supabase.from("meeting_type_durations").select("id, label, minutes").in("id", durationIds)
  ]);
  for (const res of [slotsRes, typesRes, durationsRes]) {
    if (res.error) throw res.error;
  }

  const slotsByRequest = new Map<string, string[]>();
  for (const slot of (slotsRes.data ?? []) as { request_id: string; starts_at: string }[]) {
    const list = slotsByRequest.get(slot.request_id) ?? [];
    list.push(slot.starts_at);
    slotsByRequest.set(slot.request_id, list);
  }
  const types = new Map(
    ((typesRes.data ?? []) as { id: string; title: string; slug: string }[]).map((type) => [type.id, type])
  );
  const durations = new Map(
    ((durationsRes.data ?? []) as { id: string; label: string; minutes: number }[]).map((duration) => [
      duration.id,
      duration
    ])
  );

  return rows.map((row) => {
    const type = types.get(row.meeting_type_id);
    const duration = durations.get(row.duration_id);
    return {
      id: row.id,
      clientName: row.client_name,
      clientEmail: row.client_email,
      status: row.status,
      createdAt: row.created_at,
      businessTimezone: row.business_timezone,
      meetingType: type ? { title: type.title, slug: type.slug } : null,
      duration: duration ? { label: duration.label, minutes: duration.minutes } : null,
      slots: slotsByRequest.get(row.id) ?? []
    };
  });
}
