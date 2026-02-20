import { apiGet, apiPatch, apiPost } from "@/lib/apiClient";
import {
    CreateSuperAdminUserPayload,
    CreateSuperAdminUserResponse,
    CreateTenantPayload, CreateTenantResponse,
    ListSuperAdminUsersParams,
    ListSuperAdminUsersResponse,
    ListTenantsParams, ListTenantsResponse, ResetTenantAdminPasswordPayload, ResetTenantAdminPasswordResponse,
    OkResponse,
    ResetSuperAdminUserPasswordResponse,
    SuperAdminLoginPayload,
    SuperAdminLoginResponse,
    SuperAdminMeResponse,
    SuperAdminTokenPairResponse,
    SuperAdminUser,
    UpdateSuperAdminUserPayload
} from "@/features/super-admin/api/uperAdmin.dto";


export const superAdminApi = {
    login: (payload: SuperAdminLoginPayload) =>
        apiPost("/super-admin/login", payload, SuperAdminLoginResponse),

    refresh: (refreshToken: string) =>
        apiPost("/super-admin/refresh", { refreshToken }, SuperAdminTokenPairResponse),

    logout: (refreshToken: string) =>
        apiPost("/super-admin/logout", { refreshToken }, OkResponse),

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

    users: (params: ListSuperAdminUsersParams) =>
        apiGet("/super-admin/users", ListSuperAdminUsersResponse, { params }),

    createUser: (payload: CreateSuperAdminUserPayload) =>
        apiPost("/super-admin/users", payload, CreateSuperAdminUserResponse),

    updateUser: (id: string, payload: UpdateSuperAdminUserPayload) =>
        apiPatch(`/super-admin/users/${id}`, payload, SuperAdminUser),

    resetUserPassword: (id: string) =>
        apiPost(`/super-admin/users/${id}/reset-password`, undefined, ResetSuperAdminUserPasswordResponse),
} as const;
