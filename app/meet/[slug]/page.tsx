import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getActiveMeetingTypeBySlug,
  getBusinessTimezone,
  type ActiveMeetingType
} from "@/lib/db/requests";
import { RequestForm } from "@/src/components/MeetingRequest/RequestForm";

export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  try {
    const meetingType = await getActiveMeetingTypeBySlug(slug);
    return { title: meetingType ? `${meetingType.title} — Group Meet` : "Group Meet" };
  } catch {
    return { title: "Group Meet" };
  }
}

export default async function MeetingRequestPage({ params }: PageProps) {
  const { slug } = await params;

  let meetingType: ActiveMeetingType | null = null;
  let timeZone = "US/Eastern";
  let loadFailed = false;

  try {
    meetingType = await getActiveMeetingTypeBySlug(slug);
    if (meetingType) {
      timeZone = await getBusinessTimezone();
    }
  } catch (error) {
    const detail = error as { code?: string; message?: string };
    console.error("Unable to load meeting type:", detail.code, detail.message);
    loadFailed = true;
  }

  if (loadFailed) {
    return (
      <main className="min-h-screen bg-[linear-gradient(180deg,#f7fbfa_0%,#ffffff_55%)] px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-xl">
          <p className="rounded-md border border-destructive/25 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            We could not load this meeting right now. Please try again in a moment.
          </p>
          <Link href="/" className="mt-4 inline-block text-sm underline underline-offset-2">
            All meeting types
          </Link>
        </div>
      </main>
    );
  }

  if (!meetingType) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#f7fbfa_0%,#ffffff_55%)] px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-5xl gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
        <section className="pt-4 lg:pt-12">
          <Link href="/" className="text-sm text-muted-foreground underline underline-offset-2">
            All meeting types
          </Link>
          <h1 className="mt-4 text-4xl font-semibold leading-tight text-foreground sm:text-5xl">
            {meetingType.title}
          </h1>
          {meetingType.landingDescription ? (
            <p className="mt-5 max-w-xl whitespace-pre-line text-base leading-7 text-muted-foreground">
              {meetingType.landingDescription}
            </p>
          ) : null}
        </section>

        <RequestForm slug={meetingType.slug} durations={meetingType.durations} timeZone={timeZone} />
      </div>
    </main>
  );
}
