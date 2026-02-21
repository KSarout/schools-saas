import { Types, type ClientSession, type Types as MongooseTypes } from "mongoose";
import { buildListResponse } from "../../../core/listResponse";
import { EnrollmentAuditLogModel, type EnrollmentAuditAction } from "../model/enrollmentAudit.model";

type TenantId = MongooseTypes.ObjectId | string;
type UserId = MongooseTypes.ObjectId | string;
type StudentId = MongooseTypes.ObjectId | string;

function toObjectId(id: UserId | StudentId) {
    return id instanceof Types.ObjectId ? id : new Types.ObjectId(String(id));
}

export async function createEnrollmentAuditLogForTenant(
    tenantId: TenantId,
    data: {
        actorUserId: UserId;
        action: EnrollmentAuditAction;
        studentId: StudentId;
        from?: { academicYearId?: UserId; classId?: UserId; sectionId?: UserId };
        to?: { academicYearId?: UserId; classId?: UserId; sectionId?: UserId };
        effectiveDate?: Date;
        note?: string;
    },
    options?: { session?: ClientSession }
) {
    const doc = {
        tenantId: toObjectId(tenantId),
        actorUserId: toObjectId(data.actorUserId),
        action: data.action,
        studentId: toObjectId(data.studentId),
        from: data.from
            ? {
                  academicYearId: data.from.academicYearId ? toObjectId(data.from.academicYearId) : undefined,
                  classId: data.from.classId ? toObjectId(data.from.classId) : undefined,
                  sectionId: data.from.sectionId ? toObjectId(data.from.sectionId) : undefined,
              }
            : undefined,
        to: data.to
            ? {
                  academicYearId: data.to.academicYearId ? toObjectId(data.to.academicYearId) : undefined,
                  classId: data.to.classId ? toObjectId(data.to.classId) : undefined,
                  sectionId: data.to.sectionId ? toObjectId(data.to.sectionId) : undefined,
              }
            : undefined,
        effectiveDate: data.effectiveDate,
        note: data.note?.trim() || undefined,
    };

    const [created] = await EnrollmentAuditLogModel.create([doc], options?.session ? { session: options.session } : undefined);
    return created;
}

type ListEnrollmentAuditFilters = {
    studentId?: string;
    action?: EnrollmentAuditAction;
    from?: Date;
    to?: Date;
};

export async function listEnrollmentAuditLogsForTenant(
    tenantId: TenantId,
    filters: ListEnrollmentAuditFilters,
    page: number,
    limit: number
) {
    const tenantObjectId = toObjectId(tenantId);
    const match: Record<string, unknown> = { tenantId: tenantObjectId };

    if (filters.studentId) match.studentId = toObjectId(filters.studentId);
    if (filters.action) match.action = filters.action;
    if (filters.from || filters.to) {
        const range: Record<string, Date> = {};
        if (filters.from) range.$gte = filters.from;
        if (filters.to) range.$lte = filters.to;
        match.createdAt = range;
    }

    const [facet] = await EnrollmentAuditLogModel.aggregate([
        { $match: match },
        { $sort: { createdAt: -1, _id: -1 } },
        {
            $facet: {
                items: [{ $skip: (page - 1) * limit }, { $limit: limit }],
                total: [{ $count: "count" }],
            },
        },
    ]);

    const items = (facet?.items ?? []).map((row: any) => ({
        id: String(row._id),
        action: row.action,
        studentId: String(row.studentId),
        actorUserId: String(row.actorUserId),
        from: row.from
            ? {
                  academicYearId: row.from.academicYearId ? String(row.from.academicYearId) : undefined,
                  classId: row.from.classId ? String(row.from.classId) : undefined,
                  sectionId: row.from.sectionId ? String(row.from.sectionId) : undefined,
              }
            : undefined,
        to: row.to
            ? {
                  academicYearId: row.to.academicYearId ? String(row.to.academicYearId) : undefined,
                  classId: row.to.classId ? String(row.to.classId) : undefined,
                  sectionId: row.to.sectionId ? String(row.to.sectionId) : undefined,
              }
            : undefined,
        effectiveDate: row.effectiveDate ? new Date(row.effectiveDate).toISOString() : undefined,
        note: row.note ?? undefined,
        createdAt: row.createdAt ? new Date(row.createdAt).toISOString() : undefined,
    }));
    const total = Number(facet?.total?.[0]?.count ?? 0);

    return buildListResponse({ items, total, page, limit });
}
