import { NextRequest, NextResponse } from "next/server";
import { createServiceSupabaseClient } from "@/lib/supabase";
import { getAuthenticatedAdminFromRequest } from "@/lib/auth";
import {
  createMeetingTypeSchema,
  firstZodMessage,
  jsonError,
  respondDbError,
  slugSchema,
  slugify
} from "@/lib/meeting-types";

type ListRow = {
  id: string;
  meeting_type_durations: { id: string; label: string; minutes: number; sort_order: number }[];
  meeting_type_roles: { id: string; name: string; required_count: number; sort_order: number }[];
  meeting_type_pool: { professional_id: string }[];
  [key: string]: unknown;
};

// Reads: meeting_types, meeting_type_durations, meeting_type_roles, meeting_type_pool
export async function GET(request: NextRequest) {
  const admin = await getAuthenticatedAdminFromRequest(request);
  if (!admin) return jsonError("Unauthorized", 401);

  const supabase = createServiceSupabaseClient();
  const { data, error } = await supabase
    .from("meeting_types")
    .select(
      "*, meeting_type_durations(id, label, minutes, sort_order), meeting_type_roles(id, name, required_count, sort_order), meeting_type_pool(professional_id)"
    )
    .order("title");

  if (error) return respondDbError(error);

  const meetingTypes = ((data ?? []) as unknown as ListRow[]).map((row) => {
    const { meeting_type_durations, meeting_type_roles, meeting_type_pool, ...type } = row;
    return {
      ...type,
      durations: [...meeting_type_durations].sort((a, b) => a.sort_order - b.sort_order || a.minutes - b.minutes),
      roles: [...meeting_type_roles].sort((a, b) => a.sort_order - b.sort_order || a.name.localeCompare(b.name)),
      pool_size: meeting_type_pool.length
    };
  });

  return NextResponse.json({ meeting_types: meetingTypes });
}

// Writes: meeting_types (always created inactive)
export async function POST(request: NextRequest) {
  const admin = await getAuthenticatedAdminFromRequest(request);
  if (!admin) return jsonError("Unauthorized", 401);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("Invalid JSON", 400);
  }

  const parsed = createMeetingTypeSchema.safeParse(body);
  if (!parsed.success) return jsonError(firstZodMessage(parsed.error), 400);

  const slugResult = slugSchema.safeParse(parsed.data.slug ?? slugify(parsed.data.title));
  if (!slugResult.success) {
    return jsonError(
      "A link could not be made from that title. Enter a link of at least 3 letters or numbers.",
      400
    );
  }

  const description = parsed.data.landing_description?.trim() || null;

  const supabase = createServiceSupabaseClient();
  const { data, error } = await supabase
    .from("meeting_types")
    .insert({
      title: parsed.data.title,
      slug: slugResult.data,
      landing_description: description,
      is_active: false,
      created_by_admin_id: admin.id
    })
    .select()
    .single();

  if (error) {
    return respondDbError(error, {
      duplicate: "A meeting type with that link already exists. Choose a different link."
    });
  }

  return NextResponse.json({ meeting_type: data }, { status: 201 });
}
