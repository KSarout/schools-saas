import type { ClientSession, Types } from "mongoose";
import type { EnrollmentAuditAction } from "../model/enrollmentAudit.model";
import { createEnrollmentAuditLogForTenant, listEnrollmentAuditLogsForTenant } from "./enrollmentAudit.repo";

type TenantId = Types.ObjectId | string;
type UserId = Types.ObjectId | string;

export async function logEnrollmentAuditAction(params: {
    tenantId: TenantId;
    actorUserId: UserId;
    action: EnrollmentAuditAction;
    studentId: UserId;
    from?: { academicYearId?: string; classId?: string; sectionId?: string };
    to?: { academicYearId?: string; classId?: string; sectionId?: string };
    effectiveDate?: Date;
    note?: string;
    session?: ClientSession;
}) {
    await createEnrollmentAuditLogForTenant(
        params.tenantId,
        {
            actorUserId: params.actorUserId,
            action: params.action,
            studentId: params.studentId,
            from: params.from,
            to: params.to,
            effectiveDate: params.effectiveDate,
            note: params.note,
        },
        { session: params.session }
    );
}

export async function listEnrollmentAuditLogs(
    tenantId: TenantId,
    filters: {
        studentId?: string;
        action?: EnrollmentAuditAction;
        from?: Date;
        to?: Date;
    },
    page: number,
    limit: number
) {
    return listEnrollmentAuditLogsForTenant(tenantId, filters, page, limit);
}
