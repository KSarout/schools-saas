# Enrollment Hardening Verification

This checklist validates enrollment safety rules in tenant-scoped school APIs.

## Preconditions

- Create at least 2 tenants (`tenantA`, `tenantB`).
- Create school users:
  - `tenantA`: `SCHOOL_ADMIN`, `TEACHER`
  - `tenantB`: `SCHOOL_ADMIN`
- Seed `academic-year`, `class`, `section`, and `student` for both tenants.

## RBAC checks

1. Login as `TEACHER` in `tenantA`.
2. `GET /api/school/enrollments` returns `200`.
3. `GET /api/school/enrollments/student/:studentId/history` returns `200`.
4. `POST /api/school/enrollments/assign` returns `403`.
5. `POST /api/school/enrollments/transfer` returns `403`.
6. `POST /api/school/enrollments/promote` returns `403`.
7. `POST /api/school/enrollments/withdraw` returns `403`.

## Tenant isolation checks

1. Login as `tenantA` school admin.
2. Attempt `assign` with `studentId` from `tenantB` and valid `tenantA` year/class/section.
3. Expect `404` with `{ "error": "Student not found" }`.
4. Attempt `history` for `studentId` from another tenant.
5. Expect empty records or `404` depending on service behavior.

## Business rule checks

1. Assign duplicate active enrollment in same academic year.
   - Expect `409` with `{ "error": "Active enrollment already exists for this student in this academic year" }`.
2. Transfer with same class/section target.
   - Expect `400` with `{ "error": "Transfer target must be different from current class/section" }`.
3. Promote with same from/to academic year.
   - Expect `400` with `{ "error": "toAcademicYearId must be different from fromAcademicYearId" }`.
4. Transfer/promote/withdraw with no current active enrollment.
   - Expect `404` with `{ "error": "Active enrollment not found" }`.
5. Transfer/promote/withdraw with effectiveDate before current startDate.
   - Expect `400` with `{ "error": "effectiveDate cannot be before current enrollment startDate" }`.

## Automated commands

Run in backend:

```bash
npm run lint
npm run typecheck
npm run test
```

Run in frontend:

```bash
npm run lint
npm run typecheck
npm run test
```
