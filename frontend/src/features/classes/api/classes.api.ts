import { apiDelete, apiGet, apiPatch, apiPost } from "@/lib/apiClient";
import {
    ClassSchema,
    ClassesListResponseSchema,
    type ClassDto,
    type ClassesListResponse,
    type CreateClassPayload,
    type ListClassesParams,
    OkResponseSchema,
    type OkResponse,
    type UpdateClassPayload,
} from "@/features/classes/api/classes.dto";

export async function listClasses(params: ListClassesParams) {
    const queryString = new URLSearchParams();
    if (params.q?.trim()) queryString.set("q", params.q.trim());
    if (params.academicYearId) queryString.set("academicYearId", params.academicYearId);
    if (typeof params.isActive === "boolean") queryString.set("isActive", String(params.isActive));
    queryString.set("page", String(params.page));
    queryString.set("limit", String(params.limit));

    return apiGet<ClassesListResponse>(`/classes?${queryString.toString()}`, ClassesListResponseSchema);
}

export async function getClassById(id: string) {
    return apiGet<ClassDto>(`/classes/${id}`, ClassSchema);
}

export async function createClass(payload: CreateClassPayload) {
    return apiPost<CreateClassPayload, ClassDto>("/classes", payload, ClassSchema);
}

export async function updateClass(id: string, payload: UpdateClassPayload) {
    return apiPatch<UpdateClassPayload, ClassDto>(`/classes/${id}`, payload, ClassSchema);
}

export async function deactivateClass(id: string) {
    return apiDelete<OkResponse>(`/classes/${id}`, OkResponseSchema);
}
