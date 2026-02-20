# Feature-First Structure (Monorepo)

## Date
- 2026-02-20

## Backend target layout
- `src/modules/<feature>/routes/*`
- `src/modules/<feature>/service/*`
- `src/modules/<feature>/model/*`
- `src/modules/<feature>/dto/*`
- `src/modules/<feature>/tests/*`
- `src/core/*` for infra concerns (`db`, `config`, `error`, tenant helpers, response helpers)
- `src/types/*` for shared typing contracts

## Frontend target layout
- `src/features/<feature>/api/*`
- `src/features/<feature>/dto/*` (where present)
- `src/features/<feature>/hooks/*`
- `src/features/<feature>/components/*`
- app routes are thin shells that compose feature components
- query keys centralized per feature (`queryKeys.ts`)
- API IO parsed with Zod schemas

## Notes
- This refactor is structural (move/import updates), with no intended product behavior changes.
- Build and typecheck are validated after moves.
