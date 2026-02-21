import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { getStudentEnrollmentHistory, listEnrollmentAuditLogs, listEnrollments } from "@/features/enrollment/api/enrollment.api";
import type { ListEnrollmentAuditParams, ListEnrollmentsParams } from "@/features/enrollment/dto/enrollment.dto";

export const enrollmentKeys = {
    all: ["enrollments"] as const,
    list: (params: ListEnrollmentsParams) => ["enrollments", params] as const,
    audits: () => ["enrollmentAudits"] as const,
    auditList: (params: ListEnrollmentAuditParams) => ["enrollmentAudits", params] as const,
    histories: () => ["enrollmentHistory"] as const,
    history: (studentId: string) => ["enrollmentHistory", studentId] as const,
};

export function useEnrollments(params: ListEnrollmentsParams) {
    return useQuery({
        queryKey: enrollmentKeys.list(params),
        queryFn: () => listEnrollments(params),
        placeholderData: keepPreviousData,
        retry: false,
    });
}

export function useStudentEnrollmentHistory(studentId: string | null) {
    return useQuery({
        queryKey: enrollmentKeys.history(studentId ?? ""),
        queryFn: () => getStudentEnrollmentHistory(studentId ?? ""),
        enabled: !!studentId,
        retry: false,
    });
}

export function useEnrollmentAuditLogs(params: ListEnrollmentAuditParams, enabled = true) {
    return useQuery({
        queryKey: enrollmentKeys.auditList(params),
        queryFn: () => listEnrollmentAuditLogs(params),
        placeholderData: keepPreviousData,
        retry: false,
        enabled,
    });
}
