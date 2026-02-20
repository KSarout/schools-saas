import { z } from "zod";
import { apiGet, apiPost } from "@/lib/apiClient";

/* -----------------------------
 * Schemas
 * ---------------------------- */

export const SchoolRoleSchema = z.enum(["SCHOOL_ADMIN", "TEACHER", "ACCOUNTANT"]);

export const SchoolUserSchema = z.object({
    id: z.string(),
    name: z.string(),
    email: z.string().email(),
    role: SchoolRoleSchema,
    mustChangePassword: z.boolean().optional(),
});

export const SchoolTenantSchema = z.object({
    id: z.string(),
    name: z.string(),
    slug: z.string(),
});

export const SchoolLoginResponseSchema = z.object({
    accessToken: z.string(),
    refreshToken: z.string(),
    mustChangePassword: z.boolean(),
    user: SchoolUserSchema,
    tenant: SchoolTenantSchema,
});

export const SchoolMeResponseSchema = z.object({
    user: SchoolUserSchema.extend({
        mustChangePassword: z.boolean(), // /me always returns this
    }),
    tenant: SchoolTenantSchema,
});

export const OkSchema = z.object({ ok: z.literal(true) });
export const TokenPairSchema = z.object({
    accessToken: z.string(),
    refreshToken: z.string(),
});

/* -----------------------------
 * Types
 * ---------------------------- */

export type SchoolRole = z.infer<typeof SchoolRoleSchema>;
export type SchoolUserDto = z.infer<typeof SchoolUserSchema>;
export type SchoolTenantDto = z.infer<typeof SchoolTenantSchema>;
export type SchoolLoginResponse = z.infer<typeof SchoolLoginResponseSchema>;
export type SchoolMeResponse = z.infer<typeof SchoolMeResponseSchema>;

export type SchoolLoginInput = {
    tenantSlug: string;
    email: string;
    password: string;
};

export type ChangePasswordInput = {
    currentPassword: string;
    newPassword: string;
};

/* -----------------------------
 * Helpers
 * ---------------------------- */

function normalizeTenantSlug(slug: string) {
    return slug.trim().toLowerCase();
}

function normalizeEmail(email: string) {
    return email.trim().toLowerCase();
}

/* -----------------------------
 * API
 * ---------------------------- */

// LOGIN: must send X-Tenant explicitly (do NOT depend on store/interceptor timing)
export async function schoolLogin(input: SchoolLoginInput) {
    const tenantSlug = normalizeTenantSlug(input.tenantSlug);
    const email = normalizeEmail(input.email);

    return apiPost(
        "/auth/login",
        { email, password: input.password },
        SchoolLoginResponseSchema,
        {
            headers: { "X-Tenant": tenantSlug },
        }
    );
}

export async function schoolMe() {
    return apiGet("/auth/me", SchoolMeResponseSchema);
}

export async function changePassword(input: ChangePasswordInput) {
    return apiPost("/auth/change-password", input, OkSchema);
}

export async function schoolRefresh(refreshToken: string) {
    return apiPost("/auth/refresh", { refreshToken }, TokenPairSchema);
}

export async function schoolLogout(refreshToken: string) {
    return apiPost("/auth/logout", { refreshToken }, OkSchema);
}
