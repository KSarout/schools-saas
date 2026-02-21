import { Router } from "express";
import { Types } from "mongoose";
import { z } from "zod";
import { sendError } from "../../core/apiResponse";
import { schoolAuth } from "../../middlewares/schoolAuth";
import { requireRole } from "../../middlewares/rbac";
import {
    assignStudentEnrollment,
    getStudentEnrollmentHistory,
    listEnrollments,
    listEnrollmentAuditLogs,
    promoteStudentEnrollment,
    transferStudentEnrollment,
    withdrawStudentEnrollment,
} from "./service/enrollment.service";

const StatusSchema = z.enum(["ACTIVE", "TRANSFERRED", "PROMOTED", "WITHDRAWN"]);
const objectIdSchema = z.string().regex(/^[a-f\d]{24}$/i, "Invalid ObjectId");

const listQuerySchema = z.object({
    q: z.string().optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(50).default(10),
    academicYearId: objectIdSchema.optional(),
    classId: objectIdSchema.optional(),
    sectionId: objectIdSchema.optional(),
    status: StatusSchema.optional(),
});

const auditListQuerySchema = z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    studentId: objectIdSchema.optional(),
    action: z.enum(["ASSIGN", "TRANSFER", "PROMOTE", "WITHDRAW"]).optional(),
    from: z.coerce.date().optional(),
    to: z.coerce.date().optional(),
});

const assignBodySchema = z.object({
    studentId: objectIdSchema,
    academicYearId: objectIdSchema,
    classId: objectIdSchema,
    sectionId: objectIdSchema,
    startDate: z.coerce.date(),
    note: z.string().optional(),
});

const transferBodySchema = z.object({
    studentId: objectIdSchema,
    academicYearId: objectIdSchema,
    toClassId: objectIdSchema,
    toSectionId: objectIdSchema,
    effectiveDate: z.coerce.date(),
    note: z.string().optional(),
});

const promoteBodySchema = z.object({
    studentId: objectIdSchema,
    fromAcademicYearId: objectIdSchema,
    toAcademicYearId: objectIdSchema,
    toClassId: objectIdSchema,
    toSectionId: objectIdSchema,
    effectiveDate: z.coerce.date(),
    note: z.string().optional(),
});

const withdrawBodySchema = z.object({
    studentId: objectIdSchema,
    academicYearId: objectIdSchema,
    effectiveDate: z.coerce.date(),
    note: z.string().optional(),
});

function validateObjectId(value: string) {
    return Types.ObjectId.isValid(value);
}

export const enrollmentRouter = Router();
enrollmentRouter.use(schoolAuth);

export async function listEnrollmentsHandler(req: any, res: any) {
    const parsed = listQuerySchema.safeParse(req.query);
    if (!parsed.success) return sendError(res, 400, "Invalid query params", parsed.error.issues);

    try {
        const result = await listEnrollments(req.user!.tenantId, parsed.data, parsed.data.page, parsed.data.limit);
        return res.json(result);
    } catch (error: any) {
        if (error?.status) return sendError(res, error.status, error.message || "Request failed");
        throw error;
    }
}
enrollmentRouter.get("/", requireRole("SCHOOL_ADMIN", "TEACHER", "ACCOUNTANT"), listEnrollmentsHandler);

export async function getStudentEnrollmentHistoryHandler(req: any, res: any) {
    const studentId = String(req.params.studentId);
    if (!validateObjectId(studentId)) return sendError(res, 400, "Invalid studentId");

    try {
        const items = await getStudentEnrollmentHistory(req.user!.tenantId, studentId);
        return res.json({ items });
    } catch (error: any) {
        if (error?.status) return sendError(res, error.status, error.message || "Request failed");
        throw error;
    }
}
enrollmentRouter.get(
    "/student/:studentId/history",
    requireRole("SCHOOL_ADMIN", "TEACHER", "ACCOUNTANT"),
    getStudentEnrollmentHistoryHandler
);

export async function listEnrollmentAuditLogsHandler(req: any, res: any) {
    const parsed = auditListQuerySchema.safeParse(req.query);
    if (!parsed.success) return sendError(res, 400, "Invalid query params", parsed.error.issues);

    try {
        const result = await listEnrollmentAuditLogs(req.user!.tenantId, parsed.data, parsed.data.page, parsed.data.limit);
        return res.json(result);
    } catch (error: any) {
        if (error?.status) return sendError(res, error.status, error.message || "Request failed");
        throw error;
    }
}
enrollmentRouter.get("/audit", requireRole("SCHOOL_ADMIN", "ACCOUNTANT"), listEnrollmentAuditLogsHandler);

export async function assignEnrollmentHandler(req: any, res: any) {
    const parsed = assignBodySchema.safeParse(req.body);
    if (!parsed.success) return sendError(res, 400, "Invalid input", parsed.error.issues);

    try {
        const result = await assignStudentEnrollment(req.user!.tenantId, {
            ...parsed.data,
            actorUserId: req.user!.userId.toString(),
        });

        return res.status(201).json(result);
    } catch (error: any) {
        if (error?.status) return sendError(res, error.status, error.message || "Request failed");
        if (error?.code === 11000) {
            return sendError(res, 409, "Active enrollment already exists for this student in this academic year");
        }
        throw error;
    }
}
enrollmentRouter.post("/assign", requireRole("SCHOOL_ADMIN"), assignEnrollmentHandler);

export async function transferEnrollmentHandler(req: any, res: any) {
    const parsed = transferBodySchema.safeParse(req.body);
    if (!parsed.success) return sendError(res, 400, "Invalid input", parsed.error.issues);

    try {
        const result = await transferStudentEnrollment(req.user!.tenantId, {
            ...parsed.data,
            actorUserId: req.user!.userId.toString(),
        });
        return res.json(result);
    } catch (error: any) {
        if (error?.status) return sendError(res, error.status, error.message || "Request failed");
        if (error?.code === 11000) {
            return sendError(res, 409, "Active enrollment already exists for this student in this academic year");
        }
        throw error;
    }
}
enrollmentRouter.post("/transfer", requireRole("SCHOOL_ADMIN"), transferEnrollmentHandler);

export async function promoteEnrollmentHandler(req: any, res: any) {
    const parsed = promoteBodySchema.safeParse(req.body);
    if (!parsed.success) return sendError(res, 400, "Invalid input", parsed.error.issues);

    try {
        const result = await promoteStudentEnrollment(req.user!.tenantId, {
            ...parsed.data,
            actorUserId: req.user!.userId.toString(),
        });
        return res.json(result);
    } catch (error: any) {
        if (error?.status) return sendError(res, error.status, error.message || "Request failed");
        if (error?.code === 11000) {
            return sendError(res, 409, "Active enrollment already exists for this student in this academic year");
        }
        throw error;
    }
}
enrollmentRouter.post("/promote", requireRole("SCHOOL_ADMIN"), promoteEnrollmentHandler);

export async function withdrawEnrollmentHandler(req: any, res: any) {
    const parsed = withdrawBodySchema.safeParse(req.body);
    if (!parsed.success) return sendError(res, 400, "Invalid input", parsed.error.issues);

    try {
        const result = await withdrawStudentEnrollment(req.user!.tenantId, {
            ...parsed.data,
            actorUserId: req.user!.userId.toString(),
        });
        return res.json(result);
    } catch (error: any) {
        if (error?.status) return sendError(res, error.status, error.message || "Request failed");
        throw error;
    }
}
enrollmentRouter.post("/withdraw", requireRole("SCHOOL_ADMIN"), withdrawEnrollmentHandler);
