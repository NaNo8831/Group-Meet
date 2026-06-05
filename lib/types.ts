export type TeamRole = "leader" | "support";
export type MeetingStatus = "pending" | "confirmed" | "cancelled";

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: TeamRole;
  is_active: boolean;
  created_at: string;
}

export interface Meeting {
  id: string;
  participant_name: string;
  participant_email: string;
  topic: string;
  status: MeetingStatus;
  confirmed_slot_id: string | null;
  confirmed_leader_id: string | null;
  confirmed_support_id: string | null;
  created_at: string;
}

export interface TimeSlot {
  id: string;
  meeting_id: string;
  starts_at: string;
  ends_at: string;
  created_at: string;
}

export interface Response {
  id: string;
  meeting_id: string;
  slot_id: string;
  team_member_id: string;
  created_at: string;
}

export interface MeetingWithConfirmation extends Meeting {
  confirmedSlot: TimeSlot | null;
  confirmedLeader: TeamMember | null;
  confirmedSupport: TeamMember | null;
}

export interface SlotInput {
  startsAt: string;
  endsAt: string;
}

export interface QuorumResult {
  slot: TimeSlot;
  leader: TeamMember;
  support: TeamMember;
}
