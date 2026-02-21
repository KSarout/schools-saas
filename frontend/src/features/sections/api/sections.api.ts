import { apiDelete, apiGet, apiPatch, apiPost } from "@/lib/apiClient";
import {
    type CreateSectionPayload,
    type ListSectionsParams,
    OkResponseSchema,
    type OkResponse,
    SectionSchema,
    SectionsListResponseSchema,
    type SectionDto,
    type SectionsListResponse,
    type UpdateSectionPayload,
} from "@/features/sections/api/sections.dto";

export async function listSections(params: ListSectionsParams) {
    const queryString = new URLSearchParams();
    if (params.q?.trim()) queryString.set("q", params.q.trim());
    if (params.classId) queryString.set("classId", params.classId);
    if (typeof params.isActive === "boolean") queryString.set("isActive", String(params.isActive));
    queryString.set("page", String(params.page));
    queryString.set("limit", String(params.limit));

    return apiGet<SectionsListResponse>(`/sections?${queryString.toString()}`, SectionsListResponseSchema);
}

export async function getSectionById(id: string) {
    return apiGet<SectionDto>(`/sections/${id}`, SectionSchema);
}

export async function createSection(payload: CreateSectionPayload) {
    return apiPost<CreateSectionPayload, SectionDto>("/sections", payload, SectionSchema);
}

export async function updateSection(id: string, payload: UpdateSectionPayload) {
    return apiPatch<UpdateSectionPayload, SectionDto>(`/sections/${id}`, payload, SectionSchema);
}

export async function deactivateSection(id: string) {
    return apiDelete<OkResponse>(`/sections/${id}`, OkResponseSchema);
}
