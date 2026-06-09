// TODO: secure with admin auth (Sprint 006)

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createServiceSupabaseClient } from "@/lib/supabase";

const updateSchema = z
  .object({
    tier: z.enum(["in_depth", "general"]).optional(),
    is_active: z.boolean().optional()
  })
  .refine((data) => data.tier !== undefined || data.is_active !== undefined, {
    message: "At least one of tier or is_active is required"
  });

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
  }

  const supabase = createServiceSupabaseClient();

  const { data, error } = await supabase
    .from("professionals")
    .update({ ...parsed.data, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ professional: data });
}
