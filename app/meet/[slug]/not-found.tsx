import Link from "next/link";

export default function MeetingNotFound() {
  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#f7fbfa_0%,#ffffff_55%)] px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-xl pt-12">
        <h1 className="text-3xl font-semibold text-foreground">This meeting link isn&apos;t available.</h1>
        <p className="mt-4 text-base leading-7 text-muted-foreground">
          The link may be wrong, or this kind of meeting may not be open for requests right now.
        </p>
        <Link href="/" className="mt-6 inline-block text-sm underline underline-offset-2">
          See the meetings that are open
        </Link>
      </div>
    </main>
  );
}
