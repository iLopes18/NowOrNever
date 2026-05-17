# Security Specification for Now or Never

## 1. Data Invariants
- A `Participant` must always belong to a valid `Plan`.
- A user can only modify their own `Participant` record.
- Plan deletion is restricted to the creator (if we want to enforce that, though for anonymous sessions it's tricky - I'll allow "any authenticated" (anonymous) user who is the `creatorId` saved in the doc).
- High availability updates should not allow modifying `displayName` after joining (or at least restricted).

## 2. The Dirty Dozen (Test Payloads denied)
1. Creating a plan without an access code.
2. Creating a participant in a plan with a path mismatch (planId != subcollection parent).
3. Updating someone else's availability.
4. Setting a massive display name ( > 50 chars).
5. Injecting a massive array of availability slots ( > 500 slots).
6. Spoofing `creatorId` during plan creation.
7. Modifying `createdAt` after creation.
8. Modifying `accessCode` after creation.
9. Modifying `type` after creation.
10. Reading all plans via a blanket list query.
11. Creating a plan with an expiry date in the past.
12. Deleting a plan where the user is not the creator.

## 3. Implementation Patterns
- `isValidId()` for path vars.
- `isValidPlan()` for structure.
- `isValidParticipant()` for user data.
- `affectedKeys().hasOnly()` for partial updates.
- `exists()` and `get()` for relational sync.
