## 1. Database

- [x] 1.1 Add a `tags` field to `EscortProfile` in `packages/database/prisma/schema.prisma`.
- [x] 1.2 Choose Prisma `Json` storage and document the runtime shape as `string[]`.
- [x] 1.3 Regenerate the Prisma client after the schema update.

## 2. Backend Validation

- [x] 2.1 Add required `tags` validation to `CreateProfileDto`.
- [x] 2.2 Add conditional `tags` validation to `ReviewEscortProfileDto` for `action=APPROVE`.
- [x] 2.3 Ensure every new DTO field has `class-validator` decorators so whitelist mode does not strip it.
- [x] 2.4 Keep Swagger metadata aligned with the validation rules.

## 3. Backend Services

- [x] 3.1 Add a shared tag normalization path that trims values, removes empty values, and deduplicates tags.
- [x] 3.2 Save submitted tags when creating an escort profile application.
- [x] 3.3 Include submitted tags in the admin pending escort profile list.
- [x] 3.4 Reject approval attempts when final tags normalize to an empty array.
- [x] 3.5 Save final tags during approval in the same transaction that approves the profile and promotes the user to `ESCORT`.
- [x] 3.6 Include confirmed tags in public escort profile results while keeping sensitive fields excluded.

## 4. Frontend API Types

- [x] 4.1 Add tags to escort profile API response types.
- [x] 4.2 Add tags to the escort application request payload.
- [x] 4.3 Add tags to the admin review payload.

## 5. Applicant UI

- [x] 5.1 Add a required specialties/tags input to the escort application page.
- [x] 5.2 Validate that at least one tag is present before submitting.
- [x] 5.3 Submit tags together with `idCardNo`.
- [x] 5.4 Add Chinese and English i18n text for tag labels, placeholders, and validation messages.

## 6. Admin UI

- [x] 6.1 Show submitted tags in the pending escort profile list.
- [x] 6.2 Let admins edit or confirm final tags before approving.
- [x] 6.3 Prevent approval when final tags are empty.
- [x] 6.4 Submit final tags with the approve request.

## 7. Public Escort UI

- [x] 7.1 Render confirmed tags on public escort cards.
- [x] 7.2 Keep the card UI compact and avoid adding tag filtering in this change.

## 8. Verification

- [x] 8.1 Verify applying without tags is rejected.
- [x] 8.2 Verify applying with tags creates a pending profile with tags.
- [x] 8.3 Verify the admin pending list includes submitted tags.
- [x] 8.4 Verify approving without final tags is rejected.
- [x] 8.5 Verify approving with final tags promotes the user to `ESCORT`.
- [x] 8.6 Verify public escort results return and display confirmed tags.
