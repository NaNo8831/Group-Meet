import { createClient } from "@supabase/supabase-js";

function readRequiredEnv(name: string) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

export function createPublicSupabaseClient() {
  return createClient(
    readRequiredEnv("NEXT_PUBLIC_SUPABASE_URL"),
    readRequiredEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
    {
      auth: {
        persistSession: false
      }
    }
  );
}

export function createServiceSupabaseClient() {
  return createClient(
    readRequiredEnv("NEXT_PUBLIC_SUPABASE_URL"),
    readRequiredEnv("SUPABASE_SERVICE_ROLE_KEY"),
    {
      auth: {
        persistSession: false
      }
    }
  );
}
