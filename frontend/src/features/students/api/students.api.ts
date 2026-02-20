import { apiDelete, apiGet, apiPatch, apiPost } from "@/lib/apiClient";
import {
    StudentListResponseSchema,
    StudentSchema,
    type StudentCreateInput,
    type StudentDto,
    type StudentListResponse,
    type StudentUpdateInput,
} from "./students.dto";

export async function listStudents(params: { q?: string; page: number; limit: number }) {
    const qs = new URLSearchParams();
    if (params.q?.trim()) qs.set("q", params.q.trim());
    qs.set("page", String(params.page));
    qs.set("limit", String(params.limit));

    return apiGet<StudentListResponse>(`/students?${qs.toString()}`, StudentListResponseSchema);
}

export async function createStudent(input: StudentCreateInput) {
    return apiPost<StudentCreateInput, StudentDto>(`/students`, input, StudentSchema);
}

export async function updateStudent(id: string, input: StudentUpdateInput) {
    return apiPatch<StudentUpdateInput, StudentDto>(`/students/${id}`, input, StudentSchema);
}

export async function deleteStudent(id: string) {
    return apiDelete<{ ok: true }>(`/students/${id}`, (await import("zod")).z.object({ ok: (await import("zod")).z.literal(true) }));
}

export async function getStudent(id: string) {
    return apiGet<StudentDto>(`/students/${id}`, StudentSchema);
}
