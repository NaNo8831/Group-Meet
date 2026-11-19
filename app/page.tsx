import Link from "next/link";
import { listActiveMeetingTypes, type ActiveMeetingType } from "@/lib/db/requests";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Group Meet"
};

function excerpt(text: string | null, maxLength = 160) {
  if (!text) return null;
  const flat = text.replace(/\s+/g, " ").trim();
  if (flat.length <= maxLength) return flat;
  return `${flat.slice(0, maxLength).trimEnd()}…`;
}

export default async function HomePage() {
  let meetingTypes: ActiveMeetingType[] = [];
  let loadFailed = false;

  try {
    meetingTypes = await listActiveMeetingTypes();
  } catch (error) {
    const detail = error as { code?: string; message?: string };
    console.error("Unable to load meeting types:", detail.code, detail.message);
    loadFailed = true;
  }

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#f7fbfa_0%,#ffffff_55%)] px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <p className="mb-4 text-sm font-medium uppercase tracking-wide text-primary">Group Meet</p>
        <h1 className="text-4xl font-semibold leading-tight text-foreground sm:text-5xl">Request a meeting.</h1>
        <p className="mt-5 max-w-xl text-base leading-7 text-muted-foreground">
          Choose the kind of meeting you need, then propose a few times that work for you.
        </p>

        <div className="mt-10 grid gap-4">
          {loadFailed ? (
            <p className="rounded-md border border-destructive/25 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              We could not load the available meetings right now. Please try again in a moment.
            </p>
          ) : meetingTypes.length === 0 ? (
            <p className="rounded-md border bg-white p-4 text-sm text-muted-foreground">
              No meetings are open for requests right now.
            </p>
          ) : (
            meetingTypes.map((type) => {
              const summary = excerpt(type.landingDescription);
              return (
                <Link
                  key={type.id}
                  href={`/meet/${type.slug}`}
                  className="rounded-lg border bg-white p-5 shadow-sm transition hover:bg-muted focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <span className="block text-lg font-semibold">{type.title}</span>
                  {summary ? <span className="mt-1 block text-sm text-muted-foreground">{summary}</span> : null}
                  {type.durations.length > 0 ? (
                    <span className="mt-3 block text-sm text-muted-foreground">
                      {type.durations.map((duration) => `${duration.label} ${duration.minutes} min`).join(" · ")}
                    </span>
                  ) : null}
                </Link>
              );
            })
          )}
        </div>
      </div>
    </main>
  );
}
