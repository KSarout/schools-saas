import { Router } from "express";
import { Types } from "mongoose";
import { z } from "zod";
import { sendError, sendOk } from "../../core/apiResponse";
import { requireSchoolPermission } from "../../middlewares/rbac";
import { schoolAuth } from "../../middlewares/schoolAuth";
import { createSection, deactivateSection, getSectionById, listSections, updateSection } from "./section.service";

const objectIdRegex = /^[a-f\d]{24}$/i;

const listQuerySchema = z.object({
    q: z.string().trim().optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(50).default(10),
    classId: z.string().regex(objectIdRegex, "Invalid classId").optional(),
    isActive: z.coerce.boolean().optional(),
});

const createBodySchema = z.object({
    name: z.string().trim().min(1).max(80),
    code: z.string().trim().min(1).max(30),
    classId: z.string().regex(objectIdRegex, "Invalid classId"),
    capacity: z.number().int().min(1).optional(),
    isActive: z.boolean().optional().default(true),
});

const updateBodySchema = z
    .object({
        name: z.string().trim().min(1).max(80).optional(),
        code: z.string().trim().min(1).max(30).optional(),
        classId: z.string().regex(objectIdRegex, "Invalid classId").optional(),
        capacity: z.number().int().min(1).nullable().optional(),
        isActive: z.boolean().optional(),
    })
    .refine((value) => Object.keys(value).length > 0, {
        message: "At least one field is required",
    });

function isValidObjectId(value: string) {
    return Types.ObjectId.isValid(value);
}

export const sectionRouter = Router();
sectionRouter.use(schoolAuth);

export async function listSectionsHandler(req: any, res: any) {
    const parsed = listQuerySchema.safeParse(req.query);
    if (!parsed.success) return sendError(res, 400, "Invalid query params", parsed.error.issues);

    const { q, page, limit, classId, isActive } = parsed.data;
    const tenantId = req.user!.tenantId;
    const response = await listSections(tenantId, { q, classId, isActive }, page, limit);

    return res.json(response);
}
sectionRouter.get("/", requireSchoolPermission("sections.list"), listSectionsHandler);

export async function getSectionByIdHandler(req: any, res: any) {
    const id = String(req.params.id);
    if (!isValidObjectId(id)) return sendError(res, 400, "Invalid section id");

    const tenantId = req.user!.tenantId;

    try {
        const section = await getSectionById(tenantId, id);
        return res.json(section);
    } catch (error: any) {
        if (error?.status) return sendError(res, error.status, error.message || "Request failed");
        throw error;
    }
}
sectionRouter.get("/:id", requireSchoolPermission("sections.read"), getSectionByIdHandler);

export async function createSectionHandler(req: any, res: any) {
    const parsed = createBodySchema.safeParse(req.body);
    if (!parsed.success) return sendError(res, 400, "Invalid input", parsed.error.issues);

    const tenantId = req.user!.tenantId;

    try {
        const created = await createSection(tenantId, parsed.data);
        return res.status(201).json(created);
    } catch (error: any) {
        if (error?.status) return sendError(res, error.status, error.message || "Request failed");
        if (error?.code === 11000) return sendError(res, 409, "Section code already exists for this class");
        throw error;
    }
}
sectionRouter.post("/", requireSchoolPermission("sections.create"), createSectionHandler);

export async function updateSectionHandler(req: any, res: any) {
    const id = String(req.params.id);
    if (!isValidObjectId(id)) return sendError(res, 400, "Invalid section id");

    const parsed = updateBodySchema.safeParse(req.body);
    if (!parsed.success) return sendError(res, 400, "Invalid input", parsed.error.issues);

    const tenantId = req.user!.tenantId;

    try {
        const updated = await updateSection(tenantId, id, parsed.data);
        return res.json(updated);
    } catch (error: any) {
        if (error?.status) return sendError(res, error.status, error.message || "Request failed");
        if (error?.code === 11000) return sendError(res, 409, "Section code already exists for this class");
        throw error;
    }
}
sectionRouter.patch("/:id", requireSchoolPermission("sections.update"), updateSectionHandler);

export async function deleteSectionHandler(req: any, res: any) {
    const id = String(req.params.id);
    if (!isValidObjectId(id)) return sendError(res, 400, "Invalid section id");

    const tenantId = req.user!.tenantId;

    try {
        await deactivateSection(tenantId, id);
        return sendOk(res);
    } catch (error: any) {
        if (error?.status) return sendError(res, error.status, error.message || "Request failed");
        throw error;
    }
}
sectionRouter.delete("/:id", requireSchoolPermission("sections.delete"), deleteSectionHandler);
