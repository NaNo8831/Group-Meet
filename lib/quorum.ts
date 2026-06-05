import { createServiceSupabaseClient } from "./supabase";
import type { QuorumResult, TeamMember, TimeSlot } from "./types";

interface ResponseWithMember {
  team_members: TeamMember | TeamMember[] | null;
}

function normalizeMember(value: ResponseWithMember["team_members"]) {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value;
}

export async function checkQuorum(meetingId: string): Promise<QuorumResult | null> {
  const supabase = createServiceSupabaseClient();

  const { data: meeting, error: meetingError } = await supabase
    .from("meetings")
    .select("status")
    .eq("id", meetingId)
    .single();

  if (meetingError || !meeting || meeting.status !== "pending") {
    return null;
  }

  const { data: slots, error: slotsError } = await supabase
    .from("time_slots")
    .select("*")
    .eq("meeting_id", meetingId)
    .order("starts_at", { ascending: true });

  if (slotsError || !slots) {
    throw slotsError ?? new Error("Unable to load time slots.");
  }

  for (const slot of slots as TimeSlot[]) {
    const { data: responses, error: responsesError } = await supabase
      .from("responses")
      .select("team_members(*)")
      .eq("meeting_id", meetingId)
      .eq("slot_id", slot.id);

    if (responsesError) {
      throw responsesError;
    }

    const members = ((responses ?? []) as unknown as ResponseWithMember[])
      .map((response) => normalizeMember(response.team_members))
      .filter((member): member is TeamMember => Boolean(member));

    const leader = members.find((member) => member.role === "leader");
    const support = members.find((member) => member.role === "support");

    if (leader && support) {
      return {
        slot,
        leader,
        support
      };
    }
  }

  return null;
}
