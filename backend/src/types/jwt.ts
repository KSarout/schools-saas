export type SchoolRole = | "SCHOOL_ADMIN" | "TEACHER" | "ACCOUNTANT";

export interface SchoolJwtPayload {
    userId: string;
    tenantId: string;
    role: SchoolRole;
}

export interface SuperAdminJwtPayload {
    superAdminId: string;
    role: "SUPER_ADMIN";
}
