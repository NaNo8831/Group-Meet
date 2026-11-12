"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase-client";

export default function AdminNav({ email }: { email: string }) {
  const router = useRouter();

  async function handleSignOut() {
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    router.push("/admin/login");
    router.refresh();
  }

  return (
    <header className="border-b border-gray-200 bg-white/80 backdrop-blur-sm">
      <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex items-center gap-6">
          <span className="text-sm font-medium text-gray-700">Group Meet Admin</span>
          <nav className="flex items-center gap-4 text-sm">
            <Link
              href="/admin/meeting-types"
              className="text-gray-600 transition-colors hover:text-gray-900"
            >
              Meeting types
            </Link>
            <Link
              href="/admin/professionals"
              className="text-gray-600 transition-colors hover:text-gray-900"
            >
              Professionals
            </Link>
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-500">{email}</span>
          <button
            onClick={handleSignOut}
            className="text-sm text-gray-600 hover:text-gray-900 underline underline-offset-2 transition-colors"
          >
            Sign out
          </button>
        </div>
      </div>
    </header>
  );
}
