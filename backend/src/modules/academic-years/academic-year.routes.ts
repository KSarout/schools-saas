import { Router } from "express";
import { Types } from "mongoose";
import { z } from "zod";
import { sendError, sendOk } from "../../core/apiResponse";
import { requireSchoolPermission } from "../../middlewares/rbac";
import { schoolAuth } from "../../middlewares/schoolAuth";
import {
    createAcademicYear,
    deactivateAcademicYear,
    getAcademicYearById,
    listAcademicYears,
    setCurrentAcademicYear,
    updateAcademicYear,
} from "./academic-year.service";

const listQuerySchema = z.object({
    q: z.string().trim().optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(50).default(10),
    isActive: z.coerce.boolean().optional(),
    current: z.coerce.boolean().optional(),
});

const createBodySchema = z
    .object({
        name: z.string().trim().min(2).max(100),
        code: z.string().trim().min(2).max(30),
        startDate: z.coerce.date(),
        endDate: z.coerce.date(),
        isActive: z.boolean().optional().default(true),
        isCurrent: z.boolean().optional().default(false),
    })
    .refine((value) => value.endDate > value.startDate, {
        message: "endDate must be after startDate",
        path: ["endDate"],
    });

const updateBodySchema = z
    .object({
        name: z.string().trim().min(2).max(100).optional(),
        code: z.string().trim().min(2).max(30).optional(),
        startDate: z.coerce.date().optional(),
        endDate: z.coerce.date().optional(),
        isActive: z.boolean().optional(),
        isCurrent: z.boolean().optional(),
    })
    .refine((value) => Object.keys(value).length > 0, {
        message: "At least one field is required",
    });

function isValidObjectId(value: string) {
    return Types.ObjectId.isValid(value);
}

export const academicYearRouter = Router();
academicYearRouter.use(schoolAuth);

export async function listAcademicYearsHandler(req: any, res: any) {
    const parsed = listQuerySchema.safeParse(req.query);
    if (!parsed.success) return sendError(res, 400, "Invalid query params", parsed.error.issues);

    const { q, page, limit, isActive, current } = parsed.data;
    const tenantId = req.user!.tenantId;
    const response = await listAcademicYears(tenantId, { q, isActive, current }, page, limit);

    return res.json(response);
}
academicYearRouter.get("/", requireSchoolPermission("academicYears.list"), listAcademicYearsHandler);

export async function getAcademicYearByIdHandler(req: any, res: any) {
    const id = String(req.params.id);
    if (!isValidObjectId(id)) return sendError(res, 400, "Invalid academic year id");

    const tenantId = req.user!.tenantId;

    try {
        const year = await getAcademicYearById(tenantId, id);
        return res.json(year);
    } catch (error: any) {
        if (error?.status) return sendError(res, error.status, error.message || "Request failed");
        throw error;
    }
}
academicYearRouter.get("/:id", requireSchoolPermission("academicYears.read"), getAcademicYearByIdHandler);

export async function createAcademicYearHandler(req: any, res: any) {
    const parsed = createBodySchema.safeParse(req.body);
    if (!parsed.success) return sendError(res, 400, "Invalid input", parsed.error.issues);

    const tenantId = req.user!.tenantId;

    try {
        const created = await createAcademicYear(tenantId, parsed.data);
        return res.status(201).json(created);
    } catch (error: any) {
        if (error?.status) return sendError(res, error.status, error.message || "Request failed");
        if (error?.code === 11000) return sendError(res, 409, "Academic year code already exists");
        throw error;
    }
}
academicYearRouter.post("/", requireSchoolPermission("academicYears.create"), createAcademicYearHandler);

export async function updateAcademicYearHandler(req: any, res: any) {
    const id = String(req.params.id);
    if (!isValidObjectId(id)) return sendError(res, 400, "Invalid academic year id");

    const parsed = updateBodySchema.safeParse(req.body);
    if (!parsed.success) return sendError(res, 400, "Invalid input", parsed.error.issues);

    const tenantId = req.user!.tenantId;

    try {
        const updated = await updateAcademicYear(tenantId, id, parsed.data);
        return res.json(updated);
    } catch (error: any) {
        if (error?.status) return sendError(res, error.status, error.message || "Request failed");
        if (error?.code === 11000) return sendError(res, 409, "Academic year code already exists");
        throw error;
    }
}
academicYearRouter.patch("/:id", requireSchoolPermission("academicYears.update"), updateAcademicYearHandler);

export async function setCurrentAcademicYearHandler(req: any, res: any) {
    const id = String(req.params.id);
    if (!isValidObjectId(id)) return sendError(res, 400, "Invalid academic year id");

    const tenantId = req.user!.tenantId;

    try {
        const updated = await setCurrentAcademicYear(tenantId, id);
        return res.json(updated);
    } catch (error: any) {
        if (error?.status) return sendError(res, error.status, error.message || "Request failed");
        throw error;
    }
}
academicYearRouter.post("/:id/set-current", requireSchoolPermission("academicYears.setCurrent"), setCurrentAcademicYearHandler);

export async function deleteAcademicYearHandler(req: any, res: any) {
    const id = String(req.params.id);
    if (!isValidObjectId(id)) return sendError(res, 400, "Invalid academic year id");

    const tenantId = req.user!.tenantId;

    try {
        await deactivateAcademicYear(tenantId, id);
        return sendOk(res);
    } catch (error: any) {
        if (error?.status) return sendError(res, error.status, error.message || "Request failed");
        throw error;
    }
}
academicYearRouter.delete("/:id", requireSchoolPermission("academicYears.delete"), deleteAcademicYearHandler);
