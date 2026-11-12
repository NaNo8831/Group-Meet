import { NextRequest, NextResponse } from "next/server";
import { createServiceSupabaseClient } from "@/lib/supabase";
import { getAuthenticatedAdminFromRequest } from "@/lib/auth";
import {
  firstZodMessage,
  isUuid,
  jsonError,
  poolEntrySchema,
  respondDbError,
  type PoolEntry
} from "@/lib/meeting-types";

type Context = { params: Promise<{ id: string; professionalId: string }> };

// Reads: meeting_types, professionals, meeting_type_roles, meeting_type_pool, meeting_type_pool_roles
// Writes: meeting_type_pool, meeting_type_pool_roles
//
// PUT sets which roles this professional can fill for this meeting type.
// An empty role_ids array removes the professional from the pool.
export async function PUT(request: NextRequest, { params }: Context) {
  const admin = await getAuthenticatedAdminFromRequest(request);
  if (!admin) return jsonError("Unauthorized", 401);

  const { id, professionalId } = await params;
  if (!isUuid(id)) return jsonError("Meeting type not found", 404);
  if (!isUuid(professionalId)) return jsonError("Professional not found", 404);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("Invalid JSON", 400);
  }

  const parsed = poolEntrySchema.safeParse(body);
  if (!parsed.success) return jsonError(firstZodMessage(parsed.error), 400);

  const roleIds = Array.from(new Set(parsed.data.role_ids));
  const supabase = createServiceSupabaseClient();

  const { data: type, error: typeError } = await supabase
    .from("meeting_types")
    .select("id")
    .eq("id", id)
    .maybeSingle();
  if (typeError) return respondDbError(typeError);
  if (!type) return jsonError("Meeting type not found", 404);

  // No roles selected: remove the professional from the pool.
  if (roleIds.length === 0) {
    const { error } = await supabase
      .from("meeting_type_pool")
      .delete()
      .eq("meeting_type_id", id)
      .eq("professional_id", professionalId);
    if (error) return respondDbError(error);
    return NextResponse.json({ entry: null });
  }

  const { data: professional, error: professionalError } = await supabase
    .from("professionals")
    .select("id, name, email, is_active")
    .eq("id", professionalId)
    .maybeSingle();
  if (professionalError) return respondDbError(professionalError);
  if (!professional) return jsonError("Professional not found", 404);

  const { data: existing, error: existingError } = await supabase
    .from("meeting_type_pool")
    .select("professional_id")
    .eq("meeting_type_id", id)
    .eq("professional_id", professionalId)
    .maybeSingle();
  if (existingError) return respondDbError(existingError);

  // Only active professionals can be added; one already in the pool can still be edited.
  if (!existing && !professional.is_active) {
    return jsonError("Only active professionals can be added to a pool.", 400);
  }

  // Every role must belong to this meeting type.
  const { data: validRoles, error: rolesError } = await supabase
    .from("meeting_type_roles")
    .select("id")
    .eq("meeting_type_id", id)
    .in("id", roleIds);
  if (rolesError) return respondDbError(rolesError);
  if ((validRoles ?? []).length !== roleIds.length) {
    return jsonError("One or more roles don't belong to this meeting type.", 400);
  }

  const { error: poolError } = await supabase
    .from("meeting_type_pool")
    .upsert(
      { meeting_type_id: id, professional_id: professionalId },
      { onConflict: "meeting_type_id,professional_id", ignoreDuplicates: true }
    );
  if (poolError) return respondDbError(poolError);

  const { data: currentRoles, error: currentError } = await supabase
    .from("meeting_type_pool_roles")
    .select("role_id")
    .eq("meeting_type_id", id)
    .eq("professional_id", professionalId);
  if (currentError) return respondDbError(currentError);

  const currentIds = new Set((currentRoles ?? []).map((row: { role_id: string }) => row.role_id));
  const toAdd = roleIds.filter((roleId) => !currentIds.has(roleId));
  const toRemove = Array.from(currentIds).filter((roleId) => !roleIds.includes(roleId));

  // Add first, then remove, so a failure in the middle never leaves the entry with no roles.
  if (toAdd.length > 0) {
    const { error } = await supabase.from("meeting_type_pool_roles").insert(
      toAdd.map((roleId) => ({ meeting_type_id: id, professional_id: professionalId, role_id: roleId }))
    );
    if (error) return respondDbError(error);
  }

  if (toRemove.length > 0) {
    const { error } = await supabase
      .from("meeting_type_pool_roles")
      .delete()
      .eq("meeting_type_id", id)
      .eq("professional_id", professionalId)
      .in("role_id", toRemove);
    if (error) return respondDbError(error);
  }

  const entry: PoolEntry = {
    professional_id: professional.id,
    name: professional.name,
    email: professional.email,
    is_active: professional.is_active,
    role_ids: roleIds
  };

  return NextResponse.json({ entry });
}

// Writes: meeting_type_pool (role links are removed by cascade)
export async function DELETE(request: NextRequest, { params }: Context) {
  const admin = await getAuthenticatedAdminFromRequest(request);
  if (!admin) return jsonError("Unauthorized", 401);

  const { id, professionalId } = await params;
  if (!isUuid(id)) return jsonError("Meeting type not found", 404);
  if (!isUuid(professionalId)) return jsonError("Professional not found", 404);

  const supabase = createServiceSupabaseClient();
  const { error } = await supabase
    .from("meeting_type_pool")
    .delete()
    .eq("meeting_type_id", id)
    .eq("professional_id", professionalId);

  if (error) return respondDbError(error);

  return NextResponse.json({ ok: true });
}
