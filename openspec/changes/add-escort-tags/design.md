## Context

The current escort profile flow stores identity verification data on `EscortProfile`. A user submits an application with `idCardNo`, the profile starts as `PENDING`, and an admin can approve it. Approval sets `status=APPROVED`, `isVerified=true`, and promotes the user role to `ESCORT`. Public escort listing only returns approved and verified profiles.

The new requirement extends that flow with service capability tags. Tags must be supplied by the applicant and confirmed by an admin before approval can promote the user to escort.

The backend uses NestJS DTO validation with `ValidationPipe` and `whitelist: true`, so every new request field must have `class-validator` decorators. Swagger decorators alone are not sufficient.

## Goals / Non-Goals

**Goals:**

- Require at least one specialty/tag during escort profile application.
- Store tags directly on `EscortProfile` for the first version.
- Let admins view submitted tags while reviewing pending applications.
- Let admins edit and confirm final tags during approval.
- Prevent approval if final tags are empty.
- Keep user role promotion coupled to successful approval.
- Return confirmed tags in public escort profile responses.

**Non-Goals:**

- No separate tag dictionary table or tag management page.
- No patient-side tag filtering or search.
- No tag analytics or ranking.
- No dedicated post-approval tag maintenance flow.

## Decisions

### Store tags on `EscortProfile`

Use a single `EscortProfile` field for tags in the first version. The preferred Prisma type is `Json` because the project uses MySQL and the runtime shape can remain `string[]`.

Alternatives considered:

- Separate `EscortTag` and join table: more normalized, but it expands scope into tag dictionary management, deduplication, disabled tags, ordering, and filtering.
- Comma-separated text: simple, but weaker for validation and future migration.

Rationale: this change only needs application, admin confirmation, and public display. A JSON array keeps the implementation small while preserving a straightforward path to a normalized tag model later.

### Normalize tags in backend services

Backend service logic should normalize incoming tags by trimming strings, removing empty values, and deduplicating repeated values. Requests that normalize to an empty array must be rejected where tags are required.

Rationale: frontend validation improves UX, but backend normalization is the reliable boundary for API callers and admin edits.

### Validate tags in DTOs

`CreateProfileDto` must require tags. `ReviewEscortProfileDto` must require tags conditionally when `action=APPROVE`.

Validation should cover:

- array type
- at least one item when required
- string items
- non-empty trimmed values
- reasonable maximum tag count
- reasonable maximum tag length

Rationale: whitelist mode strips fields without `class-validator` decorators. Explicit validation prevents tags from silently disappearing.

### Approval writes final tags and promotes role in one flow

When approving, the admin-submitted final tags should be saved in the same transactional flow that marks the profile approved and promotes the user to `ESCORT`.

Rationale: the business rule says "final tags confirmed + admin approval" is the threshold for becoming an escort. Splitting role promotion from tag persistence could create partially approved profiles.

### Public list exposes only confirmed tags

The public escort profile endpoint should return tags only for approved and verified profiles. Sensitive fields such as `idCardNo` remain excluded.

Rationale: submitted tags are not public until admin approval confirms them.

## Risks / Trade-offs

- JSON tags are less queryable than normalized tags -> acceptable for first version because filtering/search is explicitly out of scope.
- Existing approved escort profiles may have no tags after schema migration -> migration should default to an empty array or equivalent JSON value, and public UI should handle missing/empty tags defensively.
- Conditional DTO validation can be easy to get wrong -> add explicit service-level approval guard so `APPROVE` cannot proceed with empty final tags.
- Frontend chip input can add interaction complexity -> keep first version compact and predictable, for example enter/comma separated tags with removable chips.

## Migration Plan

1. Add the tags field to `EscortProfile`.
2. Regenerate Prisma client.
3. Apply database migration or push schema depending on the local workflow.
4. Update backend DTOs and services.
5. Update frontend API types and UI.
6. Verify application, approval, rejection, and public listing scenarios.

Rollback strategy: remove the frontend tag UI and backend tag requirements before rolling back the database field. Existing profile approval behavior can then return to the current id-card-only flow.

## Open Questions

- Final tag count limit: suggested default is 10.
- Final tag length limit: suggested default is 20 characters.
- UI labels: suggested Chinese label is `擅长服务`, English label is `Specialties`.
