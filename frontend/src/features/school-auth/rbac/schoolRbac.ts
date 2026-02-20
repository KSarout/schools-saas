import type { SchoolRole } from "@/features/school-auth/api/schoolAuth.api";

export const SchoolPermissions = {
    manageStudents: ["SCHOOL_ADMIN", "ACCOUNTANT"] as const satisfies readonly SchoolRole[],
    manageUsers: ["SCHOOL_ADMIN", "ACCOUNTANT"] as const satisfies readonly SchoolRole[],
} as const;

export function can(role: SchoolRole | undefined | null, allowed: readonly SchoolRole[]) {
    if (!role) return false;
    return allowed.includes(role);
}
