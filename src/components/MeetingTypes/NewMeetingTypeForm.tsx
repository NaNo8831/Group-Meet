"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { errorClass, inputClass, primaryButtonClass, sendJson, slugifyTitle } from "./types";

export function NewMeetingTypeForm() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [slugEdited, setSlugEdited] = useState(false);
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleTitleChange(value: string) {
    setTitle(value);
    if (!slugEdited) setSlug(slugifyTitle(value));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);

    const result = await sendJson<{ meeting_type: { id: string } }>("POST", "/api/admin/meeting-types", {
      title,
      slug,
      landing_description: description.trim() === "" ? null : description
    });

    if (!result.ok) {
      // Keep everything the admin typed so they can fix just the problem.
      setError(result.error);
      setSaving(false);
      return;
    }

    router.push(`/admin/meeting-types/${result.data.meeting_type.id}`);
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-5 rounded-md border bg-white p-5">
      <div>
        <h1 className="text-2xl font-semibold">New meeting type</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          It starts switched off. You will add durations, roles, and people on the next screen.
        </p>
      </div>

      <label className="grid gap-1.5">
        <span className="text-xs font-medium">Title</span>
        <input
          type="text"
          value={title}
          onChange={(e) => handleTitleChange(e.target.value)}
          required
          maxLength={120}
          className={inputClass}
        />
      </label>

      <label className="grid gap-1.5">
        <span className="text-xs font-medium">Link</span>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">/meet/</span>
          <input
            type="text"
            value={slug}
            onChange={(e) => {
              setSlug(e.target.value);
              setSlugEdited(true);
            }}
            required
            maxLength={60}
            className={`${inputClass} flex-1`}
          />
        </div>
        <span className="text-xs text-muted-foreground">
          Lowercase letters, numbers, and hyphens. Filled in from the title; change it if you like.
        </span>
      </label>

      <label className="grid gap-1.5">
        <span className="text-xs font-medium">Landing page text (optional)</span>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={5}
          maxLength={2000}
          className={inputClass}
        />
        <span className="text-xs text-muted-foreground">Plain text, up to 2000 characters.</span>
      </label>

      {error ? <p className={errorClass}>{error}</p> : null}

      <div className="flex items-center gap-3">
        <button type="submit" disabled={saving} className={primaryButtonClass}>
          {saving ? "Creating…" : "Create meeting type"}
        </button>
        <Link href="/admin/meeting-types" className="text-sm text-muted-foreground underline underline-offset-2">
          Cancel
        </Link>
      </div>
    </form>
  );
}
