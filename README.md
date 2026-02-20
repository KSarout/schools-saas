# Schools SaaS (Cambodia)

Monorepo project:

- backend (Node.js / Express / MongoDB)
- frontend (Next.js / Tailwind / shadcn)

## Run backend
cd backend
npm install
npm run dev

## Run frontend
cd frontend
npm install
npm run dev

## Environment
- Backend env contract: `backend/.env.example`
- Runtime validation is enforced in `backend/src/core/config.ts` via Zod.

## Quality checks
### Backend
cd backend
npm run lint
npm run typecheck
npm run test

## Tenant isolation pattern (backend)
- Tenant-bound models (`User`, `Student`, `Counter`) use `mongooseTenantPlugin`.
- Tenant reads/writes must go through `backend/src/core/tenantModel.ts` helpers.
- Route handlers should call module repos (`*.repo.ts`) instead of direct tenant model queries.

## RBAC source of truth (backend)
- Permission matrix: `backend/src/core/permissions.ts`
- Route middleware: `requireSchoolPermission(...)` and `requireSuperAdminPermission(...)`

## Auth docs
- Token claims, refresh rotation, and logout revocation:
  - `backend/docs/auth.md`

## API migration notes
- Response normalization (errors + list envelopes):
  - `backend/docs/migration-api-normalization.md`
- Mongo performance and index audit:
  - `backend/docs/mongo-performance-indexes.md`
- Feature-first structure guide:
  - `backend/docs/feature-first-structure.md`
- Users settings module:
  - `backend/docs/users-module.md`
- Deployment notes:
  - `backend/docs/deployment.md`
- Production checklist:
  - `backend/docs/production-checklist.md`

## Production Checklist
- Use `backend/.env.example` as the source-of-truth env contract.
- Verify runtime env validation in `backend/src/core/config.ts`.
- Keep CORS allowlist explicit via `CORS_ALLOWED_ORIGINS`.
- Enable request correlation + structured logging (`backend/src/middlewares/requestContext.ts`, `backend/src/core/logger.ts`).
- Verify `/health` and `/ready` endpoints in your orchestrator.
- Ensure CI is green in `.github/workflows/ci.yml`.
- Run deployment steps from `backend/docs/deployment.md`.

### Frontend
cd frontend
npm run lint
npm run typecheck
