import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { createServiceSupabaseClient } from "@/lib/supabase";
import { cookies } from "next/headers";

export async function GET(request: NextRequest) {
  const cookieHeader = request.headers.get("cookie") ?? "";
  const cookiePairs = cookieHeader
    .split(";")
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => {
      const eq = p.indexOf("=");
      return eq === -1
        ? { name: p, value: "" }
        : { name: p.slice(0, eq).trim(), value: p.slice(eq + 1).trim() };
    });

  const supabaseAuth = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookiePairs;
        },
        setAll() {}
      }
    }
  );

  const {
    data: { user }
  } = await supabaseAuth.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const service = createServiceSupabaseClient();

  let { data: admin } = await service
    .from("admins")
    .select("id, auth_user_id, email, name, role, is_active")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  if (!admin) {
    const { data: byEmail } = await service
      .from("admins")
      .select("id, auth_user_id, email, name, role, is_active")
      .eq("email", user.email!)
      .maybeSingle();
    admin = byEmail;

    if (admin && !admin.auth_user_id) {
      await service
        .from("admins")
        .update({ auth_user_id: user.id })
        .eq("id", admin.id);
    }
  }

  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!admin.is_active) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json({
    admin: {
      id: admin.id,
      email: admin.email,
      name: admin.name,
      role: admin.role
    }
  });
}
