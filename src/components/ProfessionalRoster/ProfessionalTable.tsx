"use client";

import { Professional } from "./types";

interface ProfessionalTableProps {
  professionals: Professional[];
  onUpdated: () => void;
}

async function patchProfessional(id: string, patch: { tier?: string; is_active?: boolean }) {
  const res = await fetch(`/api/admin/professionals/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patch)
  });
  if (!res.ok) {
    const payload = await res.json().catch(() => null) as { error?: string } | null;
    throw new Error(payload?.error ?? "Update failed");
  }
}

export function ProfessionalTable({ professionals, onUpdated }: ProfessionalTableProps) {
  if (professionals.length === 0) {
    return (
      <p className="rounded-md border bg-white p-4 text-sm text-muted-foreground">
        No professionals yet. Add one below or import a CSV.
      </p>
    );
  }

  async function handleTierToggle(pro: Professional) {
    const newTier = pro.tier === "in_depth" ? "general" : "in_depth";
    await patchProfessional(pro.id, { tier: newTier });
    onUpdated();
  }

  async function handleStatusToggle(pro: Professional) {
    await patchProfessional(pro.id, { is_active: !pro.is_active });
    onUpdated();
  }

  return (
    <div className="overflow-x-auto rounded-md border bg-white">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
            <th className="px-4 py-3">Name</th>
            <th className="px-4 py-3">Email</th>
            <th className="px-4 py-3">Tier</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">Actions</th>
          </tr>
        </thead>
        <tbody>
          {professionals.map((pro) => (
            <tr
              key={pro.id}
              className={`border-b last:border-b-0 ${!pro.is_active ? "opacity-50" : ""}`}
            >
              <td className="px-4 py-3 font-medium">{pro.name}</td>
              <td className="px-4 py-3 text-muted-foreground">{pro.email}</td>
              <td className="px-4 py-3">
                <button
                  type="button"
                  onClick={() => handleTierToggle(pro)}
                  className="rounded-md border px-2 py-1 text-xs font-medium transition hover:bg-muted"
                  title="Toggle tier"
                >
                  {pro.tier === "in_depth" ? "In-depth" : "General"}
                </button>
              </td>
              <td className="px-4 py-3">
                <span
                  className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                    pro.is_active
                      ? "bg-green-100 text-green-800"
                      : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {pro.is_active ? "Active" : "Inactive"}
                </span>
              </td>
              <td className="px-4 py-3">
                <button
                  type="button"
                  onClick={() => handleStatusToggle(pro)}
                  className="rounded-md border px-2 py-1 text-xs transition hover:bg-muted"
                >
                  {pro.is_active ? "Deactivate" : "Reactivate"}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
