"use client";

import { useState } from "react";
import { ProfessionalTier } from "./types";

interface AddProfessionalFormProps {
  onAdded: () => void;
}

export function AddProfessionalForm({ onAdded }: AddProfessionalFormProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [tier, setTier] = useState<ProfessionalTier>("general");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/admin/professionals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, tier })
      });

      const payload = await res.json().catch(() => null) as { error?: string } | null;

      if (!res.ok) {
        setError(payload?.error ?? "Failed to add professional");
        return;
      }

      setName("");
      setEmail("");
      setTier("general");
      onAdded();
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-md border bg-white p-4">
      <h3 className="mb-4 text-sm font-semibold">Add professional</h3>

      <div className="grid gap-3 sm:grid-cols-3">
        <label className="grid gap-1.5">
          <span className="text-xs font-medium">Name</span>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="rounded-md border px-3 py-2 text-sm outline-none transition focus:ring-2 focus:ring-ring"
          />
        </label>

        <label className="grid gap-1.5">
          <span className="text-xs font-medium">Email</span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="rounded-md border px-3 py-2 text-sm outline-none transition focus:ring-2 focus:ring-ring"
          />
        </label>

        <label className="grid gap-1.5">
          <span className="text-xs font-medium">Tier</span>
          <select
            value={tier}
            onChange={(e) => setTier(e.target.value as ProfessionalTier)}
            className="rounded-md border bg-white px-3 py-2 text-sm outline-none transition focus:ring-2 focus:ring-ring"
          >
            <option value="general">General</option>
            <option value="in_depth">In-depth</option>
          </select>
        </label>
      </div>

      {error ? (
        <p className="mt-3 rounded-md border border-destructive/25 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={loading}
        className="mt-4 inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:opacity-95 disabled:opacity-60"
      >
        {loading ? "Adding…" : "Add Professional"}
      </button>
    </form>
  );
}
