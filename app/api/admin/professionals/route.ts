// TODO: secure with admin auth (Sprint 006)

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createServiceSupabaseClient } from "@/lib/supabase";

const createSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Valid email is required"),
  tier: z.enum(["in_depth", "general"]).optional().default("general")
});

export async function GET() {
  const supabase = createServiceSupabaseClient();

  const { data, error } = await supabase
    .from("professionals")
    .select("*")
    .order("name");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ professionals: data });
}

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
  }

  const supabase = createServiceSupabaseClient();

  const { data, error } = await supabase
    .from("professionals")
    .insert({
      name: parsed.data.name,
      email: parsed.data.email,
      tier: parsed.data.tier
    })
    .select()
    .single();

  if (error) {
    const message = error.code === "23505" ? "A professional with that email already exists." : error.message;
    return NextResponse.json({ error: message }, { status: error.code === "23505" ? 409 : 500 });
  }

  return NextResponse.json({ professional: data }, { status: 201 });
}
