import { NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";

// ---------------------------------------------------------------------------
// Types (rows as stored in the database; snake_case, like the roster API)
// ---------------------------------------------------------------------------

export interface MeetingType {
  id: string;
  title: string;
  slug: string;
  landing_description: string | null;
  is_active: boolean;
  min_matched_slots: number;
  min_responses: number | null;
  created_by_admin_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface MeetingTypeDuration {
  id: string;
  meeting_type_id: string;
  label: string;
  minutes: number;
  sort_order: number;
}

export interface MeetingTypeRole {
  id: string;
  meeting_type_id: string;
  name: string;
  required_count: number;
  sort_order: number;
}

export interface PoolEntry {
  professional_id: string;
  name: string;
  email: string;
  is_active: boolean;
  role_ids: string[];
}

export interface RoleCoverage {
  roleId: string;
  name: string;
  needed: number;
  available: number;
}

export interface Readiness {
  hasDuration: boolean;
  hasRole: boolean;
  canActivate: boolean;
  roleCoverage: RoleCoverage[];
}

export interface MeetingTypeDetail extends MeetingType {
  durations: MeetingTypeDuration[];
  roles: MeetingTypeRole[];
  pool: PoolEntry[];
  readiness: Readiness;
}

// ---------------------------------------------------------------------------
// Slugs
// ---------------------------------------------------------------------------

const SLUG_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;

/** "In-Depth Intro, Part 2!" -> "in-depth-intro-part-2" */
export function slugify(title: string): string {
  return title
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60)
    .replace(/-+$/g, "");
}

// ---------------------------------------------------------------------------
// Validation schemas
// ---------------------------------------------------------------------------

export const slugSchema = z
  .string()
  .trim()
  .min(3, "Link must be at least 3 characters")
  .max(60, "Link must be 60 characters or fewer")
  .regex(SLUG_PATTERN, "Link may only use lowercase letters, numbers, and single hyphens");

const titleSchema = z
  .string()
  .trim()
  .min(1, "Title is required")
  .max(120, "Title must be 120 characters or fewer");

const descriptionSchema = z
  .string()
  .max(2000, "Description must be 2000 characters or fewer")
  .nullable();

export const createMeetingTypeSchema = z.object({
  title: titleSchema,
  slug: slugSchema.optional(),
  landing_description: descriptionSchema.optional()
});

export const updateMeetingTypeSchema = z
  .object({
    title: titleSchema.optional(),
    slug: slugSchema.optional(),
    landing_description: descriptionSchema.optional(),
    is_active: z.boolean().optional(),
    min_matched_slots: z.number().int("Minimum matched slots must be a whole number").min(1, "Minimum matched slots must be at least 1").optional(),
    min_responses: z
      .number()
      .int("Minimum responses must be a whole number")
      .min(1, "Minimum responses must be at least 1")
      .nullable()
      .optional()
  })
  .refine((data) => Object.values(data).some((value) => value !== undefined), {
    message: "At least one field is required"
  });

const durationFields = {
  label: z.string().trim().min(1, "Label is required").max(40, "Label must be 40 characters or fewer"),
  minutes: z
    .number()
    .int("Minutes must be a whole number")
    .min(5, "Minutes must be at least 5")
    .max(480, "Minutes must be 480 or fewer")
    .refine((value) => value % 5 === 0, "Minutes must be a multiple of 5"),
  sort_order: z.number().int().optional()
};

export const createDurationSchema = z.object(durationFields);

export const updateDurationSchema = z
  .object({
    label: durationFields.label.optional(),
    minutes: durationFields.minutes.optional(),
    sort_order: durationFields.sort_order
  })
  .refine((data) => Object.values(data).some((value) => value !== undefined), {
    message: "At least one field is required"
  });

const roleFields = {
  name: z.string().trim().min(1, "Role name is required").max(40, "Role name must be 40 characters or fewer"),
  required_count: z.number().int("Required count must be a whole number").min(1, "Required count must be at least 1"),
  sort_order: z.number().int().optional()
};

export const createRoleSchema = z.object({
  name: roleFields.name,
  required_count: roleFields.required_count.optional().default(1),
  sort_order: roleFields.sort_order
});

export const updateRoleSchema = z
  .object({
    name: roleFields.name.optional(),
    required_count: roleFields.required_count.optional(),
    sort_order: roleFields.sort_order
  })
  .refine((data) => Object.values(data).some((value) => value !== undefined), {
    message: "At least one field is required"
  });

export const poolEntrySchema = z.object({
  role_ids: z.array(z.string().uuid("Each role id must be a valid id")).max(50)
});

// ---------------------------------------------------------------------------
// Readiness (what the editor shows before a type is switched on)
// ---------------------------------------------------------------------------

export function computeReadiness(
  durations: Pick<MeetingTypeDuration, "id">[],
  roles: MeetingTypeRole[],
  pool: PoolEntry[]
): Readiness {
  const hasDuration = durations.length > 0;
  const hasRole = roles.length > 0;
  const roleCoverage = roles.map((role) => ({
    roleId: role.id,
    name: role.name,
    needed: role.required_count,
    available: pool.filter((entry) => entry.is_active && entry.role_ids.includes(role.id)).length
  }));
  return { hasDuration, hasRole, canActivate: hasDuration && hasRole, roleCoverage };
}

// ---------------------------------------------------------------------------
// Server helpers
// ---------------------------------------------------------------------------

export function isUuid(value: string): boolean {
  return z.string().uuid().safeParse(value).success;
}

type PoolRow = {
  professional_id: string;
  professionals:
    | { id: string; name: string; email: string; is_active: boolean }
    | { id: string; name: string; email: string; is_active: boolean }[]
    | null;
};

/** Loads one meeting type with durations, roles, pool, and readiness. Returns null when not found. Throws on database errors. */
export async function loadMeetingTypeDetail(
  supabase: SupabaseClient,
  id: string
): Promise<MeetingTypeDetail | null> {
  const { data: type, error: typeError } = await supabase
    .from("meeting_types")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (typeError) throw typeError;
  if (!type) return null;

  const [durationsRes, rolesRes, poolRes, poolRolesRes] = await Promise.all([
    supabase.from("meeting_type_durations").select("*").eq("meeting_type_id", id).order("sort_order").order("minutes"),
    supabase.from("meeting_type_roles").select("*").eq("meeting_type_id", id).order("sort_order").order("name"),
    supabase
      .from("meeting_type_pool")
      .select("professional_id, professionals(id, name, email, is_active)")
      .eq("meeting_type_id", id),
    supabase.from("meeting_type_pool_roles").select("professional_id, role_id").eq("meeting_type_id", id)
  ]);

  for (const res of [durationsRes, rolesRes, poolRes, poolRolesRes]) {
    if (res.error) throw res.error;
  }

  const durations = (durationsRes.data ?? []) as MeetingTypeDuration[];
  const roles = (rolesRes.data ?? []) as MeetingTypeRole[];
  const roleIdsByProfessional = new Map<string, string[]>();
  for (const row of (poolRolesRes.data ?? []) as { professional_id: string; role_id: string }[]) {
    const list = roleIdsByProfessional.get(row.professional_id) ?? [];
    list.push(row.role_id);
    roleIdsByProfessional.set(row.professional_id, list);
  }

  const pool: PoolEntry[] = ((poolRes.data ?? []) as unknown as PoolRow[])
    .map((row) => {
      const professional = Array.isArray(row.professionals) ? row.professionals[0] : row.professionals;
      if (!professional) return null;
      return {
        professional_id: row.professional_id,
        name: professional.name,
        email: professional.email,
        is_active: professional.is_active,
        role_ids: roleIdsByProfessional.get(row.professional_id) ?? []
      };
    })
    .filter((entry): entry is PoolEntry => entry !== null)
    .sort((a, b) => a.name.localeCompare(b.name));

  return {
    ...(type as MeetingType),
    durations,
    roles,
    pool,
    readiness: computeReadiness(durations, roles, pool)
  };
}

/** Plain JSON error in the same shape the roster API uses. */
export function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

/**
 * Maps a database error to a plain response. 23505 (duplicate) and 23503 (still referenced)
 * become 409 with the supplied messages; anything else is logged and returned as a generic 500.
 */
export function respondDbError(
  error: { code?: string; message?: string },
  messages: { duplicate?: string; referenced?: string } = {}
) {
  if (error.code === "23505") {
    return jsonError(messages.duplicate ?? "That already exists.", 409);
  }
  if (error.code === "23503") {
    return jsonError(messages.referenced ?? "That is still in use.", 409);
  }
  console.error("Meeting type database error:", error.code, error.message);
  return jsonError("Something went wrong saving that. Please try again.", 500);
}

export function firstZodMessage(error: z.ZodError): string {
  return error.errors[0]?.message ?? "Invalid input";
}
