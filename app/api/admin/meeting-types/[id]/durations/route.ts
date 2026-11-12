import { NextRequest, NextResponse } from "next/server";
import { createServiceSupabaseClient } from "@/lib/supabase";
import { getAuthenticatedAdminFromRequest } from "@/lib/auth";
import {
  createDurationSchema,
  firstZodMessage,
  isUuid,
  jsonError,
  respondDbError
} from "@/lib/meeting-types";

type Context = { params: Promise<{ id: string }> };

// Reads: meeting_types, meeting_type_durations. Writes: meeting_type_durations
export async function POST(request: NextRequest, { params }: Context) {
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

  const parsed = createDurationSchema.safeParse(body);
  if (!parsed.success) return jsonError(firstZodMessage(parsed.error), 400);

  const supabase = createServiceSupabaseClient();

  const { data: type, error: typeError } = await supabase
    .from("meeting_types")
    .select("id")
    .eq("id", id)
    .maybeSingle();
  if (typeError) return respondDbError(typeError);
  if (!type) return jsonError("Meeting type not found", 404);

  let sortOrder = parsed.data.sort_order;
  if (sortOrder === undefined) {
    const { data: last, error: lastError } = await supabase
      .from("meeting_type_durations")
      .select("sort_order")
      .eq("meeting_type_id", id)
      .order("sort_order", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (lastError) return respondDbError(lastError);
    sortOrder = last ? last.sort_order + 1 : 0;
  }

  const { data, error } = await supabase
    .from("meeting_type_durations")
    .insert({
      meeting_type_id: id,
      label: parsed.data.label,
      minutes: parsed.data.minutes,
      sort_order: sortOrder
    })
    .select()
    .single();

  if (error) {
    return respondDbError(error, { duplicate: "This meeting type already has a duration with that name." });
  }

  return NextResponse.json({ duration: data }, { status: 201 });
}
