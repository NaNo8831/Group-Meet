"use client";

import { useRef, useState } from "react";

interface CsvImportFormProps {
  onImported: () => void;
}

interface ImportResult {
  imported: number;
  skipped: number;
  errors: string[];
}

export function CsvImportForm({ onImported }: CsvImportFormProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const file = fileRef.current?.files?.[0];
    if (!file) return;

    setError(null);
    setResult(null);
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/admin/professionals/import", {
        method: "POST",
        body: formData
      });

      const payload = await res.json().catch(() => null) as (ImportResult & { error?: string }) | null;

      if (!res.ok) {
        setError(payload?.error ?? "Import failed");
        return;
      }

      setResult(payload as ImportResult);
      if (fileRef.current) fileRef.current.value = "";
      onImported();
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-md border bg-white p-4">
      <h3 className="mb-1 text-sm font-semibold">Import CSV</h3>
      <p className="mb-4 text-xs text-muted-foreground">
        CSV must include <strong>name</strong> and <strong>email</strong> columns. Tier defaults to General.
      </p>

      <div className="flex items-center gap-3">
        <input
          ref={fileRef}
          type="file"
          accept=".csv"
          required
          className="text-sm text-foreground"
        />
        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:opacity-95 disabled:opacity-60"
        >
          {loading ? "Importing…" : "Import CSV"}
        </button>
      </div>

      {error ? (
        <p className="mt-3 rounded-md border border-destructive/25 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      ) : null}

      {result ? (
        <div className="mt-3 rounded-md border bg-muted/30 px-3 py-2 text-sm">
          <p className="font-medium">
            {result.imported} imported, {result.skipped} skipped
          </p>
          {result.errors.length > 0 ? (
            <ul className="mt-1 list-disc pl-4 text-xs text-destructive">
              {result.errors.map((err, i) => (
                <li key={i}>{err}</li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}
    </form>
  );
}
