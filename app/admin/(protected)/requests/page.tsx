import { RequestList } from "@/src/components/Requests/RequestList";

export const metadata = {
  title: "Requests — Group Meet Admin"
};

export default function RequestsPage() {
  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#f7fbfa_0%,#ffffff_55%)] px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <RequestList />
      </div>
    </main>
  );
}
