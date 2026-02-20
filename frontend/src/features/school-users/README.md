# School Users Feature

Feature package for School Admin user management API integration.

## Files
- `api/schoolUsers.dto.ts`: zod schemas + TypeScript types
- `api/schoolUsers.api.ts`: typed API calls with schema validation
- `hooks/schoolUsers.keys.ts`: centralized React Query keys
- `hooks/useSchoolUsers.ts`: list/create/update/reset/deactivate hooks
- `components/SchoolUsersPageView.tsx`: school settings users screen
- `components/SchoolUserFormDialog.tsx`: create/edit dialog
- `components/ResetSchoolUserPasswordDialog.tsx`: reset-password dialog

## Usage
```ts
import { useSchoolUsersList, useCreateSchoolUser } from "@/features/school-users/hooks/useSchoolUsers";

const usersQuery = useSchoolUsersList({ page: 1, limit: 10 });
const createUser = useCreateSchoolUser();
```

## Cache Invalidation Strategy
- Create: invalidates all list queries
- Update: invalidates list queries + user detail query
- Reset password: invalidates user detail query
- Deactivate: invalidates list queries

All list responses are validated as enterprise shape:
`{ items, total, page, limit, totalPages }`.
