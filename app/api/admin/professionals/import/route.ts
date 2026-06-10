import { NextRequest, NextResponse } from "next/server";
import { createServiceSupabaseClient } from "@/lib/supabase";
import { getAuthenticatedAdminFromRequest } from "@/lib/auth";

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function parseCsv(text: string): { name: string; email: string }[] {
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  if (lines.length < 2) return [];

  const headers = lines[0].split(",").map((h) => h.trim().toLowerCase().replace(/["']/g, ""));
  const nameIndex = headers.indexOf("name");
  const emailIndex = headers.indexOf("email");

  if (nameIndex === -1 || emailIndex === -1) return [];

  return lines.slice(1).map((line) => {
    const cols = line.split(",").map((c) => c.trim().replace(/^["']|["']$/g, ""));
    return {
      name: cols[nameIndex] ?? "",
      email: cols[emailIndex] ?? ""
    };
  });
}

export async function POST(request: NextRequest) {
  const admin = await getAuthenticatedAdminFromRequest(request);
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let file: File | null = null;
  try {
    const formData = await request.formData();
    file = formData.get("file") as File | null;
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  const text = await file.text();
  const rows = parseCsv(text);

  if (rows.length === 0) {
    return NextResponse.json(
      { error: "CSV must include name and email columns with at least one data row" },
      { status: 400 }
    );
  }

  const supabase = createServiceSupabaseClient();

  const { data: existingRows } = await supabase
    .from("professionals")
    .select("email");

  const existingEmails = new Set((existingRows ?? []).map((r: { email: string }) => r.email.toLowerCase()));

  const toInsert: { name: string; email: string; tier: string; is_active: boolean }[] = [];
  const errors: string[] = [];
  let skipped = 0;

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rowLabel = `Row ${i + 2}`;

    if (!row.name) {
      errors.push(`${rowLabel}: missing name`);
      continue;
    }
    if (!row.email || !isValidEmail(row.email)) {
      errors.push(`${rowLabel}: invalid or missing email`);
      continue;
    }
    if (existingEmails.has(row.email.toLowerCase())) {
      skipped += 1;
      continue;
    }

    existingEmails.add(row.email.toLowerCase());
    toInsert.push({ name: row.name, email: row.email, tier: "general", is_active: true });
  }

  let imported = 0;
  if (toInsert.length > 0) {
    const { error: insertError } = await supabase.from("professionals").insert(toInsert);
    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }
    imported = toInsert.length;
  }

  return NextResponse.json({ imported, skipped, errors });
}
