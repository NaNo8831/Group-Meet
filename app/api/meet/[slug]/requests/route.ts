import { NextRequest, NextResponse } from "next/server";
import {
  createRequestWithSlots,
  getActiveMeetingTypeBySlug,
  getBusinessTimezone
} from "@/lib/db/requests";
import { createRequestSchema } from "@/lib/requests";
import { validateSlots } from "@/lib/slot-rules";

type Context = { params: Promise<{ slug: string }> };

function plainError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

// Public: no sign-in. A client asks for a meeting of one active meeting type.
// Every rejection below happens BEFORE anything is written to the database.
// Reads: meeting_types, meeting_type_durations, platform_settings. Writes: requests, slots.
export async function POST(request: NextRequest, { params }: Context) {
  const { slug } = await params;

  // 1. Parse and validate the body.
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return plainError("Invalid request.", 400);
  }

  const parsed = createRequestSchema.safeParse(body);
  if (!parsed.success) {
    return plainError(parsed.error.issues[0]?.message ?? "Invalid request.", 400);
  }
  const input = parsed.data;

  // 2. Hidden trap field: a person leaves it empty. If filled, pretend it worked and save nothing.
  if (input.website && input.website.trim() !== "") {
    return NextResponse.json({ ok: true }, { status: 200 });
  }

  try {
    // 3. The meeting type must exist and be switched on.
    const meetingType = await getActiveMeetingTypeBySlug(slug);
    if (!meetingType) {
      return plainError("This meeting link isn't available.", 404);
    }

    // 4. The chosen length must be one of this meeting type's own lengths.
    const duration = meetingType.durations.find((option) => option.id === input.duration_id);
    if (!duration) {
      return plainError("Choose one of the listed lengths.", 400);
    }

    // 5. The proposed times must follow the slot rules in the business time zone.
    const businessTimezone = await getBusinessTimezone();
    const check = validateSlots({
      startsAt: input.starts_at,
      minutes: duration.minutes,
      now: new Date(),
      timeZone: businessTimezone
    });
    if (!check.ok) {
      return plainError(check.message, 400);
    }

    // 6 and 7. Save the request and its slots (the data module removes the request if slots fail).
    await createRequestWithSlots({
      meetingTypeId: meetingType.id,
      durationId: duration.id,
      clientName: input.client_name,
      clientEmail: input.client_email,
      businessTimezone,
      startsAt: input.starts_at.map((value) => new Date(value).toISOString())
    });
  } catch (error) {
    // Log only the error code and message, never the client's name or email.
    const detail = error as { code?: string; message?: string };
    console.error("Meeting request failed:", detail.code, detail.message);
    return plainError("Something went wrong saving your request. Please try again.", 500);
  }

  return NextResponse.json({ ok: true }, { status: 201 });
}
