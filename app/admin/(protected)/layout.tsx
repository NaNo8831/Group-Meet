import { redirect } from "next/navigation";
import { getAuthenticatedAdmin } from "@/lib/auth";
import AdminNav from "./AdminNav";

export default async function AdminLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const admin = await getAuthenticatedAdmin();

  if (!admin) {
    redirect("/admin/login");
  }

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f7fbfa_0%,#ffffff_55%)]">
      <AdminNav email={admin.email} />
      {children}
    </div>
  );
}
