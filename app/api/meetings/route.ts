import { NextResponse } from "next/server";
import { sendTeamNotificationEmail } from "@/lib/email";
import { createServiceSupabaseClient } from "@/lib/supabase";
import type { Meeting, TeamMember, TimeSlot } from "@/lib/types";
import { createMeetingSchema } from "@/lib/validation";

function getAppOrigin(request: Request) {
  const origin = request.headers.get("origin");

  if (origin) {
    return origin;
  }

  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  const protocol = request.headers.get("x-forwarded-proto") ?? (host?.startsWith("localhost") ? "http" : "https");

  return host ? `${protocol}://${host}` : "http://localhost:3000";
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = createMeetingSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid request." }, { status: 400 });
  }

  const supabase = createServiceSupabaseClient();
  const { participantName, participantEmail, topic, slots } = parsed.data;
  const appOrigin = getAppOrigin(request);

  const { data: meeting, error: meetingError } = await supabase
    .from("meetings")
    .insert({
      participant_name: participantName,
      participant_email: participantEmail,
      topic
    })
    .select("*")
    .single();

  if (meetingError || !meeting) {
    return NextResponse.json({ error: "Unable to create meeting." }, { status: 500 });
  }

  const { data: createdSlots, error: slotError } = await supabase
    .from("time_slots")
    .insert(
      slots.map((slot) => ({
        meeting_id: meeting.id,
        starts_at: slot.startsAt,
        ends_at: slot.endsAt
      }))
    )
    .select("*")
    .order("starts_at", { ascending: true });

  if (slotError || !createdSlots) {
    return NextResponse.json({ error: "Unable to create meeting time slots." }, { status: 500 });
  }

  const { data: teamMembers, error: teamError } = await supabase
    .from("team_members")
    .select("*")
    .eq("is_active", true)
    .order("name", { ascending: true });

  if (teamError) {
    console.error("Unable to load team members", teamError);
  }

  await Promise.all(
    ((teamMembers ?? []) as TeamMember[]).map((member) =>
      sendTeamNotificationEmail({
        meeting: meeting as Meeting,
        slots: createdSlots as TimeSlot[],
        member,
        appOrigin
      })
    )
  );

  return NextResponse.json({ meetingId: meeting.id });
}
