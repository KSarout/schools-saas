# Mongo Performance Audit and Index Plan

## Date
- 2026-02-20

## Scope
- Collections: `students`, `users`, `counters`, `tenants`
- Endpoints reviewed:
  - `GET /students`
  - `GET /super-admin/tenants`
  - auth login/me helpers
  - counter sequence generation

## Current query patterns
- `students`
  - List by tenant + status with pagination/sort by `createdAt desc`
  - Search by code/id/name/phone
  - Find by `_id` in tenant context
- `users`
  - Tenant-scoped lookup by `email` + `isActive`
  - Tenant-scoped lookup by `role` (school admin reset flow)
- `counters`
  - Tenant-scoped `findOneAndUpdate` by `key` (atomic sequence)
- `tenants`
  - Lookup by `slug` + `isActive`
  - List/search by name/slug with pagination and sort by `createdAt desc`

## Indexes added or adjusted
- `students`
  - `({ tenantId: 1, status: 1, createdAt: -1, _id: -1 })`
  - `({ tenantId: 1, studentCodeSearch: 1 })`
  - `({ tenantId: 1, studentIdSearch: 1 })`
  - `({ tenantId: 1, firstNameSearch: 1 })`
  - `({ tenantId: 1, lastNameSearch: 1 })`
  - `({ tenantId: 1, parentPhoneSearch: 1 })`
- `users`
  - `({ tenantId: 1, role: 1, isActive: 1 })`
- `tenants`
  - `({ createdAt: -1, _id: -1 })`
  - `({ slugSearch: 1, createdAt: -1, _id: -1 })`
  - `({ nameSearch: 1, createdAt: -1, _id: -1 })`

## Why these indexes are needed
- `students (tenantId,status,createdAt,_id)`
  - Supports the dominant list query with tenant/status filter and deterministic pagination sort.
- `students (tenantId,*Search)`
  - Supports prefix-search regex (`^term`) by tenant without full collection scans.
- `users (tenantId,role,isActive)`
  - Supports tenant admin lookup for password reset and future role-based user listing.
- `tenants (createdAt,_id)`
  - Supports list pagination without search and deterministic ordering.
- `tenants (*Search,createdAt,_id)`
  - Supports prefix search + sort in one plan for super-admin tenant listing.

## Query strategy changes
- Unanchored case-insensitive regex scans were replaced with escaped prefix regex on normalized lowercase search fields:
  - `studentCodeSearch`, `studentIdSearch`, `firstNameSearch`, `lastNameSearch`, `parentPhoneSearch`
  - `nameSearch`, `slugSearch`
- Pagination sorts now include `_id` tie-breakers:
  - Students: `{ createdAt: -1, _id: -1 }`
  - Tenants: `{ createdAt: -1, _id: -1 }`

## Notes
- Prefix search improves index use and latency but narrows matching semantics versus substring contains.
- Search fields are internal and hidden from query projections with `select: false`.
