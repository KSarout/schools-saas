import { apiGet, apiPost } from "@/lib/apiClient";
import {
    CreateTenantPayload, CreateTenantResponse,
    ListTenantsParams, ListTenantsResponse, ResetTenantAdminPasswordPayload, ResetTenantAdminPasswordResponse,
    SuperAdminLoginPayload,
    SuperAdminLoginResponse,
    SuperAdminMeResponse
} from "@/features/super-admin/api/uperAdmin.dto";


export const superAdminApi = {
    login: (payload: SuperAdminLoginPayload) =>
        apiPost("/super-admin/login", payload, SuperAdminLoginResponse),

    me: () => apiGet("/super-admin/me", SuperAdminMeResponse),

    tenants: (params: ListTenantsParams) =>
        apiGet("/super-admin/tenants", ListTenantsResponse, { params }),

    createTenant: (payload: CreateTenantPayload) =>
        apiPost("/super-admin/tenants", payload, CreateTenantResponse),

    resetTenantAdminPassword: (payload: ResetTenantAdminPasswordPayload) =>
        apiPost(
            `/super-admin/tenants/${payload.tenantId}/reset-password`,
            undefined,
            ResetTenantAdminPasswordResponse
        ),
} as const;
