# Settings Foundation: Academic Years, Classes, Sections

This change adds backend foundation modules only (no routes yet):

- `src/modules/academic-years`
- `src/modules/classes`
- `src/modules/sections`

## Data and Tenant Safety

All models require `tenantId` and use `mongooseTenantPlugin`, so tenant-scoped queries must provide `.setOptions({ tenantId })`.

Soft delete is normalized to `isActive=false`.

## Uniqueness Decisions

AcademicYear uniqueness uses `{ tenantId, code }` (unique), not `{ tenantId, name }`.

Reason:

- `code` is stable and system-oriented (safe for references/imports)
- `name` is user-facing and more likely to change for display/localization

Class uniqueness uses `{ tenantId, academicYearId, code }`.

Section uniqueness uses `{ tenantId, classId, code }`.

## Current Academic Year Guard

`AcademicYear` has a partial unique index to allow only one current row per tenant:

- `{ tenantId: 1, isCurrent: 1 }` with `partialFilterExpression: { isCurrent: true }`

When a year is set to current in service, previous current rows are unset and target year is set current in a Mongo transaction (`withTransaction`) for atomic behavior.

## Service Layer

Each module provides:

- enterprise list function returning `{ items, total, page, limit, totalPages }`
- create/update/deactivate functions
- DTO mappers that never expose raw Mongoose docs

## Route Surface (implemented in next PR)

- `GET /academic-years`, `GET /academic-years/:id`, `POST /academic-years`, `PATCH /academic-years/:id`, `POST /academic-years/:id/set-current`, `DELETE /academic-years/:id`
- `GET /classes`, `GET /classes/:id`, `POST /classes`, `PATCH /classes/:id`, `DELETE /classes/:id`
- `GET /sections`, `GET /sections/:id`, `POST /sections`, `PATCH /sections/:id`, `DELETE /sections/:id`

RBAC:

- Read (`GET`): `SCHOOL_ADMIN`, `ACCOUNTANT`, `TEACHER`
- Mutations (`POST`, `PATCH`, `DELETE`): `SCHOOL_ADMIN`, `ACCOUNTANT`
