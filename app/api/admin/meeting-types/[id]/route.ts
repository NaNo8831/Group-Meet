import { NextRequest, NextResponse } from "next/server";
import { createServiceSupabaseClient } from "@/lib/supabase";
import { getAuthenticatedAdminFromRequest } from "@/lib/auth";
import {
  firstZodMessage,
  isUuid,
  jsonError,
  loadMeetingTypeDetail,
  respondDbError,
  updateMeetingTypeSchema
} from "@/lib/meeting-types";

type Context = { params: Promise<{ id: string }> };

// Reads: meeting_types, meeting_type_durations, meeting_type_roles, meeting_type_pool,
//        meeting_type_pool_roles, professionals (names for the pool)
export async function GET(request: NextRequest, { params }: Context) {
  const admin = await getAuthenticatedAdminFromRequest(request);
  if (!admin) return jsonError("Unauthorized", 401);

  const { id } = await params;
  if (!isUuid(id)) return jsonError("Meeting type not found", 404);

  try {
    const detail = await loadMeetingTypeDetail(createServiceSupabaseClient(), id);
    if (!detail) return jsonError("Meeting type not found", 404);
    return NextResponse.json({ meeting_type: detail });
  } catch (error) {
    return respondDbError(error as { code?: string; message?: string });
  }
}

// Writes: meeting_types
export async function PATCH(request: NextRequest, { params }: Context) {
  const admin = await getAuthenticatedAdminFromRequest(request);
  if (!admin) return jsonError("Unauthorized", 401);

  const { id } = await params;
  if (!isUuid(id)) return jsonError("Meeting type not found", 404);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("Invalid JSON", 400);
  }

  const parsed = updateMeetingTypeSchema.safeParse(body);
  if (!parsed.success) return jsonError(firstZodMessage(parsed.error), 400);

  const supabase = createServiceSupabaseClient();

  try {
    const current = await loadMeetingTypeDetail(supabase, id);
    if (!current) return jsonError("Meeting type not found", 404);

    // Switching a type on needs at least one duration and one role.
    if (parsed.data.is_active === true && !current.readiness.canActivate) {
      return jsonError("Add at least one duration and one role before turning this meeting type on.", 400);
    }
  } catch (error) {
    return respondDbError(error as { code?: string; message?: string });
  }

  const update: Record<string, unknown> = { ...parsed.data, updated_at: new Date().toISOString() };
  if (typeof parsed.data.landing_description === "string") {
    update.landing_description = parsed.data.landing_description.trim() || null;
  }

  const { data, error } = await supabase
    .from("meeting_types")
    .update(update)
    .eq("id", id)
    .select("id")
    .maybeSingle();

  if (error) {
    return respondDbError(error, {
      duplicate: "A meeting type with that link already exists. Choose a different link."
    });
  }
  if (!data) return jsonError("Meeting type not found", 404);

  try {
    const detail = await loadMeetingTypeDetail(supabase, id);
    return NextResponse.json({ meeting_type: detail });
  } catch (loadError) {
    return respondDbError(loadError as { code?: string; message?: string });
  }
}
