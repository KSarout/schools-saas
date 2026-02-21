import mongoose, { Types, type ClientSession } from "mongoose";
import { buildListResponse } from "../../../core/listResponse";
import { escapeRegex } from "../../../core/regex";
import { AcademicYearModel } from "../../academic-years/academic-year.model";
import { SchoolClassModel } from "../../classes/class.model";
import { SectionModel } from "../../sections/section.model";
import { StudentModel } from "../../students/model/student.model";
import { UserModel } from "../../users/model/user.model";
import { toEnrollmentDto } from "../dto/enrollment.dto";
import { EnrollmentModel, type EnrollmentStatus } from "../model/enrollment.model";
import { listEnrollmentAuditLogs as listEnrollmentAuditLogsService, logEnrollmentAuditAction } from "./enrollmentAudit.service";

type TenantId = Types.ObjectId | string;

type ListFilters = {
    q?: string;
    academicYearId?: string;
    classId?: string;
    sectionId?: string;
    status?: EnrollmentStatus;
};

export type AssignEnrollmentPayload = {
    studentId: string;
    academicYearId: string;
    classId: string;
    sectionId: string;
    startDate: Date;
    note?: string;
    actorUserId: string;
};

export type TransferEnrollmentPayload = {
    studentId: string;
    academicYearId: string;
    toClassId: string;
    toSectionId: string;
    effectiveDate: Date;
    note?: string;
    actorUserId: string;
};

export type PromoteEnrollmentPayload = {
    studentId: string;
    fromAcademicYearId: string;
    toAcademicYearId: string;
    toClassId: string;
    toSectionId: string;
    effectiveDate: Date;
    note?: string;
    actorUserId: string;
};

export type WithdrawEnrollmentPayload = {
    studentId: string;
    academicYearId: string;
    effectiveDate: Date;
    note?: string;
    actorUserId: string;
};

function asTenantObjectId(tenantId: TenantId) {
    if (tenantId instanceof Types.ObjectId) return tenantId;
    return new Types.ObjectId(String(tenantId));
}

function asObjectId(value: string, label: string) {
    if (!Types.ObjectId.isValid(value)) {
        const err = new Error(`Invalid ${label}`);
        (err as any).status = 400;
        throw err;
    }
    return new Types.ObjectId(value);
}

function conflictError(message: string) {
    const err = new Error(message);
    (err as any).status = 409;
    return err;
}

function badRequestError(message: string) {
    const err = new Error(message);
    (err as any).status = 400;
    return err;
}

function notFoundError(message: string) {
    const err = new Error(message);
    (err as any).status = 404;
    return err;
}

function assertEffectiveDateNotBeforeStartDate(effectiveDate: Date, startDate: Date) {
    if (effectiveDate.getTime() < startDate.getTime()) {
        throw badRequestError("effectiveDate cannot be before current enrollment startDate");
    }
}

async function runInTransaction<T>(work: (session: ClientSession) => Promise<T>) {
    const session = await mongoose.startSession();
    try {
        let result: T | undefined;
        await session.withTransaction(async () => {
            result = await work(session);
        });

        if (result === undefined) {
            throw new Error("Transaction failed");
        }

        return result;
    } finally {
        await session.endSession();
    }
}

async function ensureActor(tenantId: string, actorUserId: string) {
    const actor = await UserModel.findOne({ _id: actorUserId, isActive: true }).setOptions({ tenantId });
    if (!actor) throw notFoundError("Actor user not found");
}

