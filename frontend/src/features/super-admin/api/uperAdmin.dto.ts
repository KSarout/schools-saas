import {z} from "zod";

/*
|--------------------------------------------------------------------------
| Types / Enums
|--------------------------------------------------------------------------
*/

export const SuperAdminRole = z.literal("SUPER_ADMIN");
export type SuperAdminRole = z.infer<typeof SuperAdminRole>;

export const TenantPlan = z.enum(["FREE", "BASIC", "PRO"]);
export type TenantPlan = z.infer<typeof TenantPlan>;

/*
|--------------------------------------------------------------------------
| Common Models
|--------------------------------------------------------------------------
*/

export const SuperAdmin = z.object({
    id: z.string(),
    email: z.string().email(),
});
export type SuperAdmin = z.infer<typeof SuperAdmin>;

export const TenantListItem = z.object({
    id: z.string(),
    name: z.string(),
    slug: z.string(),
    isActive: z.boolean(),
    plan: TenantPlan.optional(),
    createdAt: z.string().optional(),
});
export type TenantListItem = z.infer<typeof TenantListItem>;

/*
|--------------------------------------------------------------------------
| Auth
|--------------------------------------------------------------------------
*/

export const SuperAdminLoginPayload = z.object({
    email: z.string().email(),
    password: z.string().min(1),
});
export type SuperAdminLoginPayload = z.infer<typeof SuperAdminLoginPayload>;

export const SuperAdminLoginResponse = z.object({
    accessToken: z.string(),
    superAdmin: SuperAdmin,
});
export type SuperAdminLoginResponse = z.infer<typeof SuperAdminLoginResponse>;

export const SuperAdminMeResponse = z.object({
    superAdmin: SuperAdmin,
});
export type SuperAdminMeResponse = z.infer<typeof SuperAdminMeResponse>;

/*
|--------------------------------------------------------------------------
| Tenants
|--------------------------------------------------------------------------
*/

export const ListTenantsParams = z.object({
    q: z.string().optional(),
    page: z.number().int().positive().optional(),
    limit: z.number().int().positive().optional(),
});
export type ListTenantsParams = z.infer<typeof ListTenantsParams>;

export const ListTenantsResponse = z.object({
    items: z.array(TenantListItem),
    total: z.number(),
    page: z.number(),
    limit: z.number(),
    totalPages: z.number(),
});
export type ListTenantsResponse = z.infer<typeof ListTenantsResponse>;

export const CreateTenantPayload = z.object({
    tenantName: z.string().min(2),
    tenantSlug: z.string().min(2),
    adminName: z.string().min(2),
    adminEmail: z.string().email(),
});
export type CreateTenantPayload = z.infer<typeof CreateTenantPayload>;

export const CreateTenantResponse = z.object({
    tenant: z.object({
        id: z.string(),
        name: z.string(),
        slug: z.string(),
    }),
    schoolAdmin: z.object({
        id: z.string(),
        email: z.string().email(),
        tempPassword: z.string(),
    }),
});
export type CreateTenantResponse = z.infer<typeof CreateTenantResponse>;

export const ResetTenantAdminPasswordPayload = z.object({
    tenantId: z.string().min(1),
});
export type ResetTenantAdminPasswordPayload = z.infer<
    typeof ResetTenantAdminPasswordPayload
>;

export const ResetTenantAdminPasswordResponse = z.object({
    adminEmail: z.string().email(),
    tempPassword: z.string(),
});
export type ResetTenantAdminPasswordResponse = z.infer<
    typeof ResetTenantAdminPasswordResponse
>;
