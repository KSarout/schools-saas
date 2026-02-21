# Students Structure Migration (AcademicYear/Class/Section)

This migration introduces optional references on `Student` for structured placement:

- `academicYearId`
- `classId`
- `sectionId`

## Current behavior (safe rollout)

- New fields are optional (no breaking change to existing student create/edit).
- Existing `grade` and `section` string fields remain required and unchanged.
- API accepts optional assignment IDs when provided.

## Validation rules (tenant-scoped)

When assignment IDs are sent:

- `sectionId` requires `classId`
- `classId` requires `academicYearId`
- Section must belong to class
- Class must belong to academic year

All checks are tenant-isolated and query through tenant-scoped models.

## Incremental rollout phases

1. Phase 1 (done): optional fields + backend validation + UI optional selectors.
2. Phase 2: backfill existing students from legacy grade/section into structured IDs.
3. Phase 3: enforce required assignment IDs for newly created students only.

## Backfill script

Script path:

- `src/scripts/migrations/backfillStudentPlacement.ts`

NPM command:

- Dry-run all tenants:
  - `npm run migrate:students:placement`
- Apply all tenants:
  - `npm run migrate:students:placement -- --apply`
- Dry-run one tenant:
  - `npm run migrate:students:placement -- --tenantId=<tenantObjectId>`
- Apply one tenant with cap:
  - `npm run migrate:students:placement -- --apply --tenantId=<tenantObjectId> --limit=500`

The script is tenant-scoped, validates class/section/year relationships before writing, and logs unresolved records for manual cleanup.

## Future enforcement guidance

For phase 3, strict create validation is gated by:

- `STUDENTS_REQUIRE_STRUCTURE_ON_CREATE`

Default is `false`. Set it to `true` after backfill coverage is acceptable.