async function validateAssignmentRefs(params: {
    tenantId: string;
    studentId: string;
    academicYearId: string;
    classId: string;
    sectionId: string;
}) {
    const [student, year, schoolClass, section] = await Promise.all([
        StudentModel.findOne({ _id: params.studentId }).setOptions({ tenantId: params.tenantId }),
        AcademicYearModel.findOne({ _id: params.academicYearId }).setOptions({ tenantId: params.tenantId }),
        SchoolClassModel.findOne({ _id: params.classId }).setOptions({ tenantId: params.tenantId }),
        SectionModel.findOne({ _id: params.sectionId }).setOptions({ tenantId: params.tenantId }),
    ]);

    if (!student) throw notFoundError("Student not found");
    if (!year) throw notFoundError("Academic year not found");
    if (!schoolClass) throw notFoundError("Class not found");
    if (!section) throw notFoundError("Section not found");

    if (String(schoolClass.academicYearId) !== String(year._id)) {
        throw badRequestError("Class must belong to academic year");
    }

    if (String(section.classId) !== String(schoolClass._id)) {
        throw badRequestError("Section must belong to class");
    }
}

async function createActiveEnrollmentInSession(params: {
    tenantId: string;
    studentId: string;
    academicYearId: string;
    classId: string;
    sectionId: string;
    startDate: Date;
    note?: string;
    actorUserId: string;
    session: ClientSession;
}) {
    const [next] = await EnrollmentModel.create(
        [
            {
                tenantId: params.tenantId,
                studentId: params.studentId,
                academicYearId: params.academicYearId,
                classId: params.classId,
                sectionId: params.sectionId,
                status: "ACTIVE",
                startDate: params.startDate,
                note: params.note?.trim() || undefined,
                createdBy: params.actorUserId,
            },
        ],
        { session: params.session }
    );

    if (!next) throw new Error("Failed to create enrollment");
    return next;
}

function buildListPipeline(params: {
    tenantObjectId: Types.ObjectId;
    filters: ListFilters;
    page: number;
    limit: number;
}) {
    const match: Record<string, unknown> = { tenantId: params.tenantObjectId };
    match.status = params.filters.status ?? "ACTIVE";

    if (params.filters.academicYearId) match.academicYearId = asObjectId(params.filters.academicYearId, "academicYearId");
    if (params.filters.classId) match.classId = asObjectId(params.filters.classId, "classId");
    if (params.filters.sectionId) match.sectionId = asObjectId(params.filters.sectionId, "sectionId");

    const q = params.filters.q?.trim();
    const qRegex = q ? new RegExp(escapeRegex(q), "i") : null;

    return [
        { $match: match },
        {
            $lookup: {
                from: "students",
                let: { sid: "$studentId", tid: "$tenantId" },
                pipeline: [
                    {
                        $match: {
                            $expr: {
                                $and: [{ $eq: ["$_id", "$$sid"] }, { $eq: ["$tenantId", "$$tid"] }],
                            },
                        },
                    },
                    {
                        $project: {
                            _id: 1,
                            studentCode: 1,
                            email: 1,
                            firstName: 1,
                            lastName: 1,
                            parentPhone: 1,
                        },
                    },
                ],
                as: "student",
            },
        },
        { $unwind: "$student" },
        {
            $addFields: {
                "student.fullName": {
                    $trim: {
                        input: {
                            $concat: [
                                { $ifNull: ["$student.firstName", ""] },
                                " ",
                                { $ifNull: ["$student.lastName", ""] },
                            ],
                        },
                    },
                },
                "student.phone": { $ifNull: ["$student.parentPhone", ""] },
            },
        },
        ...(qRegex
            ? [
                  {
                      $match: {
                          $or: [
                              { "student.fullName": qRegex },
                              { "student.studentCode": qRegex },
                              { "student.email": qRegex },
                              { "student.phone": qRegex },
                          ],
                      },
                  },
              ]
            : []),
        {
            $lookup: {
                from: "academicyears",
                let: { ayid: "$academicYearId", tid: "$tenantId" },
                pipeline: [
                    { $match: { $expr: { $and: [{ $eq: ["$_id", "$$ayid"] }, { $eq: ["$tenantId", "$$tid"] }] } } },
                    { $project: { _id: 1, name: 1 } },
                ],
                as: "academicYear",
            },
        },
        { $unwind: "$academicYear" },
        {
            $lookup: {
                from: "schoolclasses",
                let: { cid: "$classId", tid: "$tenantId" },
                pipeline: [
                    { $match: { $expr: { $and: [{ $eq: ["$_id", "$$cid"] }, { $eq: ["$tenantId", "$$tid"] }] } } },
                    { $project: { _id: 1, name: 1 } },
                ],
                as: "class",
            },
        },
        { $unwind: "$class" },
        {
            $lookup: {
                from: "sections",
                let: { sid: "$sectionId", tid: "$tenantId" },
                pipeline: [
                    { $match: { $expr: { $and: [{ $eq: ["$_id", "$$sid"] }, { $eq: ["$tenantId", "$$tid"] }] } } },
                    { $project: { _id: 1, name: 1 } },
                ],
                as: "section",
            },
        },
        { $unwind: "$section" },
        { $sort: { startDate: -1, _id: -1 } },
        {
            $facet: {
                items: [{ $skip: (params.page - 1) * params.limit }, { $limit: params.limit }],
                total: [{ $count: "count" }],
            },
        },
    ] as any[];
}

