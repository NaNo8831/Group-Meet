# Group Meet — API Reference

## POST `/api/meetings`

Creates a new meeting request and notifies the team.

**Request body:**
```json
{
  "participantName": "string",
  "participantEmail": "string (valid email)",
  "topic": "string",
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
- `participantEmail` must be valid email format
- `slots` must have 1–5 items
- Each slot: `endsAt` must be after `startsAt`

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
