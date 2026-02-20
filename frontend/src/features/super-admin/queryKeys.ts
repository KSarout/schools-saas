export const superAdminKeys = {
    all: ["super-admin"] as const,
    me: () => [...superAdminKeys.all, "me"] as const,
    tenants: (params: { q?: string; page?: number; limit?: number }) =>
        [...superAdminKeys.all, "tenants", params] as const,
    users: (params: { q?: string; status?: "ACTIVE" | "INACTIVE"; page?: number; limit?: number }) =>
        [...superAdminKeys.all, "users", params] as const,
};
