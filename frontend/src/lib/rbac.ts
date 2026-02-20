export type Role = "SUPER_ADMIN" | "SCHOOL_ADMIN" | "TEACHER" | "FINANCE"

export function canAccess(userRole: Role, allowedRoles: Role[]) {
    return allowedRoles.includes(userRole)
}
