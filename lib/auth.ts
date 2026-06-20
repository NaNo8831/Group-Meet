import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { createServiceSupabaseClient } from "@/lib/supabase";

export interface Admin {
  id: string;
  auth_user_id: string | null;
  email: string;
  name: string | null;
  role: "admin" | "super_admin";
  is_active: boolean;
}

/**
 * Returns the authenticated admin record or null.
 * Reads role fresh from the admins table — does not trust the JWT role claim.
 */
export async function getAuthenticatedAdmin(): Promise<Admin | null> {
  const cookieStore = await cookies();
  const supabaseAuth = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // called from Server Component
          }
        }
      }
    }
  );

  const {
    data: { user }
  } = await supabaseAuth.auth.getUser();

  if (!user) return null;

  const service = createServiceSupabaseClient();

  // Match by auth_user_id first; fall back to email for the bootstrap case
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

    // Backfill auth_user_id on first successful email-based match
    if (admin && !admin.auth_user_id) {
      await service
        .from("admins")
        .update({ auth_user_id: user.id })
        .eq("id", admin.id);
      admin.auth_user_id = user.id;
    }
  }

  if (!admin) return null;
  if (!admin.is_active) return null;

  return admin as Admin;
}

/**
 * Returns the authenticated admin for use inside API route handlers.
 * Accepts the Request object and reads the cookie header directly.
 */
export async function getAuthenticatedAdminFromRequest(
  request: Request
): Promise<Admin | null> {
  const cookieHeader = request.headers.get("cookie") ?? "";
  const cookieStore = parseCookieHeader(cookieHeader);

  const supabaseAuth = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore;
        },
        setAll() {
          // API routes use NextResponse; cookie setting handled by middleware
        }
      }
    }
  );

  const {
    data: { user }
  } = await supabaseAuth.auth.getUser();

  if (!user) return null;

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
      admin.auth_user_id = user.id;
    }
  }

  if (!admin) return null;
  if (!admin.is_active) return null;

  return admin as Admin;
}

/** Returns true if the authenticated admin has the super_admin role. */
export async function isSuperAdmin(request: Request): Promise<boolean> {
  const admin = await getAuthenticatedAdminFromRequest(request);
  return admin?.role === "super_admin";
}

function parseCookieHeader(header: string): { name: string; value: string }[] {
  return header
    .split(";")
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => {
      const eqIndex = part.indexOf("=");
      if (eqIndex === -1) return { name: part, value: "" };
      return {
        name: part.slice(0, eqIndex).trim(),
        value: part.slice(eqIndex + 1).trim()
      };
    });
}
