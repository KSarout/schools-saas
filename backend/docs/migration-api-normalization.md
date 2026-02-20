# Migration Note: API Response Normalization

## Date
- 2026-02-20

## What changed
- Error responses are now standardized to:
  - `{ "error": string, "details"?: unknown }`
- List responses are normalized to:
  - `{ "items": T[], "total": number, "page": number, "limit": number, "totalPages": number }`
- Duplicate-tenant create now returns `409 Conflict` instead of `400`.

## Affected endpoints
- School auth:
  - `POST /auth/login`
  - `POST /auth/refresh`
  - `POST /auth/logout`
  - `GET /auth/me`
  - `POST /auth/change-password`
- Super-admin:
  - `POST /super-admin/login`
  - `POST /super-admin/refresh`
  - `POST /super-admin/logout`
  - `GET /super-admin/me`
  - `POST /super-admin/tenants`
  - `GET /super-admin/tenants`
  - `POST /super-admin/tenants/:tenantId/reset-password`
- Students:
  - `POST /students`
  - `GET /students`
  - `GET /students/:id`
  - `PATCH /students/:id`
  - `DELETE /students/:id`

## Frontend updates
- Added a shared paginated-list zod schema helper:
  - `frontend/src/lib/schemas/listResponse.ts`
- Student and tenant list DTOs now derive from the same normalized schema.

## Compatibility guidance
- If your client parsed nested RBAC errors (`error.code/message`), switch to `error` string.
- If your client depended on endpoint-specific list envelope variants, switch to the normalized list contract above.
