import { NextRequest, NextResponse } from "next/server";
import { createServiceSupabaseClient } from "@/lib/supabase";
import { getAuthenticatedAdminFromRequest } from "@/lib/auth";
import {
  firstZodMessage,
  isUuid,
  jsonError,
  respondDbError,
  updateRoleSchema
} from "@/lib/meeting-types";

type Context = { params: Promise<{ id: string; roleId: string }> };

// Reads/writes: meeting_type_roles
export async function PATCH(request: NextRequest, { params }: Context) {
  const admin = await getAuthenticatedAdminFromRequest(request);
  if (!admin) return jsonError("Unauthorized", 401);

  const { id, roleId } = await params;
  if (!isUuid(id) || !isUuid(roleId)) return jsonError("Role not found", 404);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("Invalid JSON", 400);
  }

  const parsed = updateRoleSchema.safeParse(body);
  if (!parsed.success) return jsonError(firstZodMessage(parsed.error), 400);

  const supabase = createServiceSupabaseClient();
  const { data, error } = await supabase
    .from("meeting_type_roles")
    .update({ ...parsed.data, updated_at: new Date().toISOString() })
    .eq("id", roleId)
    .eq("meeting_type_id", id)
    .select()
    .maybeSingle();

  if (error) {
    return respondDbError(error, { duplicate: "This meeting type already has a role with that name." });
  }
  if (!data) return jsonError("Role not found", 404);

  return NextResponse.json({ role: data });
}

// Reads: meeting_types, meeting_type_roles. Writes: meeting_type_roles (pool role links are removed by cascade)
export async function DELETE(request: NextRequest, { params }: Context) {
  const admin = await getAuthenticatedAdminFromRequest(request);
  if (!admin) return jsonError("Unauthorized", 401);

  const { id, roleId } = await params;
  if (!isUuid(id) || !isUuid(roleId)) return jsonError("Role not found", 404);

  const supabase = createServiceSupabaseClient();

  const { data: role, error: findError } = await supabase
    .from("meeting_type_roles")
    .select("id")
    .eq("id", roleId)
    .eq("meeting_type_id", id)
    .maybeSingle();
  if (findError) return respondDbError(findError);
  if (!role) return jsonError("Role not found", 404);

  const { data: type, error: typeError } = await supabase
    .from("meeting_types")
    .select("is_active")
    .eq("id", id)
    .maybeSingle();
  if (typeError) return respondDbError(typeError);

  if (type?.is_active) {
    const { count, error: countError } = await supabase
      .from("meeting_type_roles")
      .select("id", { count: "exact", head: true })
      .eq("meeting_type_id", id);
    if (countError) return respondDbError(countError);
    if ((count ?? 0) <= 1) {
      return jsonError("A meeting type that is on needs at least one role. Turn it off first.", 400);
    }
  }

  const { error } = await supabase
    .from("meeting_type_roles")
    .delete()
    .eq("id", roleId)
    .eq("meeting_type_id", id);

  if (error) return respondDbError(error);

  return NextResponse.json({ ok: true });
}
