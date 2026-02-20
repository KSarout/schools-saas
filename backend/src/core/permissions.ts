import type { SchoolRole } from "../types/jwt";

export type SuperAdminRole = "SUPER_ADMIN";

export const schoolPermissionMatrix = {
    "auth.me": ["SCHOOL_ADMIN", "TEACHER", "ACCOUNTANT"],
    "auth.changePassword": ["SCHOOL_ADMIN", "TEACHER", "ACCOUNTANT"],
    "students.create": ["SCHOOL_ADMIN", "ACCOUNTANT"],
    "students.list": ["SCHOOL_ADMIN", "TEACHER", "ACCOUNTANT"],
    "students.read": ["SCHOOL_ADMIN", "TEACHER", "ACCOUNTANT"],
    "students.update": ["SCHOOL_ADMIN", "ACCOUNTANT"],
    "students.delete": ["SCHOOL_ADMIN", "ACCOUNTANT"],
    "users.list": ["SCHOOL_ADMIN", "ACCOUNTANT", "TEACHER"],
    "users.create": ["SCHOOL_ADMIN", "ACCOUNTANT"],
    "users.update": ["SCHOOL_ADMIN", "ACCOUNTANT"],
    "users.resetPassword": ["SCHOOL_ADMIN", "ACCOUNTANT"],
    "users.delete": ["SCHOOL_ADMIN", "ACCOUNTANT"],
} as const satisfies Record<string, readonly SchoolRole[]>;

export const superAdminPermissionMatrix = {
    "superAdmin.me": ["SUPER_ADMIN"],
    "superAdmin.tenants.create": ["SUPER_ADMIN"],
    "superAdmin.tenants.list": ["SUPER_ADMIN"],
    "superAdmin.tenants.resetPassword": ["SUPER_ADMIN"],
    "superAdmin.users.list": ["SUPER_ADMIN"],
    "superAdmin.users.create": ["SUPER_ADMIN"],
    "superAdmin.users.update": ["SUPER_ADMIN"],
    "superAdmin.users.resetPassword": ["SUPER_ADMIN"],
} as const satisfies Record<string, readonly SuperAdminRole[]>;

export type SchoolPermission = keyof typeof schoolPermissionMatrix;
export type SuperAdminPermission = keyof typeof superAdminPermissionMatrix;

export const routePermissionMatrix = {
    "POST /auth/login": null,
    "POST /auth/refresh": null,
    "POST /auth/logout": null,
    "GET /auth/me": "auth.me",
    "POST /auth/change-password": "auth.changePassword",
    "POST /students": "students.create",
    "GET /students": "students.list",
    "GET /students/:id": "students.read",
    "PATCH /students/:id": "students.update",
    "DELETE /students/:id": "students.delete",
    "GET /users": "users.list",
    "POST /users": "users.create",
    "PATCH /users/:id": "users.update",
    "POST /users/:id/reset-password": "users.resetPassword",
    "DELETE /users/:id": "users.delete",
    "POST /super-admin/login": null,
    "POST /super-admin/refresh": null,
    "POST /super-admin/logout": null,
    "GET /super-admin/me": "superAdmin.me",
    "POST /super-admin/tenants": "superAdmin.tenants.create",
    "GET /super-admin/tenants": "superAdmin.tenants.list",
    "POST /super-admin/tenants/:tenantId/reset-password": "superAdmin.tenants.resetPassword",
    "GET /super-admin/users": "superAdmin.users.list",
    "POST /super-admin/users": "superAdmin.users.create",
    "PATCH /super-admin/users/:id": "superAdmin.users.update",
    "POST /super-admin/users/:id/reset-password": "superAdmin.users.resetPassword",
} as const;