function mapEnrollmentProjection(row: any) {
    return {
        enrollment: {
            id: String(row._id),
            status: row.status,
            startDate: row.startDate,
            endDate: row.endDate,
            note: row.note,
        },
        student: {
            id: String(row.student._id),
            fullName: row.student.fullName,
            studentCode: row.student.studentCode,
        },
        academicYear: { id: String(row.academicYear._id), name: row.academicYear.name },
        class: { id: String(row.class._id), name: row.class.name },
        section: { id: String(row.section._id), name: row.section.name },
    };
}

export async function listEnrollments(
    tenantId: TenantId,
    filters: ListFilters,
    page: number,
    limit: number
) {
    const tenantObjectId = asTenantObjectId(tenantId);
    const pipeline = buildListPipeline({ tenantObjectId, filters, page, limit });

    const [facet] = await EnrollmentModel.aggregate(pipeline);
    const items = (facet?.items ?? []).map(mapEnrollmentProjection);
    const total = Number(facet?.total?.[0]?.count ?? 0);

    return buildListResponse({ items, total, page, limit });
}

export async function getStudentEnrollmentHistory(tenantId: TenantId, studentId: string) {
    const tenantObjectId = asTenantObjectId(tenantId);
    const studentObjectId = asObjectId(studentId, "studentId");

    const rows = await EnrollmentModel.aggregate([
        { $match: { tenantId: tenantObjectId, studentId: studentObjectId } },
        { $sort: { startDate: -1, _id: -1 } },
        {
            $lookup: {
                from: "academicyears",
                let: { ayid: "$academicYearId", tid: "$tenantId" },
                pipeline: [
                    { $match: { $expr: { $and: [{ $eq: ["$_id", "$$ayid"] }, { $eq: ["$tenantId", "$$tid"] }] } } },
                    { $project: { _id: 1, name: 1, code: 1 } },
                ],
                as: "academicYear",
            },
        },
        { $unwind: "$academicYear" },
        {
            $lookup: {
                from: "schoolclasses",
                let: { cid: "$classId", tid: "$tenantId" },
                pipeline: [
                    { $match: { $expr: { $and: [{ $eq: ["$_id", "$$cid"] }, { $eq: ["$tenantId", "$$tid"] }] } } },
                    { $project: { _id: 1, name: 1, code: 1, level: 1 } },
                ],
                as: "class",
            },
        },
        { $unwind: "$class" },
        {
            $lookup: {
                from: "sections",
                let: { sid: "$sectionId", tid: "$tenantId" },
                pipeline: [
                    { $match: { $expr: { $and: [{ $eq: ["$_id", "$$sid"] }, { $eq: ["$tenantId", "$$tid"] }] } } },
                    { $project: { _id: 1, name: 1, code: 1 } },
                ],
                as: "section",
            },
        },
        { $unwind: "$section" },
    ]);

    return rows.map((row) => ({
        id: String(row._id),
        status: row.status,
        startDate: row.startDate,
        endDate: row.endDate,
        note: row.note,
        academicYear: {
            id: String(row.academicYear._id),
            name: row.academicYear.name,
            code: row.academicYear.code,
        },
        class: {
            id: String(row.class._id),
            name: row.class.name,
            code: row.class.code,
            level: row.class.level,
        },
        section: {
            id: String(row.section._id),
            name: row.section.name,
            code: row.section.code,
        },
    }));
}

