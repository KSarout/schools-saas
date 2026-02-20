import { apiGet, apiPatch, apiPost } from "@/lib/apiClient";
import {
    type CreateUserPayload,
    CreateUserResponseSchema,
    type ListUsersParams,
    type ResetUserPasswordResponse,
    ResetUserPasswordResponseSchema,
    type UpdateUserPayload,
    type UserDto,
    UserSchema,
    type UsersListResponse,
    UsersListResponseSchema,
} from "@/features/users/dto/users.dto";

export async function listUsers(params: ListUsersParams) {
    const qs = new URLSearchParams();
    if (params.q?.trim()) qs.set("q", params.q.trim());
    if (params.role) qs.set("role", params.role);
    if (params.status) qs.set("status", params.status);
    qs.set("page", String(params.page));
    qs.set("limit", String(params.limit));

    return apiGet<UsersListResponse>(`/users?${qs.toString()}`, UsersListResponseSchema);
}

export async function createUser(payload: CreateUserPayload) {
    return apiPost<CreateUserPayload, { user: UserDto; tempPassword: string }>(
        "/users",
        payload,
        CreateUserResponseSchema
    );
}

export async function updateUser(id: string, payload: UpdateUserPayload) {
    return apiPatch<UpdateUserPayload, UserDto>(`/users/${id}`, payload, UserSchema);
}

export async function resetUserPassword(id: string) {
    return apiPost<undefined, ResetUserPasswordResponse>(
        `/users/${id}/reset-password`,
        undefined,
        ResetUserPasswordResponseSchema
    );
}
