"use client";

import { useState } from "react";
import {
  MeetingTypeRole,
  errorClass,
  inputClass,
  primaryButtonClass,
  sendJson,
  smallButtonClass
} from "./types";

interface RolesEditorProps {
  meetingTypeId: string;
  roles: MeetingTypeRole[];
  onChanged: () => Promise<void>;
}

function RoleRow({
  meetingTypeId,
  role,
  onChanged
}: {
  meetingTypeId: string;
  role: MeetingTypeRole;
  onChanged: () => Promise<void>;
}) {
  const [name, setName] = useState(role.name);
  const [count, setCount] = useState(String(role.required_count));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const unchanged = name === role.name && Number(count) === role.required_count;

  async function save() {
    setBusy(true);
    setError(null);
    const result = await sendJson("PATCH", `/api/admin/meeting-types/${meetingTypeId}/roles/${role.id}`, {
      name,
      required_count: Number(count)
    });
    if (!result.ok) setError(result.error);
    else await onChanged();
    setBusy(false);
  }

  async function remove() {
    setBusy(true);
    setError(null);
    const result = await sendJson("DELETE", `/api/admin/meeting-types/${meetingTypeId}/roles/${role.id}`);
    if (!result.ok) {
      setError(result.error);
      setBusy(false);
      return;
    }
    await onChanged();
    setBusy(false);
  }

  return (
    <li className="grid gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={40}
          aria-label="Role name"
          className={`${inputClass} w-40`}
        />
        <span className="text-sm text-muted-foreground">needed:</span>
        <input
          type="number"
          value={count}
          onChange={(e) => setCount(e.target.value)}
          min={1}
          step={1}
          aria-label="Required count"
          className={`${inputClass} w-20`}
        />
        <button type="button" onClick={save} disabled={busy || unchanged} className={smallButtonClass}>
          Save
        </button>
        <button type="button" onClick={remove} disabled={busy} className={smallButtonClass}>
          Delete
        </button>
      </div>
      {error ? <p className={errorClass}>{error}</p> : null}
    </li>
  );
}

export function RolesEditor({ meetingTypeId, roles, onChanged }: RolesEditorProps) {
  const [name, setName] = useState("");
  const [count, setCount] = useState("1");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const result = await sendJson("POST", `/api/admin/meeting-types/${meetingTypeId}/roles`, {
      name,
      required_count: Number(count)
    });
    if (!result.ok) {
      setError(result.error);
    } else {
      setName("");
      setCount("1");
      await onChanged();
    }
    setBusy(false);
  }

  return (
    <section className="grid gap-4 rounded-md border bg-white p-5">
      <div>
        <h2 className="text-lg font-semibold">Roles</h2>
        <p className="text-sm text-muted-foreground">
          The positions every meeting of this type needs filled, and how many people each needs. Lead and
          Support are common choices.
        </p>
      </div>

      {roles.length === 0 ? (
        <p className="text-sm text-muted-foreground">No roles yet. Add at least one to switch this type on.</p>
      ) : (
        <ul className="grid gap-3">
          {roles.map((role) => (
            <RoleRow
              key={`${role.id}-${role.name}-${role.required_count}`}
              meetingTypeId={meetingTypeId}
              role={role}
              onChanged={onChanged}
            />
          ))}
        </ul>
      )}

      <form onSubmit={handleAdd} className="flex flex-wrap items-end gap-2 border-t pt-4">
        <label className="grid gap-1">
          <span className="text-xs font-medium">Role name</span>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            maxLength={40}
            placeholder="Support"
            className={`${inputClass} w-40`}
          />
        </label>
        <label className="grid gap-1">
          <span className="text-xs font-medium">How many</span>
          <input
            type="number"
            value={count}
            onChange={(e) => setCount(e.target.value)}
            required
            min={1}
            step={1}
            className={`${inputClass} w-20`}
          />
        </label>
        <button type="submit" disabled={busy} className={primaryButtonClass}>
          Add role
        </button>
      </form>
      {error ? <p className={errorClass}>{error}</p> : null}
    </section>
  );
}
