"use client";

import { useCallback, useEffect, useState } from "react";
import { AddProfessionalForm } from "./AddProfessionalForm";
import { CsvImportForm } from "./CsvImportForm";
import { ProfessionalTable } from "./ProfessionalTable";
import { Professional } from "./types";

export function ProfessionalRoster() {
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfessionals = useCallback(async () => {
    setError(null);
    const res = await fetch("/api/admin/professionals");
    const payload = await res.json().catch(() => null) as { professionals?: Professional[]; error?: string } | null;

    if (!res.ok) {
      setError(payload?.error ?? "Failed to load professionals");
    } else {
      setProfessionals(payload?.professionals ?? []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void fetchProfessionals();
  }, [fetchProfessionals]);

  const activeCount = professionals.filter((p) => p.is_active).length;

  return (
    <div className="grid gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Professional Roster</h1>
          {!loading ? (
            <p className="mt-1 text-sm text-muted-foreground">
              {activeCount} active professional{activeCount !== 1 ? "s" : ""}
            </p>
          ) : null}
        </div>
      </div>

      {error ? (
        <p className="rounded-md border border-destructive/25 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      ) : null}

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : (
        <ProfessionalTable professionals={professionals} onUpdated={fetchProfessionals} />
      )}

      <AddProfessionalForm onAdded={fetchProfessionals} />
      <CsvImportForm onImported={fetchProfessionals} />
    </div>
  );
}

export type { Professional } from "./types";
