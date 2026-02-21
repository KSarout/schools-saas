import { Router } from "express";
import { Types } from "mongoose";
import { z } from "zod";
import { sendError, sendOk } from "../../core/apiResponse";
import { requireSchoolPermission } from "../../middlewares/rbac";
import { schoolAuth } from "../../middlewares/schoolAuth";
import { createClass, deactivateClass, getClassById, listClasses, updateClass } from "./class.service";

const objectIdRegex = /^[a-f\d]{24}$/i;

const listQuerySchema = z.object({
    q: z.string().trim().optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(50).default(10),
    academicYearId: z.string().regex(objectIdRegex, "Invalid academicYearId").optional(),
    isActive: z.coerce.boolean().optional(),
});

const createBodySchema = z.object({
    name: z.string().trim().min(2).max(100),
    code: z.string().trim().min(2).max(30),
    level: z.string().trim().min(1).max(40),
    capacity: z.number().int().min(1).optional(),
    academicYearId: z.string().regex(objectIdRegex, "Invalid academicYearId"),
    homeroomTeacherId: z.string().regex(objectIdRegex, "Invalid homeroomTeacherId").optional(),
    isActive: z.boolean().optional().default(true),
});

const updateBodySchema = z
    .object({
        name: z.string().trim().min(2).max(100).optional(),
        code: z.string().trim().min(2).max(30).optional(),
        level: z.string().trim().min(1).max(40).optional(),
        capacity: z.number().int().min(1).nullable().optional(),
        academicYearId: z.string().regex(objectIdRegex, "Invalid academicYearId").optional(),
        homeroomTeacherId: z.string().regex(objectIdRegex, "Invalid homeroomTeacherId").nullable().optional(),
        isActive: z.boolean().optional(),
    })
    .refine((value) => Object.keys(value).length > 0, {
        message: "At least one field is required",
    });

function isValidObjectId(value: string) {
    return Types.ObjectId.isValid(value);
}

export const classRouter = Router();
classRouter.use(schoolAuth);

export async function listClassesHandler(req: any, res: any) {
    const parsed = listQuerySchema.safeParse(req.query);
    if (!parsed.success) return sendError(res, 400, "Invalid query params", parsed.error.issues);

    const { q, page, limit, academicYearId, isActive } = parsed.data;
    const tenantId = req.user!.tenantId;
    const response = await listClasses(tenantId, { q, academicYearId, isActive }, page, limit);

    return res.json(response);
}
classRouter.get("/", requireSchoolPermission("classes.list"), listClassesHandler);

export async function getClassByIdHandler(req: any, res: any) {
    const id = String(req.params.id);
    if (!isValidObjectId(id)) return sendError(res, 400, "Invalid class id");

    const tenantId = req.user!.tenantId;

    try {
        const schoolClass = await getClassById(tenantId, id);
        return res.json(schoolClass);
    } catch (error: any) {
        if (error?.status) return sendError(res, error.status, error.message || "Request failed");
        throw error;
    }
}
classRouter.get("/:id", requireSchoolPermission("classes.read"), getClassByIdHandler);

export async function createClassHandler(req: any, res: any) {
    const parsed = createBodySchema.safeParse(req.body);
    if (!parsed.success) return sendError(res, 400, "Invalid input", parsed.error.issues);

    const tenantId = req.user!.tenantId;

    try {
        const created = await createClass(tenantId, parsed.data);
        return res.status(201).json(created);
    } catch (error: any) {
        if (error?.status) return sendError(res, error.status, error.message || "Request failed");
        if (error?.code === 11000) return sendError(res, 409, "Class code already exists for this academic year");
        throw error;
    }
}
classRouter.post("/", requireSchoolPermission("classes.create"), createClassHandler);

export async function updateClassHandler(req: any, res: any) {
    const id = String(req.params.id);
    if (!isValidObjectId(id)) return sendError(res, 400, "Invalid class id");

    const parsed = updateBodySchema.safeParse(req.body);
    if (!parsed.success) return sendError(res, 400, "Invalid input", parsed.error.issues);

    const tenantId = req.user!.tenantId;

    try {
        const updated = await updateClass(tenantId, id, parsed.data);
        return res.json(updated);
    } catch (error: any) {
        if (error?.status) return sendError(res, error.status, error.message || "Request failed");
        if (error?.code === 11000) return sendError(res, 409, "Class code already exists for this academic year");
        throw error;
    }
}
classRouter.patch("/:id", requireSchoolPermission("classes.update"), updateClassHandler);

export async function deleteClassHandler(req: any, res: any) {
    const id = String(req.params.id);
    if (!isValidObjectId(id)) return sendError(res, 400, "Invalid class id");

    const tenantId = req.user!.tenantId;

    try {
        await deactivateClass(tenantId, id);
        return sendOk(res);
    } catch (error: any) {
        if (error?.status) return sendError(res, error.status, error.message || "Request failed");
        throw error;
    }
}
classRouter.delete("/:id", requireSchoolPermission("classes.delete"), deleteClassHandler);
