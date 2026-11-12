import { MeetingTypeEditor } from "@/src/components/MeetingTypes/MeetingTypeEditor";

export const metadata = {
  title: "Edit Meeting Type — Group Meet Admin"
};

export default async function MeetingTypePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#f7fbfa_0%,#ffffff_55%)] px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <MeetingTypeEditor id={id} />
      </div>
    </main>
  );
}
