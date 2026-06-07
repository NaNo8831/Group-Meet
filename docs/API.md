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
