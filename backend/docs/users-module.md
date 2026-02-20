# Users Module (School Admin Settings)

## Endpoints
- `GET /users`
  - Query: `q?`, `role?`, `status?` (`ACTIVE|INACTIVE`), `page`, `limit`
  - Response: `{ items, total, page, limit, totalPages }`
- `POST /users`
  - Body: `{ name, email, role }`
  - Response: `{ user, tempPassword }`
- `PATCH /users/:id`
  - Body: `{ name?, role?, isActive? }`
  - Response: `user dto`
- `POST /users/:id/reset-password`
  - Response: `{ user, tempPassword }`
- `DELETE /users/:id`
  - Soft deactivate user (`isActive=false`)
  - Response: `{ ok: true }`

## Security
- All endpoints require school access token and tenant context.
- RBAC permissions:
  - `users.list`: `SCHOOL_ADMIN`, `ACCOUNTANT`, `TEACHER` (view only)
  - `users.create`: `SCHOOL_ADMIN`, `ACCOUNTANT`
  - `users.update`: `SCHOOL_ADMIN`, `ACCOUNTANT`
  - `users.resetPassword`: `SCHOOL_ADMIN`, `ACCOUNTANT`
  - `users.delete`: `SCHOOL_ADMIN`, `ACCOUNTANT`

## Tenant Isolation
- Data access uses tenant-scoped repo helpers (`tenantModel` wrappers).
- User list/read/update/reset operations are scoped by `tenantId`.
- Soft-delete is also tenant-scoped and only deactivates within the same tenant.

## Safety Guardrails
- A user cannot deactivate their own account.
- The last active `SCHOOL_ADMIN` in a tenant cannot be demoted/deactivated.
- Admin reset-password endpoint rejects self-reset; users must use change-password for their own account.

## Audit Logging
- Minimal audit records are written on user management actions:
  - `USER_CREATED`
  - `USER_UPDATED`
  - `USER_PASSWORD_RESET`
  - `USER_DEACTIVATED`
- Audit log shape:
  - `tenantId`, `actorUserId`, `action`, `targetUserId`, `createdAt`
- Collection/model:
  - `UserAuditLog`

## Migration Notes
- Added new Mongo collection: `userauditlogs` (Mongoose model `UserAuditLog`).
- No API response shape changes for users endpoints.
- New guard behavior:
  - `POST /users/:id/reset-password` returns `400` when attempting to reset your own password via admin endpoint.

## Backend Foundation
- User model fields:
  - `tenantId`, `name`, `email`, `role`, `passwordHash`, `isActive`, `mustChangePassword`, `createdAt`, `updatedAt`
- User indexes:
  - unique `{ tenantId: 1, email: 1 }`
  - `{ tenantId: 1, role: 1 }`
  - `{ tenantId: 1, isActive: 1 }`
  - `{ tenantId: 1, createdAt: -1 }`
- DTO mapper:
  - API/service outputs use `toUserDto` and never return raw mongoose documents.
- Service methods:
  - `createUserWithTempPassword(tenantId, payload)` -> `{ user, tempPassword }` (`mustChangePassword=true`)
  - `resetUserPassword(tenantId, userId)` -> `{ user, tempPassword }` (`mustChangePassword=true`)
  - `updateUser(tenantId, userId, patch)` -> `user dto`
  - `listUsers(tenantId, filters, pagination)` -> `{ items, total, page, limit, totalPages }`

## Enterprise Service
- File: `src/modules/users/user.service.ts`
- Signatures:
  - `listUsers(tenantId, filters, page, limit)` -> `{ items, total, page, limit, totalPages }`
  - `createUserWithTempPassword(tenantId, payload)` -> `{ user, tempPassword }`
  - `updateUser(tenantId, userId, patch)` -> `user dto`
  - `resetUserPassword(tenantId, userId)` -> `{ tempPassword }`
  - `deactivateUser(tenantId, userId)` -> `{ ok: true }`
- Guarantees:
  - Tenant isolation via tenant-scoped repo methods
  - Passwords hashed with shared password util
  - `mustChangePassword=true` on create/reset
  - DTO outputs never expose `passwordHash`

## Frontend Route
- `/{locale}/school/dashboard/settings/users`
