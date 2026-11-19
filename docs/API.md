# Group Meet — API Reference

## POST `/api/meetings`

Creates a new meeting request and notifies the team.

**Request body:**
```json
{
  "clientName": "string",
  "clientEmail": "string (valid email)",
  "meetingType": "in_depth | short_form",
  "slots": [
    {
      "startsAt": "ISO 8601 datetime string",
      "endsAt": "ISO 8601 datetime string"
    }
  ]
}
```

**Validation rules:**
- All fields required
- `clientEmail` must be valid email format
- `meetingType` must be `in_depth` or `short_form`
- `slots` must have at least 1 item
- Each slot: `endsAt` must be after `startsAt`

**Insert behavior:**
- Inserts `client_name`, `client_email`, and `meeting_type` on `meetings`
- Does not insert into legacy `participant_name`, `participant_email`, or `topic`

**Success response (200):**
```json
{ "meetingId": "uuid" }
```

**Error response (400):**
```json
{ "error": "Validation error message" }
```

---

## POST `/api/responses`

Records a team member's availability votes and checks for quorum.

**Request body:**
```json
{
  "meetingId": "uuid",
  "slotIds": ["uuid", "uuid"],
  "teamMemberId": "uuid"
}
```

**Validation rules:**
- All fields required
- `slotIds` must have at least 1 item
- Meeting must exist and have `status === 'pending'`

**Success response — no quorum (200):**
```json
{ "confirmed": false }
```

**Success response — quorum met (200):**
```json
{
  "confirmed": true,
  "slot": {
    "id": "uuid",
    "startsAt": "ISO 8601",
    "endsAt": "ISO 8601"
  }
}
```

**Error response — already confirmed (409):**
```json
{ "error": "Meeting is already confirmed" }
```


---

# Admin API

All `/api/admin/*` routes require a signed-in, active Admin or Super Admin (otherwise `401`; a deactivated admin gets `403` from `/api/admin/me`). Request and response JSON is snake_case. Errors look like `{ "error": "plain message" }`.

## Professionals

| Method and path | Purpose |
|---|---|
| `GET /api/admin/professionals` | List all professionals. |
| `POST /api/admin/professionals` | Create. Body: `name`, `email`. Duplicate email returns `409`. |
| `PATCH /api/admin/professionals/[id]` | Body: `is_active` (boolean, required). |
| `POST /api/admin/professionals/import` | Multipart CSV with `name` and `email` columns; existing emails are skipped. Returns `imported`, `skipped`, `errors`. |

Tier is no longer read or written by the app (Decision 058).

## Meeting types (Sprint 008)

| Method and path | Purpose |
|---|---|
| `GET /api/admin/meeting-types` | List with `durations`, `roles`, and `pool_size`. |
| `POST /api/admin/meeting-types` | Create (always inactive). Body: `title`, optional `slug`, optional `landing_description`. Slug defaults from the title; a duplicate slug returns `409`; a title that cannot make a valid slug returns `400`. |
| `GET /api/admin/meeting-types/[id]` | Full detail: durations, roles, `pool` (with `role_ids`), and `readiness` (`hasDuration`, `hasRole`, `canActivate`, `roleCoverage`). |
| `PATCH /api/admin/meeting-types/[id]` | Any of `title`, `slug`, `landing_description`, `is_active`, `min_matched_slots`, `min_responses` (null for no minimum). `is_active: true` returns `400` unless the type has a duration and a role. Returns the full detail. |
| `POST /api/admin/meeting-types/[id]/durations` | Body: `label`, `minutes` (5 to 480, multiple of 5), optional `sort_order`. |
| `PATCH` / `DELETE .../durations/[durationId]` | Delete returns `409` if a request uses it and `400` if it is the last duration of an active type. |
| `POST /api/admin/meeting-types/[id]/roles` | Body: `name`, optional `required_count` (default 1, minimum 1), optional `sort_order`. |
| `PATCH` / `DELETE .../roles/[roleId]` | Delete returns `400` if it is the last role of an active type; pool links are removed with it. |
| `PUT /api/admin/meeting-types/[id]/pool/[professionalId]` | Body: `role_ids`. Sets the roles this professional can fill; an empty array removes them from the pool. Role ids from another meeting type return `400`; only active professionals can be newly added. |
| `DELETE /api/admin/meeting-types/[id]/pool/[professionalId]` | Remove from the pool. |

## Identity

`GET /api/admin/me` returns the signed-in admin (`id`, `email`, `name`, `role`).


## Requests (Sprint 009)

### `POST /api/meet/[slug]/requests` (public, no sign-in)

A client asks for a meeting of one active meeting type. Nothing is written until every check passes.

**Body (snake_case):**
```json
{
  "client_name": "string (1 to 120)",
  "client_email": "string (valid email, stored lowercase)",
  "duration_id": "uuid of one of this meeting type's durations",
  "starts_at": ["ISO date-time (UTC, Z), 1 to 30 items"],
  "website": "hidden trap field; must be empty"
}
```

**Rules:** start times must be on or after the day two full calendar days ahead (midnight in the business time zone), at most 29 days ahead, on a 15-minute mark between 07:00 and 21:00 business time, unique, and at least duration plus 15 minutes apart. No end times are accepted; the server derives them.

**Responses:** `201 { "ok": true }` saved (the request id is not returned); `200 { "ok": true }` when the trap field is filled (nothing saved); `400 { "error": "plain message" }` invalid input, a length that is not one of the type's, or a rule failure; `404` unknown or switched-off link; `500` generic.

### `GET /api/admin/requests` (Admin or Super Admin)

Returns `{ "requests": [...] }`, newest first, up to 100. Each item has `id`, `clientName`, `clientEmail`, `status`, `createdAt`, `businessTimezone`, `meetingType { title, slug }`, `duration { label, minutes }`, and `slots` (ISO start times, ascending). `401` when not signed in.

> Note: the `POST /api/meetings` and `POST /api/responses` routes at the top of this file belong to the legacy flow and are retired in Sprint 014.
