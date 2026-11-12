import { MeetingTypeList } from "@/src/components/MeetingTypes/MeetingTypeList";

export const metadata = {
  title: "Meeting Types — Group Meet Admin"
};

export default function MeetingTypesPage() {
  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#f7fbfa_0%,#ffffff_55%)] px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <MeetingTypeList />
      </div>
    </main>
  );
}
