import { apiDelete, apiGet, apiPatch, apiPost } from "@/lib/apiClient";
import {
    AcademicYearSchema,
    AcademicYearsListResponseSchema,
    type AcademicYearDto,
    type AcademicYearsListResponse,
    type CreateAcademicYearPayload,
    OkResponseSchema,
    type OkResponse,
    type ListAcademicYearsParams,
    type UpdateAcademicYearPayload,
} from "@/features/academic-years/api/academicYears.dto";

export async function listAcademicYears(params: ListAcademicYearsParams) {
    const queryString = new URLSearchParams();
    if (params.q?.trim()) queryString.set("q", params.q.trim());
    if (typeof params.isActive === "boolean") queryString.set("isActive", String(params.isActive));
    queryString.set("page", String(params.page));
    queryString.set("limit", String(params.limit));

    return apiGet<AcademicYearsListResponse>(`/academic-years?${queryString.toString()}`, AcademicYearsListResponseSchema);
}

export async function getAcademicYear(id: string) {
    return apiGet<AcademicYearDto>(`/academic-years/${id}`, AcademicYearSchema);
}

export async function createAcademicYear(payload: CreateAcademicYearPayload) {
    return apiPost<CreateAcademicYearPayload, AcademicYearDto>("/academic-years", payload, AcademicYearSchema);
}

export async function updateAcademicYear(id: string, payload: UpdateAcademicYearPayload) {
    return apiPatch<UpdateAcademicYearPayload, AcademicYearDto>(`/academic-years/${id}`, payload, AcademicYearSchema);
}

export async function setCurrentAcademicYear(id: string) {
    return apiPost<undefined, AcademicYearDto>(`/academic-years/${id}/set-current`, undefined, AcademicYearSchema);
}

export async function deactivateAcademicYear(id: string) {
    return apiDelete<OkResponse>(`/academic-years/${id}`, OkResponseSchema);
}
