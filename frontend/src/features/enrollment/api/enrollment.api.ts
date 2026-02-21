import { apiGet, apiPost } from "@/lib/apiClient";
import {
    type AssignEnrollmentPayload,
    type EnrollmentDto,
    EnrollmentDtoSchema,
    type EnrollmentAuditListResponse,
    EnrollmentAuditListResponseSchema,
    type EnrollmentHistoryResponse,
    EnrollmentHistoryResponseSchema,
    type EnrollmentListResponse,
    EnrollmentListResponseSchema,
    type ListEnrollmentAuditParams,
    type ListEnrollmentsParams,
    type PromoteEnrollmentPayload,
    type TransitionEnrollmentResponse,
    TransitionEnrollmentResponseSchema,
    type TransferEnrollmentPayload,
    type WithdrawEnrollmentPayload,
} from "@/features/enrollment/dto/enrollment.dto";

const BASE = "/api/school/enrollments";

export async function listEnrollments(params: ListEnrollmentsParams) {
    const query = new URLSearchParams();
    if (params.q?.trim()) query.set("q", params.q.trim());
    if (params.academicYearId) query.set("academicYearId", params.academicYearId);
    if (params.classId) query.set("classId", params.classId);
    if (params.sectionId) query.set("sectionId", params.sectionId);
    if (params.status) query.set("status", params.status);
    query.set("page", String(params.page));
    query.set("limit", String(params.limit));

    const suffix = query.toString();
    return apiGet<EnrollmentListResponse>(`${BASE}${suffix ? `?${suffix}` : ""}`, EnrollmentListResponseSchema);
}

export async function getStudentEnrollmentHistory(studentId: string) {
    return apiGet<EnrollmentHistoryResponse>(
        `${BASE}/student/${studentId}/history`,
        EnrollmentHistoryResponseSchema
    );
}

export async function listEnrollmentAuditLogs(params: ListEnrollmentAuditParams) {
    const query = new URLSearchParams();
    query.set("page", String(params.page));
    query.set("limit", String(params.limit));
    if (params.studentId) query.set("studentId", params.studentId);
    if (params.action) query.set("action", params.action);
    if (params.from) query.set("from", params.from);
    if (params.to) query.set("to", params.to);

    const suffix = query.toString();
    return apiGet<EnrollmentAuditListResponse>(
        `${BASE}/audit${suffix ? `?${suffix}` : ""}`,
        EnrollmentAuditListResponseSchema
    );
}

export async function assignEnrollment(payload: AssignEnrollmentPayload) {
    return apiPost<AssignEnrollmentPayload, EnrollmentDto>(`${BASE}/assign`, payload, EnrollmentDtoSchema);
}

export async function transferEnrollment(payload: TransferEnrollmentPayload) {
    return apiPost<TransferEnrollmentPayload, TransitionEnrollmentResponse>(
        `${BASE}/transfer`,
        payload,
        TransitionEnrollmentResponseSchema
    );
}

export async function promoteEnrollment(payload: PromoteEnrollmentPayload) {
    return apiPost<PromoteEnrollmentPayload, TransitionEnrollmentResponse>(
        `${BASE}/promote`,
        payload,
        TransitionEnrollmentResponseSchema
    );
}

export async function withdrawEnrollment(payload: WithdrawEnrollmentPayload) {
    return apiPost<WithdrawEnrollmentPayload, EnrollmentDto>(`${BASE}/withdraw`, payload, EnrollmentDtoSchema);
}
