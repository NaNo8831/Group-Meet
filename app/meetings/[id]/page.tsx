import Link from "next/link";
import { firstName, formatSlot } from "@/lib/format";
import { createPublicSupabaseClient } from "@/lib/supabase";
import type { Meeting, TeamMember, TimeSlot } from "@/lib/types";

export const dynamic = "force-dynamic";

type MaybePromise<T> = T | Promise<T>;

interface MeetingPageProps {
  params: MaybePromise<{
    id: string;
  }>;
}

export default async function MeetingStatusPage({ params }: MeetingPageProps) {
  const { id } = await params;
  const supabase = createPublicSupabaseClient();
  const { data: meeting, error } = await supabase.from("meetings").select("*").eq("id", id).maybeSingle();

  if (error) {
    console.error("Unable to load meeting status", error);
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

  let confirmedSlot: TimeSlot | null = null;
  let leader: TeamMember | null = null;
  let support: TeamMember | null = null;

  if (meeting.status === "confirmed") {
    const [{ data: slot }, { data: leaderData }, { data: supportData }] = await Promise.all([
      meeting.confirmed_slot_id
        ? supabase.from("time_slots").select("*").eq("id", meeting.confirmed_slot_id).maybeSingle()
        : Promise.resolve({ data: null }),
      meeting.confirmed_leader_id
        ? supabase.from("team_members").select("*").eq("id", meeting.confirmed_leader_id).maybeSingle()
        : Promise.resolve({ data: null }),
      meeting.confirmed_support_id
        ? supabase.from("team_members").select("*").eq("id", meeting.confirmed_support_id).maybeSingle()
        : Promise.resolve({ data: null })
    ]);

    confirmedSlot = slot as TimeSlot | null;
    leader = leaderData as TeamMember | null;
    support = supportData as TeamMember | null;
  }

  const status = meeting.status as Meeting["status"];

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#f7fbfa_0%,#ffffff_55%)] px-4 py-8 sm:px-6">
      <section className="mx-auto max-w-2xl rounded-lg border bg-white p-5 shadow-sm sm:p-7">
        <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium uppercase tracking-wide text-primary">Group Meet</p>
            <h1 className="mt-2 text-3xl font-semibold">{meeting.topic}</h1>
          </div>
          <span className="rounded-md bg-accent px-3 py-1 text-sm font-medium capitalize text-accent-foreground">
            {status}
          </span>
        </div>

        <dl className="grid gap-4 border-y py-5">
          <div>
            <dt className="text-sm font-medium text-muted-foreground">Participant</dt>
            <dd className="mt-1 text-lg">{meeting.participant_name}</dd>
          </div>
        </dl>

        {status === "pending" ? (
          <p className="mt-6 rounded-md bg-muted px-4 py-3 text-muted-foreground">
            Waiting for team availability confirmation.
          </p>
        ) : null}

        {status === "confirmed" && confirmedSlot ? (
          <div className="mt-6 rounded-md border border-primary/20 bg-accent p-4 text-accent-foreground">
            <h2 className="font-semibold">Meeting confirmed</h2>
            <p className="mt-2">{formatSlot(confirmedSlot)}</p>
            {leader && support ? (
              <p className="mt-2">
                You will meet with {firstName(leader.name)} and {firstName(support.name)}.
              </p>
            ) : null}
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
        <Link className="mt-5 inline-flex rounded-md bg-primary px-4 py-2 font-medium text-primary-foreground" href="/">
          New request
        </Link>
      </section>
    </main>
  );
}