export const listEnrollmentAuditLogs = listEnrollmentAuditLogsService;

export async function assignStudentEnrollment(tenantId: TenantId, payload: AssignEnrollmentPayload) {
    const normalizedTenantId = String(tenantId);

    await ensureActor(normalizedTenantId, payload.actorUserId);
    await validateAssignmentRefs({
        tenantId: normalizedTenantId,
        studentId: payload.studentId,
        academicYearId: payload.academicYearId,
        classId: payload.classId,
        sectionId: payload.sectionId,
    });

    const existingActive = await EnrollmentModel.findOne({
        studentId: payload.studentId,
        academicYearId: payload.academicYearId,
        status: "ACTIVE",
    }).setOptions({ tenantId: normalizedTenantId });

    if (existingActive) {
        throw conflictError("Active enrollment already exists for this student in this academic year");
    }

    try {
        const created = await EnrollmentModel.create({
            tenantId: normalizedTenantId,
            studentId: payload.studentId,
            academicYearId: payload.academicYearId,
            classId: payload.classId,
            sectionId: payload.sectionId,
            status: "ACTIVE",
            startDate: payload.startDate,
            note: payload.note?.trim() || undefined,
            createdBy: payload.actorUserId,
        });

        await logEnrollmentAuditAction({
            tenantId: normalizedTenantId,
            actorUserId: payload.actorUserId,
            action: "ASSIGN",
            studentId: payload.studentId,
            to: {
                academicYearId: payload.academicYearId,
                classId: payload.classId,
                sectionId: payload.sectionId,
            },
            effectiveDate: payload.startDate,
            note: payload.note,
        });

        return toEnrollmentDto(created);
    } catch (error: any) {
        if (error?.code === 11000) {
            throw conflictError("Active enrollment already exists for this student in this academic year");
        }
        throw error;
    }
}

export async function transferStudentEnrollment(tenantId: TenantId, payload: TransferEnrollmentPayload) {
    const normalizedTenantId = String(tenantId);

    await ensureActor(normalizedTenantId, payload.actorUserId);
    const currentProbe = await EnrollmentModel.findOne({
        studentId: payload.studentId,
        academicYearId: payload.academicYearId,
        status: "ACTIVE",
    }).setOptions({ tenantId: normalizedTenantId });
    if (!currentProbe) throw notFoundError("Active enrollment not found");

    await validateAssignmentRefs({
        tenantId: normalizedTenantId,
        studentId: payload.studentId,
        academicYearId: payload.academicYearId,
        classId: payload.toClassId,
        sectionId: payload.toSectionId,
    });

    return runInTransaction(async (session) => {
        const current = await EnrollmentModel.findOne({
            studentId: payload.studentId,
            academicYearId: payload.academicYearId,
            status: "ACTIVE",
        })
            .setOptions({ tenantId: normalizedTenantId })
            .session(session);

        if (!current) throw notFoundError("Active enrollment not found");

        if (
            String(current.classId) === String(payload.toClassId) &&
            String(current.sectionId) === String(payload.toSectionId)
        ) {
            throw badRequestError("Transfer target must be different from current class/section");
        }

        assertEffectiveDateNotBeforeStartDate(payload.effectiveDate, current.startDate);

        current.status = "TRANSFERRED";
        current.endDate = payload.effectiveDate;
        current.updatedBy = payload.actorUserId as any;
        if (payload.note?.trim()) current.note = payload.note.trim();
        await current.save({ session });

        const created = await createActiveEnrollmentInSession({
            tenantId: normalizedTenantId,
            studentId: payload.studentId,
            academicYearId: payload.academicYearId,
            classId: payload.toClassId,
            sectionId: payload.toSectionId,
            startDate: payload.effectiveDate,
            note: payload.note,
            actorUserId: payload.actorUserId,
            session,
        });

        await logEnrollmentAuditAction({
            tenantId: normalizedTenantId,
            actorUserId: payload.actorUserId,
            action: "TRANSFER",
            studentId: payload.studentId,
            from: {
                academicYearId: payload.academicYearId,
                classId: String(current.classId),
                sectionId: String(current.sectionId),
            },
            to: {
                academicYearId: payload.academicYearId,
                classId: payload.toClassId,
                sectionId: payload.toSectionId,
            },
            effectiveDate: payload.effectiveDate,
            note: payload.note,
            session,
        });

        return {
            previousEnrollment: toEnrollmentDto(current),
            currentEnrollment: toEnrollmentDto(created),
        };
    });
}

