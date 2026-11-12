import { NewMeetingTypeForm } from "@/src/components/MeetingTypes/NewMeetingTypeForm";

export const metadata = {
  title: "New Meeting Type — Group Meet Admin"
};

export default function NewMeetingTypePage() {
  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#f7fbfa_0%,#ffffff_55%)] px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-2xl">
        <NewMeetingTypeForm />
      </div>
    </main>
  );
}
