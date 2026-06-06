import { formatSlot } from "@/lib/format";
import { createPublicSupabaseClient } from "@/lib/supabase";
import type { Meeting, TeamMember, TimeSlot } from "@/lib/types";
import { TeamVotingForm } from "./TeamVotingForm";

export const dynamic = "force-dynamic";

type MaybePromise<T> = T | Promise<T>;

interface TeamMeetingPageProps {
  params: MaybePromise<{
    id: string;
  }>;
  searchParams: MaybePromise<{
    member?: string;
  }>;
}

export default async function TeamMeetingPage({ params, searchParams }: TeamMeetingPageProps) {
  const { id } = await params;
  const resolvedSearchParams = await searchParams;
  const memberId = resolvedSearchParams.member;

  if (!memberId) {
    return <PageMessage title="Voting link incomplete" message="This link is missing a team member identifier." />;
  }

  const supabase = createPublicSupabaseClient();
  const [
    { data: meeting, error: meetingError },
    { data: member, error: memberError },
    { data: slots, error: slotsError }
  ] = await Promise.all([
    supabase.from("meetings").select("*").eq("id", id).maybeSingle(),
    supabase.from("team_members").select("*").eq("id", memberId).eq("is_active", true).maybeSingle(),
    supabase.from("time_slots").select("*").eq("meeting_id", id).order("starts_at", { ascending: true })
  ]);

  if (meetingError) {
    console.error("Unable to load meeting for voting", meetingError);
    return (
      <PageMessage
        title="Unable to load meeting"
        message="We could not load this meeting right now. Please try the link again shortly."
      />
    );
  }

  if (!meeting) {
    return <PageMessage title="Meeting not found" message="The meeting link is invalid or no longer available." />;
  }

  if (memberError) {
    console.error("Unable to load team member for voting", memberError);
    return (
      <PageMessage
        title="Unable to load team member"
        message="We could not verify this voting link right now. Please try again shortly."
      />
    );
  }

  if (!member) {
    return <PageMessage title="Team member not found" message="This voting link does not match an active team member." />;
  }

  if (slotsError) {
    console.error("Unable to load meeting slots for voting", slotsError);
    return (
      <PageMessage
        title="Unable to load proposed times"
        message="We could not load the proposed meeting times right now. Please try again shortly."
      />
    );
  }

  const typedMeeting = meeting as Meeting;
  const typedMember = member as TeamMember;
  const typedSlots = (slots ?? []) as TimeSlot[];

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#f7fbfa_0%,#ffffff_55%)] px-4 py-8 sm:px-6">
      <section className="mx-auto max-w-2xl rounded-lg border bg-white p-5 shadow-sm sm:p-7">
        <div className="mb-6">
          <p className="text-sm font-medium uppercase tracking-wide text-primary">Group Meet</p>
          <h1 className="mt-2 text-3xl font-semibold">{typedMeeting.topic}</h1>
          <p className="mt-3 text-muted-foreground">
            {typedMember.name} · <span className="capitalize">{typedMember.role}</span>
          </p>
          <p className="mt-1 text-sm text-muted-foreground">Participant: {typedMeeting.participant_name}</p>
        </div>

        {typedMeeting.status === "confirmed" ? (
          <div className="rounded-md border bg-accent p-4 text-accent-foreground">
            <h2 className="font-semibold">This meeting is already confirmed</h2>
            {typedSlots[0] ? <p className="mt-2">No additional availability is needed.</p> : null}
          </div>
        ) : (
          <TeamVotingForm meeting={typedMeeting} member={typedMember} slots={typedSlots} />
        )}

        {typedSlots.length > 0 ? (
          <div className="mt-6 border-t pt-4 text-sm text-muted-foreground">
            <p className="font-medium text-foreground">Proposed times</p>
            <ul className="mt-2 grid gap-1">
              {typedSlots.map((slot) => (
                <li key={slot.id}>{formatSlot(slot)}</li>
              ))}
            </ul>
          </div>
        ) : null}
      </section>
    </main>
  );
}

function PageMessage({ title, message }: { title: string; message: string }) {
  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-8">
      <section className="max-w-md rounded-lg border bg-white p-6 text-center shadow-sm">
        <h1 className="text-2xl font-semibold">{title}</h1>
        <p className="mt-3 text-muted-foreground">{message}</p>
      </section>
    </main>
  );
}
