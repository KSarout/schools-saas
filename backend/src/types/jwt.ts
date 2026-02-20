export type SchoolRole = | "SCHOOL_ADMIN" | "TEACHER" | "ACCOUNTANT";
export type AuthTokenType = "access" | "refresh";
export type AuthDomain = "school" | "super_admin";

export interface SchoolJwtPayload {
    userId: string;
    tenantId: string;
    role: SchoolRole;
}

export interface SuperAdminJwtPayload {
    superAdminId: string;
    role: "SUPER_ADMIN";
}

export interface SchoolAccessJwtPayload extends SchoolJwtPayload {
    tokenType: "access";
    domain: "school";
}

export interface SchoolRefreshJwtPayload extends SchoolJwtPayload {
    tokenType: "refresh";
    domain: "school";
    tokenId: string;
}

export interface SuperAdminAccessJwtPayload extends SuperAdminJwtPayload {
    tokenType: "access";
    domain: "super_admin";
}

export interface SuperAdminRefreshJwtPayload extends SuperAdminJwtPayload {
    tokenType: "refresh";
    domain: "super_admin";
    tokenId: string;
}