export async function promoteStudentEnrollment(
    tenantId: TenantId,
    payload: PromoteEnrollmentPayload,
    options?: { allowSameAcademicYear?: boolean }
) {
    const normalizedTenantId = String(tenantId);

    if (!options?.allowSameAcademicYear && payload.fromAcademicYearId === payload.toAcademicYearId) {
        throw badRequestError("toAcademicYearId must be different from fromAcademicYearId");
    }

    await ensureActor(normalizedTenantId, payload.actorUserId);
    const currentProbe = await EnrollmentModel.findOne({
        studentId: payload.studentId,
        academicYearId: payload.fromAcademicYearId,
        status: "ACTIVE",
    }).setOptions({ tenantId: normalizedTenantId });
    if (!currentProbe) throw notFoundError("Active enrollment not found");

    await validateAssignmentRefs({
        tenantId: normalizedTenantId,
        studentId: payload.studentId,
        academicYearId: payload.toAcademicYearId,
        classId: payload.toClassId,
        sectionId: payload.toSectionId,
    });

    return runInTransaction(async (session) => {
        const current = await EnrollmentModel.findOne({
            studentId: payload.studentId,
            academicYearId: payload.fromAcademicYearId,
            status: "ACTIVE",
        })
            .setOptions({ tenantId: normalizedTenantId })
            .session(session);

        if (!current) throw notFoundError("Active enrollment not found");

        assertEffectiveDateNotBeforeStartDate(payload.effectiveDate, current.startDate);

        current.status = "PROMOTED";
        current.endDate = payload.effectiveDate;
        current.updatedBy = payload.actorUserId as any;
        if (payload.note?.trim()) current.note = payload.note.trim();
        await current.save({ session });

        const created = await createActiveEnrollmentInSession({
            tenantId: normalizedTenantId,
            studentId: payload.studentId,
            academicYearId: payload.toAcademicYearId,
            classId: payload.toClassId,
            sectionId: payload.toSectionId,
            startDate: payload.effectiveDate,
            note: payload.note,
            actorUserId: payload.actorUserId,
            session,
        });

        await logEnrollmentAuditAction({
            tenantId: normalizedTenantId,
            actorUserId: payload.actorUserId,
            action: "PROMOTE",
            studentId: payload.studentId,
            from: {
                academicYearId: payload.fromAcademicYearId,
                classId: String(current.classId),
                sectionId: String(current.sectionId),
            },
            to: {
                academicYearId: payload.toAcademicYearId,
                classId: payload.toClassId,
                sectionId: payload.toSectionId,
            },
            effectiveDate: payload.effectiveDate,
            note: payload.note,
            session,
        });

        return {
            previousEnrollment: toEnrollmentDto(current),
            currentEnrollment: toEnrollmentDto(created),
        };
    });
}

