import { NextResponse } from "next/server";
import {
  sendParticipantConfirmationEmail,
  sendTeamConfirmationEmail
} from "@/lib/email";
import { checkQuorum } from "@/lib/quorum";
import { createServiceSupabaseClient } from "@/lib/supabase";
import type { Meeting } from "@/lib/types";
import { submitResponsesSchema } from "@/lib/validation";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = submitResponsesSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid request." }, { status: 400 });
  }

  const supabase = createServiceSupabaseClient();
  const { meetingId, slotIds, teamMemberId } = parsed.data;

  const { data: meeting, error: meetingError } = await supabase
    .from("meetings")
    .select("*")
    .eq("id", meetingId)
    .single();

  if (meetingError || !meeting) {
    return NextResponse.json({ error: "Meeting not found." }, { status: 404 });
  }

  if (meeting.status !== "pending") {
    return NextResponse.json({ error: "Meeting is already confirmed." }, { status: 409 });
  }

  const { error: responseError } = await supabase.from("responses").upsert(
    slotIds.map((slotId) => ({
      meeting_id: meetingId,
      slot_id: slotId,
      team_member_id: teamMemberId
    })),
    {
      onConflict: "team_member_id,slot_id",
      ignoreDuplicates: true
    }
  );

  if (responseError) {
    return NextResponse.json({ error: "Unable to record availability." }, { status: 500 });
  }

  const quorum = await checkQuorum(meetingId);

  if (!quorum) {
    return NextResponse.json({ confirmed: false });
  }

  const { data: updatedMeeting, error: updateError } = await supabase
    .from("meetings")
    .update({
      status: "confirmed",
      confirmed_slot_id: quorum.slot.id,
      confirmed_leader_id: quorum.leader.id,
      confirmed_support_id: quorum.support.id
    })
    .eq("id", meetingId)
    .eq("status", "pending")
    .select("*")
    .maybeSingle();

  if (updateError) {
    return NextResponse.json({ error: "Unable to confirm meeting." }, { status: 500 });
  }

  if (!updatedMeeting) {
    return NextResponse.json({ error: "Meeting is already confirmed." }, { status: 409 });
  }

  await Promise.all([
    sendParticipantConfirmationEmail({
      meeting: updatedMeeting as Meeting,
      slot: quorum.slot,
      leader: quorum.leader,
      support: quorum.support
    }),
    sendTeamConfirmationEmail({
      meeting: updatedMeeting as Meeting,
      slot: quorum.slot,
      leader: quorum.leader,
      support: quorum.support
    })
  ]);

  return NextResponse.json({
    confirmed: true,
    slot: {
      id: quorum.slot.id,
      startsAt: quorum.slot.starts_at,
      endsAt: quorum.slot.ends_at
    }
  });
}
