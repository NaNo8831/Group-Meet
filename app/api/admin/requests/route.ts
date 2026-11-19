import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedAdminFromRequest } from "@/lib/auth";
import { listRecentRequests } from "@/lib/db/requests";

// Admin and Super Admin only. Read-only list of the latest client requests (Decision 068).
// Reads: requests, slots, meeting_types, meeting_type_durations (through lib/db/requests).
export async function GET(request: NextRequest) {
  const admin = await getAuthenticatedAdminFromRequest(request);
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const requests = await listRecentRequests(100);
    return NextResponse.json({ requests });
  } catch (error) {
    const detail = error as { code?: string; message?: string };
    console.error("Listing requests failed:", detail.code, detail.message);
    return NextResponse.json({ error: "Could not load requests. Please try again." }, { status: 500 });
  }
}