export async function withdrawStudentEnrollment(tenantId: TenantId, payload: WithdrawEnrollmentPayload) {
    const normalizedTenantId = String(tenantId);

    await ensureActor(normalizedTenantId, payload.actorUserId);

    const current = await EnrollmentModel.findOne({
        studentId: payload.studentId,
        academicYearId: payload.academicYearId,
        status: "ACTIVE",
    }).setOptions({ tenantId: normalizedTenantId });

    if (!current) throw notFoundError("Active enrollment not found");

    assertEffectiveDateNotBeforeStartDate(payload.effectiveDate, current.startDate);

    current.status = "WITHDRAWN";
    current.endDate = payload.effectiveDate;
    current.updatedBy = payload.actorUserId as any;
    if (payload.note?.trim()) current.note = payload.note.trim();
    await current.save();

    await logEnrollmentAuditAction({
        tenantId: normalizedTenantId,
        actorUserId: payload.actorUserId,
        action: "WITHDRAW",
        studentId: payload.studentId,
        from: {
            academicYearId: payload.academicYearId,
            classId: String(current.classId),
            sectionId: String(current.sectionId),
        },
        effectiveDate: payload.effectiveDate,
        note: payload.note,
    });

    return toEnrollmentDto(current);
}

// Backwards-compatible exports
export const createEnrollment = (tenantId: TenantId, payload: {
    studentId: string;
    academicYearId: string;
    classId: string;
    sectionId: string;
    startDate: Date;
    note?: string;
    createdBy: string;
}) => {
    return assignStudentEnrollment(tenantId, {
        studentId: payload.studentId,
        academicYearId: payload.academicYearId,
        classId: payload.classId,
        sectionId: payload.sectionId,
        startDate: payload.startDate,
        note: payload.note,
        actorUserId: payload.createdBy,
    });
};

export const transitionEnrollment = async (
    tenantId: TenantId,
    payload: {
        studentId: string;
        academicYearId: string;
        classId: string;
        sectionId: string;
        startDate: Date;
        note?: string;
        actorUserId: string;
        previousStatus: "TRANSFERRED" | "PROMOTED";
    }
) => {
    if (payload.previousStatus === "TRANSFERRED") {
        return transferStudentEnrollment(tenantId, {
            studentId: payload.studentId,
            academicYearId: payload.academicYearId,
            toClassId: payload.classId,
            toSectionId: payload.sectionId,
            effectiveDate: payload.startDate,
            note: payload.note,
            actorUserId: payload.actorUserId,
        });
    }

    return promoteStudentEnrollment(tenantId, {
        studentId: payload.studentId,
        fromAcademicYearId: payload.academicYearId,
        toAcademicYearId: payload.academicYearId,
        toClassId: payload.classId,
        toSectionId: payload.sectionId,
        effectiveDate: payload.startDate,
        note: payload.note,
        actorUserId: payload.actorUserId,
    }, { allowSameAcademicYear: true });
};
export const withdrawEnrollment = async (params: {
    tenantId: TenantId;
    enrollmentId?: string;
    studentId?: string;
    academicYearId?: string;
    actorUserId: string;
    endDate?: Date;
    note?: string;
}) => {
    if (params.studentId && params.academicYearId) {
        return withdrawStudentEnrollment(params.tenantId, {
            studentId: params.studentId,
            academicYearId: params.academicYearId,
            actorUserId: params.actorUserId,
            effectiveDate: params.endDate ?? new Date(),
            note: params.note,
        });
    }

    if (!params.enrollmentId) throw badRequestError("enrollmentId is required");
    const tenantAsString = String(params.tenantId);
    await ensureActor(tenantAsString, params.actorUserId);

    const enrollment = await EnrollmentModel.findOne({ _id: params.enrollmentId, status: "ACTIVE" }).setOptions({
        tenantId: tenantAsString,
    });
    if (!enrollment) throw notFoundError("Active enrollment not found");

    enrollment.status = "WITHDRAWN";
    enrollment.endDate = params.endDate ?? new Date();
    enrollment.updatedBy = params.actorUserId as any;
    if (params.note?.trim()) enrollment.note = params.note.trim();
    await enrollment.save();

    return toEnrollmentDto(enrollment);
};
