import { NextRequest, NextResponse } from "next/server";
import { createServiceSupabaseClient } from "@/lib/supabase";
import { getAuthenticatedAdminFromRequest } from "@/lib/auth";
import {
  firstZodMessage,
  isUuid,
  jsonError,
  respondDbError,
  updateDurationSchema
} from "@/lib/meeting-types";

type Context = { params: Promise<{ id: string; durationId: string }> };

// Reads/writes: meeting_type_durations
export async function PATCH(request: NextRequest, { params }: Context) {
  const admin = await getAuthenticatedAdminFromRequest(request);
  if (!admin) return jsonError("Unauthorized", 401);

  const { id, durationId } = await params;
  if (!isUuid(id) || !isUuid(durationId)) return jsonError("Duration not found", 404);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("Invalid JSON", 400);
  }

  const parsed = updateDurationSchema.safeParse(body);
  if (!parsed.success) return jsonError(firstZodMessage(parsed.error), 400);

  const supabase = createServiceSupabaseClient();
  const { data, error } = await supabase
    .from("meeting_type_durations")
    .update({ ...parsed.data, updated_at: new Date().toISOString() })
    .eq("id", durationId)
    .eq("meeting_type_id", id)
    .select()
    .maybeSingle();

  if (error) {
    return respondDbError(error, { duplicate: "This meeting type already has a duration with that name." });
  }
  if (!data) return jsonError("Duration not found", 404);

  return NextResponse.json({ duration: data });
}

// Reads: meeting_types, meeting_type_durations. Writes: meeting_type_durations
export async function DELETE(request: NextRequest, { params }: Context) {
  const admin = await getAuthenticatedAdminFromRequest(request);
  if (!admin) return jsonError("Unauthorized", 401);

  const { id, durationId } = await params;
  if (!isUuid(id) || !isUuid(durationId)) return jsonError("Duration not found", 404);

  const supabase = createServiceSupabaseClient();

  const { data: duration, error: findError } = await supabase
    .from("meeting_type_durations")
    .select("id")
    .eq("id", durationId)
    .eq("meeting_type_id", id)
    .maybeSingle();
  if (findError) return respondDbError(findError);
  if (!duration) return jsonError("Duration not found", 404);

  const { data: type, error: typeError } = await supabase
    .from("meeting_types")
    .select("is_active")
    .eq("id", id)
    .maybeSingle();
  if (typeError) return respondDbError(typeError);

  if (type?.is_active) {
    const { count, error: countError } = await supabase
      .from("meeting_type_durations")
      .select("id", { count: "exact", head: true })
      .eq("meeting_type_id", id);
    if (countError) return respondDbError(countError);
    if ((count ?? 0) <= 1) {
      return jsonError("A meeting type that is on needs at least one duration. Turn it off first.", 400);
    }
  }

  const { error } = await supabase
    .from("meeting_type_durations")
    .delete()
    .eq("id", durationId)
    .eq("meeting_type_id", id);

  if (error) {
    return respondDbError(error, { referenced: "This duration is already used by a request and can't be deleted." });
  }

  return NextResponse.json({ ok: true });
}
