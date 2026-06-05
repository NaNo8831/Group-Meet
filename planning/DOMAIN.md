# Group Meet — Domain Context

## Core Concept
A meeting in Group Meet requires **quorum**: at least one team member with the role of **Leader** and at least one with the role of **Support** must both select the same proposed time slot. When quorum is detected, the meeting is automatically confirmed.

## Key Terms

| Term | Meaning |
|---|---|
| Participant | External person requesting the meeting. No account required. |
| Leader | Internal team member. One required per confirmed meeting. |
| Support | Internal team member. One required per confirmed meeting. |
| Time Slot | A proposed date + start time + end time submitted by the Participant. |
| Response | A team member's vote indicating availability for a specific slot. |
| Quorum | The condition where ≥1 Leader and ≥1 Support have both responded to the same slot. |
| Confirmed Slot | The earliest time slot that has achieved quorum. |
| Voting Link | A unique URL sent to each team member: `/team/meetings/[id]?member=[uuid]` |

## Status Lifecycle
```
pending → confirmed
```
- `pending`: Meeting created, awaiting team votes
- `confirmed`: Quorum met, slot locked, emails sent
- `cancelled`: Reserved for Phase 2

## Quorum Logic (plain language)
After every new response is saved:
1. Loop through all time slots for the meeting, ordered by earliest first
2. For each slot, check if there is at least one Leader response AND at least one Support response
3. If yes → that slot is the confirmed slot. Stop checking.
4. If no → continue to next slot
5. If no slot qualifies → do nothing, wait for more votes
