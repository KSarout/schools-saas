import { apiDelete, apiGet, apiPatch, apiPost } from "@/lib/apiClient";
import {
    type CreateSchoolUserPayload,
    type CreateSchoolUserResponse,
    CreateSchoolUserResponseSchema,
    type ListSchoolUsersParams,
    type OkResponse,
    OkResponseSchema,
    type ResetSchoolUserPasswordResponse,
    ResetSchoolUserPasswordResponseSchema,
    type SchoolUserDto,
    SchoolUserSchema,
    type SchoolUsersListResponse,
    SchoolUsersListResponseSchema,
    type UpdateSchoolUserPayload,
} from "@/features/school-users/api/schoolUsers.dto";

export async function listSchoolUsers(params: ListSchoolUsersParams) {
    const queryString = new URLSearchParams();
    if (params.q?.trim()) queryString.set("q", params.q.trim());
    if (params.role) queryString.set("role", params.role);
    if (params.status) queryString.set("status", params.status);
    queryString.set("page", String(params.page));
    queryString.set("limit", String(params.limit));

    return apiGet<SchoolUsersListResponse>(`/users?${queryString.toString()}`, SchoolUsersListResponseSchema);
}

export const listUsers = listSchoolUsers;

export async function createSchoolUser(payload: CreateSchoolUserPayload) {
    return apiPost<CreateSchoolUserPayload, CreateSchoolUserResponse>(
        "/users",
        payload,
        CreateSchoolUserResponseSchema
    );
}

export const createUser = createSchoolUser;

export async function updateSchoolUser(id: string, payload: UpdateSchoolUserPayload) {
    return apiPatch<UpdateSchoolUserPayload, SchoolUserDto>(`/users/${id}`, payload, SchoolUserSchema);
}

export const updateUser = updateSchoolUser;

export async function resetSchoolUserPassword(id: string) {
    return apiPost<undefined, ResetSchoolUserPasswordResponse>(
        `/users/${id}/reset-password`,
        undefined,
        ResetSchoolUserPasswordResponseSchema
    );
}

export const resetPassword = resetSchoolUserPassword;

export async function deactivateSchoolUser(id: string) {
    return apiDelete<OkResponse>(`/users/${id}`, OkResponseSchema);
}

export const deactivateUser = deactivateSchoolUser;
